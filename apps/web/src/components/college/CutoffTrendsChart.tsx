'use client'

import { useMemo, useState } from 'react'
import { Trophy, ChevronDown } from 'lucide-react'
import SimpleBarChart from './SimpleBarChart'

interface CutoffRow {
  year: number
  category: string | null
  cutoff_score: number | null
  cutoff_rank: number | null
  exam_name: string | null
  course_name: string | null
}

interface Series {
  key: string
  label: string
  metric: 'score' | 'rank'
  points: { year: number; value: number }[]
}

export default function CutoffTrendsChart({ cutoffs }: { cutoffs: CutoffRow[] }) {
  const [open, setOpen] = useState(false)

  const series = useMemo<Series[]>(() => {
    const groups = new Map<string, Series>()

    for (const row of cutoffs) {
      const metric: 'score' | 'rank' | null =
        row.cutoff_score !== null
          ? 'score'
          : row.cutoff_rank !== null
            ? 'rank'
            : null
      if (!metric) continue

      const examLabel = row.exam_name ?? 'Exam'
      const categoryLabel = row.category ?? 'General'
      const courseLabel = row.course_name ? ` — ${row.course_name}` : ''
      const key = `${examLabel}__${categoryLabel}__${row.course_name ?? ''}`

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: `${examLabel} · ${categoryLabel}${courseLabel}`,
          metric,
          points: [],
        })
      }
      groups.get(key)!.points.push({
        year: row.year,
        value: metric === 'score' ? (row.cutoff_score as number) : (row.cutoff_rank as number),
      })
    }

    // Only keep series with real multi-year data — never invent a trend
    return Array.from(groups.values())
      .map((s) => ({ ...s, points: s.points.sort((a, b) => a.year - b.year) }))
      .filter((s) => new Set(s.points.map((p) => p.year)).size >= 2)
      .sort((a, b) => b.points.length - a.points.length)
  }, [cutoffs])

  const [selectedKey, setSelectedKey] = useState<string | null>(
    series[0]?.key ?? null,
  )

  if (series.length === 0) return null

  const active = series.find((s) => s.key === selectedKey) ?? series[0]
  const chartData = active.points.map((p) => ({
    label: `${p.year}`,
    value: p.value,
  }))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" />
          Admission Cutoff Trends
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-5">
          {series.length > 1 && (
            <select
              value={active.key}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {series.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label} ({s.points.length} yrs)
                </option>
              ))}
            </select>
          )}
          {series.length === 1 && (
            <p className="text-sm font-medium text-gray-700 mb-4">{active.label}</p>
          )}

          <SimpleBarChart
            data={chartData}
            barColorClass="bg-orange-500"
            valueFormatter={(v) =>
              active.metric === 'rank' ? `Rank ${Math.round(v).toLocaleString('en-IN')}` : `${v}`
            }
          />
          <p className="text-xs text-gray-400 mt-3">
            {active.metric === 'rank'
              ? 'Closing rank — a lower number means a more competitive cutoff.'
              : 'Cutoff score for this category and year.'}
          </p>
        </div>
      )}
    </div>
  )
}
