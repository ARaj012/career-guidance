'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, GraduationCap, LogOut, User as UserIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/careers',   label: 'Careers'    },
  { href: '/colleges',  label: 'Colleges'   },
  { href: '/exams',     label: 'Exams'      },
  { href: '/recommend', label: 'Get Advice' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDropdownOpen(false)
    router.push('/')
    router.refresh()
  }

  // Don't show navbar on login page
  if (pathname === '/login') return null

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const fullName = (user?.user_metadata?.full_name as string) || user?.email || ''
  const firstName = fullName.split(' ')[0]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Career<span className="text-indigo-600">Guide</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover border-2 border-indigo-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {firstName}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <GraduationCap className="w-4 h-4" /> Profile
                    </Link>
                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/dashboard'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">{firstName.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{firstName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Profile
                </Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium text-center">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      )}
    </nav>
  )
}
