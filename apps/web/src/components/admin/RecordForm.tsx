'use client'

import { useEffect, useState } from 'react'
import type { FieldDef } from '@/lib/admin-schema'
import { slugify } from '@/lib/admin-schema'

type Props = {
  fields: FieldDef[]
  values: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  autoSlugFrom?: string
}

export default function RecordForm({ fields, values, onChange, autoSlugFrom }: Props) {
  const [touchedSlug, setTouchedSlug] = useState(Boolean(values.slug))

  useEffect(() => {
    if (!autoSlugFrom || touchedSlug) return
    const source = String(values[autoSlugFrom] ?? '')
    if (!source) return
    onChange({ ...values, slug: slugify(source) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSlugFrom, values[autoSlugFrom ?? '']])

  const set = (key: string, value: unknown) => {
    if (key === 'slug') setTouchedSlug(true)
    
    // Handle array fields - convert comma-separated string to array
    const isArrayField = fields.find(f => f.key === key)?.hint?.includes('comma-separated')
    if (isArrayField && typeof value === 'string') {
      const arrayValue = value.split(',').map(item => item.trim()).filter(item => item.length > 0)
      onChange({ ...values, [key]: arrayValue })
    } else {
      onChange({ ...values, [key]: value })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => {
        const value = values[field.key]
        const wide = field.type === 'textarea' || field.hint?.includes('comma-separated')
        const isArrayField = field.hint?.includes('comma-separated')
        
        // Convert array to comma-separated string for display
        const displayValue = isArrayField && Array.isArray(value) 
          ? value.join(', ') 
          : String(value ?? '')
        
        return (
          <label key={field.key} className={wide ? 'md:col-span-2 block' : 'block'}>
            <span className="block text-xs font-medium text-gray-600 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </span>
            {field.type === 'textarea' || isArrayField ? (
              <textarea
                value={displayValue}
                onChange={(e) => set(field.key, e.target.value)}
                rows={isArrayField ? 2 : 4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : field.type === 'boolean' ? (
              <button
                type="button"
                onClick={() => set(field.key, !value)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {value ? 'Yes' : 'No'}
              </button>
            ) : field.type === 'select' ? (
              <select
                value={String(value ?? '')}
                onChange={(e) => set(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select…</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
                value={value === null || value === undefined ? '' : String(value)}
                onChange={(e) => {
                  const raw = e.target.value
                  if (field.type === 'number') set(field.key, raw === '' ? null : Number(raw))
                  else set(field.key, raw)
                }}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
            {field.hint && <span className="mt-1 block text-xs text-gray-400">{field.hint}</span>}
          </label>
        )
      })}
    </div>
  )
}
