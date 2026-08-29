'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RecordForm from '@/components/admin/RecordForm'
import NestedEditor from '@/components/admin/NestedEditor'
import { RESOURCES, type ResourceKey } from '@/lib/admin-schema'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

type Props = {
  resource: ResourceKey
  id?: string
}

export default function ResourceEditor({ resource, id }: Props) {
  const def = RESOURCES[resource]
  const router = useRouter()
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  // Get the correct resource path for navigation
  const getResourcePath = () => {
    if (resource === 'blog') return 'blog'
    return resource
  }

  const resourcePath = getResourcePath()

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/records?table=${def.table}&id=${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error)
        else setValues(json.record ?? {})
        setLoading(false)
      })
  }, [def.table, id])

  const save = async () => {
    setSaving(true)
    setError('')
    setSaved('')
    const res = await fetch('/api/admin/records', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: def.table, id, payload: values }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(json.error ?? 'Save failed')
      return
    }
    if (!id) {
      router.push(`/admin/${resourcePath}/${json.record.id}`)
      return
    }
    setValues(json.record)
    setSaved('Saved')
    setTimeout(() => setSaved(''), 2000)
  }

  const remove = async () => {
    if (!id || !confirm(`Delete this ${def.singular.toLowerCase()}? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/records?table=${def.table}&id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Delete failed')
      return
    }
    router.push(`/admin/${resourcePath}`)
  }

  if (loading) {
    return <p className="text-gray-500">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href={`/admin/${resourcePath}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to {def.label}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? `Edit ${def.singular}` : `New ${def.singular}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {id && (
            <button
              type="button"
              onClick={remove}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {saved && <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg">{saved}</div>}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <RecordForm
          fields={def.fields}
          values={values}
          onChange={setValues}
          autoSlugFrom={resource === 'careers' ? 'title' : resource === 'colleges' || resource === 'exams' ? 'name' : undefined}
        />
      </div>

      {id && def.nested?.map((nested) => (
        <NestedEditor key={nested.table} nested={nested} parentId={id} />
      ))}
    </div>
  )
}
