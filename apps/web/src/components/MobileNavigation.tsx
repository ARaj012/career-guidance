'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Briefcase, GraduationCap, FileText, BookOpen, DollarSign, Bell, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import NotificationCenter from './NotificationCenter'

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const menuItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Briefcase, label: 'Careers', href: '/careers' },
    { icon: GraduationCap, label: 'Colleges', href: '/colleges' },
    { icon: FileText, label: 'Exams', href: '/exams' },
    { icon: BookOpen, label: 'Scholarships', href: '/scholarships' },
    { icon: DollarSign, label: 'Blog', href: '/blog' },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          CareerGuide
        </Link>
        <div className="flex items-center gap-4">
          <NotificationCenter />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-600 hover:text-indigo-600"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setIsOpen(false)}>
          <div className="bg-white h-full w-64 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-100">
              {user ? (
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
