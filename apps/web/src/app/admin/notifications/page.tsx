'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, Trash2, Plus, AlertCircle, Info, CheckCircle } from 'lucide-react'

type AdminNotification = {
  id: string
  type: string
  severity: string
  title: string
  message: string
  table_name: string | null
  record_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  expires_at: string | null
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newNotification, setNewNotification] = useState({
    type: 'system',
    severity: 'info',
    title: '',
    message: '',
    table_name: '',
    record_id: '',
    expires_at: ''
  })

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications')
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setNotifications(json.notifications || [])
      }
    } catch (err) {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'mark_read' })
      })
      if (res.ok) {
        loadNotifications()
      }
    } catch (err) {
      setError('Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      })
      if (res.ok) {
        loadNotifications()
      }
    } catch (err) {
      setError('Failed to mark all as read')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        loadNotifications()
      }
    } catch (err) {
      setError('Failed to delete notification')
    }
  }

  const createNotification = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      })
      if (res.ok) {
        setShowCreateModal(false)
        setNewNotification({
          type: 'system',
          severity: 'info',
          title: '',
          message: '',
          table_name: '',
          record_id: '',
          expires_at: ''
        })
        loadNotifications()
      } else {
        const json = await res.json()
        setError(json.error || 'Failed to create notification')
      }
    } catch (err) {
      setError('Failed to create notification')
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-orange-50 border-orange-200'
      case 'info': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system notifications and alerts for administrators
          </p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            >
              <Check className="w-4 h-4" /> Mark all as read
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Create Notification
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
          <p className="text-sm text-gray-500">Total Notifications</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          <p className="text-sm text-gray-500">Unread</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">{notifications.filter(n => n.severity === 'critical').length}</p>
          <p className="text-sm text-gray-500">Critical</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-orange-600">{notifications.filter(n => n.severity === 'warning').length}</p>
          <p className="text-sm text-gray-500">Warnings</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Notifications List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No notifications found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg ${getSeverityColor(notification.severity)}`}>
                    {getSeverityIcon(notification.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="capitalize">{notification.type}</span>
                          <span>•</span>
                          <span>{new Date(notification.created_at).toLocaleString('en-IN')}</span>
                          {notification.expires_at && (
                            <>
                              <span>•</span>
                              <span>Expires: {new Date(notification.expires_at).toLocaleDateString('en-IN')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Notification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="freshness">Freshness</option>
                  <option value="system">System</option>
                  <option value="audit">Audit</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={newNotification.severity}
                  onChange={(e) => setNewNotification({...newNotification, severity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={3}
                  placeholder="Notification message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                <input
                  type="datetime-local"
                  value={newNotification.expires_at}
                  onChange={(e) => setNewNotification({...newNotification, expires_at: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewNotification({
                    type: 'system',
                    severity: 'info',
                    title: '',
                    message: '',
                    table_name: '',
                    record_id: '',
                    expires_at: ''
                  })
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createNotification}
                disabled={!newNotification.title || !newNotification.message}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
