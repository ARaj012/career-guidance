'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Check, Bell, BellOff, Filter } from 'lucide-react'

type Notification = {
  id: string
  type: string
  severity: string
  title: string
  message: string
  table_name: string | null
  record_id: string | null
  is_read: boolean
  created_at: string
  expires_at: string | null
}

export default function AdminAlertsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/notifications')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error)
        else {
          setNotifications(json.notifications ?? [])
          setUnreadCount(json.notifications?.filter((n: Notification) => !n.is_read).length ?? 0)
        }
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  const markReviewed = async (notification: Notification) => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notification.id, action: 'mark_read' }),
    })
    load()
  }

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    })
    load()
  }

  const visible = notifications.filter((n) => {
    if (filter === 'unread' && n.is_read) return false
    if (filter !== 'all' && filter !== 'unread' && n.severity !== filter) return false
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    return true
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500'
      case 'warning': return 'text-orange-500'
      case 'info': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-100'
      case 'warning': return 'bg-orange-50 border-orange-100'
      case 'info': return 'bg-blue-50 border-blue-100'
      default: return 'bg-gray-50 border-gray-100'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Freshness Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Data freshness alerts and important system updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            <Check className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-2xl font-bold text-indigo-600">{unreadCount}</p>
              <p className="text-sm text-gray-500">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">
                {notifications.filter(n => n.severity === 'critical').length}
              </p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {notifications.filter(n => n.severity === 'warning').length}
              </p>
              <p className="text-sm text-gray-500">Warnings</p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'unread', 'critical', 'warning', 'info'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                filter === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white"
          >
            <option value="all">All Types</option>
            <option value="system">System</option>
            <option value="audit">Audit</option>
            <option value="security">Security</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y">
        {loading ? (
          <p className="p-6 text-sm text-gray-400">Loading notifications…</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No notifications in this filter.</p>
        ) : visible.map((notification) => (
          <div 
            key={notification.id} 
            className="p-4 flex items-start justify-between gap-4"
          >
            <div className="flex gap-3">
              <AlertTriangle className={`w-4 h-4 mt-1 ${getSeverityColor(notification.severity)}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-400 uppercase">
                    {notification.type} · {notification.severity}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {!notification.is_read && (
                <button
                  onClick={() => markReviewed(notification)}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-emerald-700 px-2 py-1"
                >
                  <Check className="w-4 h-4" /> Mark Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
