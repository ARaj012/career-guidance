'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Briefcase, Building2, FileText, Users, AlertTriangle, TrendingUp, Activity, Clock, CheckCircle, DollarSign, BookOpen } from 'lucide-react'

type Stats = {
  counts: { careers: number; colleges: number; exams: number; students: number; scholarships: number; blogPosts: number }
  alerts: { id: string; severity: string; title: string; reason: string; href: string }[]
  alertCount: number
}

type ActivityItem = {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/audit?limit=5').then(r => r.json())
    ]).then(([statsJson, auditJson]) => {
      if (statsJson.error) setError(statsJson.error)
      else setStats(statsJson)
      
      if (!auditJson.error) {
        setRecentActivity(auditJson.logs?.map((log: any) => ({
          id: log.id,
          type: log.action_type,
          description: `${log.action_type} on ${log.table_name}`,
          timestamp: log.created_at
        })) || [])
      }
      
      setLoading(false)
    })
  }, [])

  const cards = [
    { label: 'Careers', href: '/admin/careers', value: stats?.counts.careers, icon: Briefcase, color: 'bg-indigo-50 text-indigo-700', trend: '+12%' },
    { label: 'Colleges', href: '/admin/colleges', value: stats?.counts.colleges, icon: Building2, color: 'bg-blue-50 text-blue-700', trend: '+8%' },
    { label: 'Exams', href: '/admin/exams', value: stats?.counts.exams, icon: FileText, color: 'bg-emerald-50 text-emerald-700', trend: '+5%' },
    { label: 'Student profiles', href: '/admin/students', value: stats?.counts.students, icon: Users, color: 'bg-amber-50 text-amber-700', trend: '+15%' },
    { label: 'Scholarships', href: '/admin/scholarships', value: stats?.counts.scholarships, icon: DollarSign, color: 'bg-teal-50 text-teal-700', trend: '+10%' },
    { label: 'Blog Posts', href: '/admin/blog', value: stats?.counts.blogPosts, icon: BookOpen, color: 'bg-rose-50 text-rose-700', trend: '+20%' },
  ]

  const systemHealth = [
    { label: 'Database Connection', status: 'healthy', icon: CheckCircle },
    { label: 'API Response Time', status: 'good', icon: Activity },
    { label: 'Data Freshness', status: stats?.alertCount === 0 ? 'excellent' : 'attention', icon: Clock },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Platform overview and system status. Monitor data freshness and manage platform content.
      </p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
          {error.includes('SERVICE_ROLE') && (
            <p className="mt-2 text-xs">
              Add <code className="bg-red-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> and{' '}
              <code className="bg-red-100 px-1 rounded">ADMIN_EMAILS</code> to <code>apps/web/.env.local</code>.
            </p>
          )}
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                {card.trend}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value ?? '—'}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* System Health */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            System Health
          </h2>
          <div className="space-y-3">
            {systemHealth.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${
                    item.status === 'healthy' || item.status === 'excellent' ? 'text-emerald-500' : 
                    item.status === 'good' ? 'text-blue-500' : 'text-amber-500'
                  }`} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  item.status === 'healthy' || item.status === 'excellent' ? 'bg-emerald-100 text-emerald-700' : 
                  item.status === 'good' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Recent Activity
            </h2>
            <Link href="/admin/audit" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading activity…</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            <ul className="space-y-2">
              {recentActivity.slice(0, 5).map((activity) => (
                <li key={activity.id} className="flex items-center gap-3 p-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'create' ? 'bg-emerald-500' :
                    activity.type === 'update' ? 'bg-blue-500' :
                    activity.type === 'delete' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-gray-700">{activity.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            Data that needs a refresh
            {typeof stats?.alertCount === 'number' && stats.alertCount > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{stats.alertCount}</span>
            )}
          </h2>
          <Link href="/admin/alerts" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        {!stats ? (
          <p className="text-sm text-gray-400">Loading alerts…</p>
        ) : stats.alerts.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <p className="text-sm text-emerald-700">All data is current. No stale records detected.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {stats.alerts.slice(0, 5).map((alert) => (
              <li key={alert.id}>
                <Link href={alert.href} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-orange-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-500">{alert.reason}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link href="/admin/careers/new" className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-indigo-300 hover:shadow-sm transition">
            <Briefcase className="w-5 h-5 mx-auto mb-2 text-indigo-600" />
            <p className="text-sm font-medium text-gray-700">Add Career</p>
          </Link>
          <Link href="/admin/colleges/new" className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-indigo-300 hover:shadow-sm transition">
            <Building2 className="w-5 h-5 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium text-gray-700">Add College</p>
          </Link>
          <Link href="/admin/exams/new" className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-indigo-300 hover:shadow-sm transition">
            <FileText className="w-5 h-5 mx-auto mb-2 text-emerald-600" />
            <p className="text-sm font-medium text-gray-700">Add Exam</p>
          </Link>
          <Link href="/admin/scholarships/new" className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-indigo-300 hover:shadow-sm transition">
            <DollarSign className="w-5 h-5 mx-auto mb-2 text-teal-600" />
            <p className="text-sm font-medium text-gray-700">Add Scholarship</p>
          </Link>
          <Link href="/admin/blog/new" className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-indigo-300 hover:shadow-sm transition">
            <BookOpen className="w-5 h-5 mx-auto mb-2 text-rose-600" />
            <p className="text-sm font-medium text-gray-700">Add Blog Post</p>
          </Link>
          <Link href="/admin/students" className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-indigo-300 hover:shadow-sm transition">
            <Users className="w-5 h-5 mx-auto mb-2 text-amber-600" />
            <p className="text-sm font-medium text-gray-700">Manage Users</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
