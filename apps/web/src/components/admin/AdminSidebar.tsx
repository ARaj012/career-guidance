'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, Building2, FileText, Bell, Users,
  GraduationCap, LogOut, ArrowLeft, History, Settings, BookOpen, Map, DollarSign, Crown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/alerts', label: 'Data Alerts', icon: Bell },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/careers', label: 'Careers', icon: Briefcase },
  { href: '/admin/colleges', label: 'Colleges', icon: Building2 },
  { href: '/admin/exams', label: 'Exams', icon: FileText },
  { href: '/admin/skills', label: 'Skills', icon: BookOpen },
  { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/admin/roadmaps', label: 'Roadmaps', icon: Map },
  { href: '/admin/scholarships', label: 'Scholarships', icon: DollarSign },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Crown },
  { href: '/admin/audit', label: 'Audit Logs', icon: History },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 bg-slate-950 text-slate-200 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white leading-tight">CareerGuide</p>
            <p className="text-xs text-slate-400">Admin console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Student site
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  )
}
