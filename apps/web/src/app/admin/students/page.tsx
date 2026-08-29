'use client'

import { useEffect, useState } from 'react'
import { Search, UserCheck, UserX, AlertCircle } from 'lucide-react'

type UserAccount = {
  user_id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  last_login_at: string | null
  deactivated_at: string | null
  deactivated_by: string | null
  deactivation_reason: string | null
}

export default function AdminStudentsPage() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'last_login_at' | 'email'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [deactivationReason, setDeactivationReason] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    params.set('sort_by', sortBy)
    params.set('sort_order', sortOrder)
    
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error)
        else setUsers(json.users ?? [])
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [q, statusFilter, sortBy, sortOrder])

  const handleDeactivate = async () => {
    if (!selectedUser) return
    
    setActionLoading(selectedUser.user_id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          action: 'deactivate',
          reason: deactivationReason
        })
      })
      
      if (res.ok) {
        setShowDeactivateModal(false)
        setDeactivationReason('')
        setSelectedUser(null)
        load()
      } else {
        const json = await res.json()
        setError(json.error || 'Failed to deactivate user')
      }
    } catch (err) {
      setError('Failed to deactivate user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivate = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'activate'
        })
      })
      
      if (res.ok) {
        load()
      } else {
        const json = await res.json()
        setError(json.error || 'Failed to activate user')
      }
    } catch (err) {
      setError('Failed to activate user')
    } finally {
      setActionLoading(null)
    }
  }

  const openDeactivateModal = (user: UserAccount) => {
    setSelectedUser(user)
    setShowDeactivateModal(true)
  }

  const activeCount = users.filter(u => u.is_active).length
  const inactiveCount = users.filter(u => !u.is_active).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        View user accounts and manage activation status. You cannot modify student profile data.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-sm text-gray-500">Total Users</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-sm text-gray-500">Active Accounts</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
          <p className="text-sm text-gray-500">Inactive Accounts</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="created_at">Sort by Created</option>
          <option value="last_login_at">Sort by Last Login</option>
          <option value="email">Sort by Email</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50"
        >
          {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Account Info</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-8 text-gray-400" colSpan={4}>Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td className="px-4 py-8 text-gray-400" colSpan={4}>No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user.user_id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{user.full_name || 'No name'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-400">ID: {user.user_id.slice(0, 8)}…</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                      <UserCheck className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
                      <UserX className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {user.last_login_at 
                    ? new Date(user.last_login_at).toLocaleDateString('en-IN')
                    : 'Never'
                  }
                </td>
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <button
                      onClick={() => openDeactivateModal(user)}
                      disabled={actionLoading === user.user_id}
                      className="text-red-600 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(user.user_id)}
                      disabled={actionLoading === user.user_id}
                      className="text-emerald-600 hover:text-emerald-700 text-xs font-medium disabled:opacity-50"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Deactivate User Account</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                You are about to deactivate the account for:
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{selectedUser.full_name || 'No name'}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deactivation (optional)
              </label>
              <textarea
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="e.g. Violation of terms, request by user, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeactivateModal(false)
                  setDeactivationReason('')
                  setSelectedUser(null)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={actionLoading === selectedUser.user_id}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === selectedUser.user_id ? 'Deactivating…' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
