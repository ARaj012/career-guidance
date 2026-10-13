'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Bell, Check, Trash2, Calendar, Target, AlertCircle, X } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  metadata: any
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
  }, [filter])

  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const url = filter === 'unread' ? '/api/notifications?unreadOnly=true' : '/api/notifications'
    const response = await fetch(url)
    const data = await response.json()
    setNotifications(data.notifications || [])
    setUnreadCount(data.unreadCount || 0)
    setLoading(false)
  }

  const markAsRead = async (notificationIds: string[]) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds, markAsRead: true }),
    })
    loadNotifications()
  }

  const deleteNotification = async (notificationId: string) => {
    await fetch(`/api/notifications?notificationId=${notificationId}`, {
      method: 'DELETE',
    })
    loadNotifications()
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  const deleteAll = async () => {
    await fetch('/api/notifications?all=true', {
      method: 'DELETE',
    })
    loadNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam_reminder':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'saved_item_update':
        return <Target className="w-5 h-5 text-green-600" />
      case 'recommendation':
        return <Target className="w-5 h-5 text-purple-600" />
      case 'system':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Check className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={deleteAll}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread' ? 'No unread notifications' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm p-6 transition-all ${
                  !notification.is_read ? 'border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead([notification.id])}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{notification.message}</p>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
