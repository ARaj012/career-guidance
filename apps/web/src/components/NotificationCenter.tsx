'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Bell, X, Check, Calendar, DollarSign, BookOpen, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

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

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setNotifications(data as Notification[] || [])
      setUnreadCount((data as Notification[] || []).filter(n => !n.is_read).length)
      setLoading(false)
    }
    fetchNotifications()

    // Set up real-time subscription for new notifications
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20))
            setUnreadCount(prev => prev + 1)
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => 
              n.id === payload.new.id ? payload.new as Notification : n
            ))
          }
        })
        .subscribe()

      return channel
    }

    let channel: any
    setupSubscription().then(ch => {
      channel = ch
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const markAsRead = async (id: string) => {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', id)

    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = async (id: string) => {
    await supabase.from('user_notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (!notifications.find(n => n.id === id)?.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam_reminder':
        return <Calendar className="w-5 h-5 text-blue-500" />
      case 'saved_item_update':
        return <BookOpen className="w-5 h-5 text-green-500" />
      case 'recommendation':
        return <AlertCircle className="w-5 h-5 text-purple-500" />
      case 'scholarship':
        return <DollarSign className="w-5 h-5 text-emerald-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'exam_reminder':
        return 'bg-blue-50 border-blue-200'
      case 'saved_item_update':
        return 'bg-green-50 border-green-200'
      case 'recommendation':
        return 'bg-purple-50 border-purple-200'
      case 'scholarship':
        return 'bg-emerald-50 border-emerald-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffMs = now.getTime() - notificationDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return notificationDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-indigo-600 transition"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">{formatTime(notification.created_at)}</span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-xs text-indigo-600 hover:underline"
                              onClick={() => {
                                if (!notification.is_read) {
                                  markAsRead(notification.id)
                                }
                              }}
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <Link
                href="/notifications"
                className="block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
