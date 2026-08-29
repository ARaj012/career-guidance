'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { RESOURCES } from '@/lib/admin-schema'

export default function AdminSubjectsPage() {
  const [records, setRecords] = useState<Record<string, unknown>[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const def = RESOURCES.subjects

  const load = async (search = q) => {
    setLoading(true)
    const params = new URLSearchParams({ table: 'subjects' })
    if (search) params.set('q', search)
    const res = await fetch(`/api/admin/records?${params}`)
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Failed to load')
      return
    }
    setError('')
    setRecords(json.records ?? [])
  }

  useEffect(() => {
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{def.label}</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit, or remove subjects shown to students.</p>
        </div>
        <Link
          href="/admin/subjects/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> New {def.singular}
        </Link>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); load(q) }}
        className="relative mb-4"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search subjects…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        />
      </form>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              {def.listColumns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">{col.label}</th>
              ))}
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-8 text-gray-400" colSpan={def.listColumns.length + 1}>Loading…</td></tr>
            ) : records.length === 0 ? (
              <tr><td className="px-4 py-8 text-gray-400" colSpan={def.listColumns.length + 1}>No records found</td></tr>
            ) : records.map((row) => (
              <tr key={String(row.id)} className="border-t border-gray-100 hover:bg-gray-50">
                {def.listColumns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-800">
                    {typeof row[col.key] === 'boolean'
                      ? (row[col.key] ? 'Yes' : 'No')
                      : String(row[col.key] ?? '—')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <Link href={`/admin/subjects/${row.id}`} className="text-indigo-600 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
