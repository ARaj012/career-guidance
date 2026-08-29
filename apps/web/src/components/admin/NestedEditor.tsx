'use client'

import { useEffect, useState } from 'react'
import RecordForm from '@/components/admin/RecordForm'
import type { NestedTable } from '@/lib/admin-schema'
import { Plus, Trash2, Save } from 'lucide-react'

type Props = {
  nested: NestedTable
  parentId: string
}

export default function NestedEditor({ nested, parentId }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/admin/records?table=${nested.table}&nestedOf=${nested.foreignKey}&parentId=${parentId}`)
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to load')
      return
    }
    let records = (json.records ?? []) as Record<string, unknown>[]
    if (nested.orderBy) {
      const col = nested.orderBy.column
      const dir = nested.orderBy.ascending ? 1 : -1
      records = [...records].sort((a, b) => {
        const av = Number(a[col] ?? 0)
        const bv = Number(b[col] ?? 0)
        if (av === bv) return 0
        return av > bv ? dir : -dir
      })
    }
    setRows(records)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nested.table, parentId])

  const save = async () => {
    setSaving(true)
    setError('')
    const payload = { ...draft, [nested.foreignKey]: parentId }
    const res = await fetch('/api/admin/records', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: nested.table, id: editingId, payload }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(json.error ?? 'Save failed')
      return
    }
    setDraft({})
    setEditingId(null)
    await load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this record?')) return
    const res = await fetch(`/api/admin/records?table=${nested.table}&id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Delete failed')
      return
    }
    await load()
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{nested.label}</h3>
        <span className="text-xs text-gray-400">{rows.length} records</span>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              {nested.fields.slice(0, 5).map((f) => (
                <th key={f.key} className="py-2 pr-3 font-medium">{f.label}</th>
              ))}
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-gray-400">No records yet</td></tr>
            )}
            {rows.map((row) => (
              <tr key={String(row.id)} className="border-b border-gray-50">
                {nested.fields.slice(0, 5).map((f) => (
                  <td key={f.key} className="py-2 pr-3 text-gray-700 max-w-[180px] truncate">
                    {row[f.key] === true ? 'Yes' : row[f.key] === false ? 'No' : String(row[f.key] ?? '—')}
                  </td>
                ))}
                <td className="py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditingId(String(row.id)); setDraft(row) }}
                      className="text-indigo-600 text-xs hover:underline"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(String(row.id))} className="text-red-500 text-xs hover:underline">
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          {editingId ? 'Edit record' : 'Add new'}
        </p>
        <RecordForm fields={nested.fields} values={draft} onChange={setDraft} />
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setDraft({}) }}
              className="px-3 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
