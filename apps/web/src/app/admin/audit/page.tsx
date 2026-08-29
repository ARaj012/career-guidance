'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, FileText } from 'lucide-react'

type AuditLog = {
  id: string
  admin_email: string
  action_type: string
  table_name: string
  record_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  
  // Filters
  const [actionType, setActionType] = useState('')
  const [tableName, setTableName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  
  // Pagination
  const [page, setPage] = useState(0)
  const limit = 50

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (actionType) params.set('actionType', actionType)
    if (tableName) params.set('tableName', tableName)
    if (adminEmail) params.set('adminEmail', adminEmail)
    params.set('limit', limit.toString())
    params.set('offset', (page * limit).toString())
    
    fetch(`/api/admin/audit?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error)
        else {
          setLogs(json.logs ?? [])
          setTotal(json.total ?? 0)
        }
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [page, actionType, tableName, adminEmail])

  const totalPages = Math.ceil(total / limit)

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-emerald-50 text-emerald-700'
      case 'update': return 'bg-blue-50 text-blue-700'
      case 'delete': return 'bg-red-50 text-red-700'
      case 'activate': return 'bg-green-50 text-green-700'
      case 'deactivate': return 'bg-orange-50 text-orange-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const formatJson = (obj: Record<string, unknown> | null) => {
    if (!obj) return '—'
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return 'Invalid JSON'
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Track all administrative actions taken on the platform.
      </p>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Admin email…"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
          </select>
          <select
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="">All Tables</option>
            <option value="careers">Careers</option>
            <option value="colleges">Colleges</option>
            <option value="exams">Exams</option>
            <option value="user_accounts">User Accounts</option>
            <option value="user_profiles">User Profiles</option>
          </select>
          <button
            onClick={() => {
              setActionType('')
              setTableName('')
              setAdminEmail('')
              setPage(0)
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total Actions</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-indigo-600">{totalPages}</p>
          <p className="text-sm text-gray-500">Total Pages</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">{limit}</p>
          <p className="text-sm text-gray-500">Per Page</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Record ID</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-8 text-gray-400" colSpan={6}>Loading audit logs…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td className="px-4 py-8 text-gray-400" colSpan={6}>No audit logs found</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-500">
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-gray-700">{log.admin_email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                    {log.action_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{log.table_name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  {log.record_id ? log.record_id.slice(0, 8) + '…' : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      // In a real app, this would open a modal with full details
                      alert(`Old Values:\n${formatJson(log.old_values)}\n\nNew Values:\n${formatJson(log.new_values)}`)
                    }}
                    className="text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" /> View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}