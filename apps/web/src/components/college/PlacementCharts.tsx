'use client'

import { useState } from 'react'
import { TrendingUp, ChevronDown } from 'lucide-react'
import SimpleBarChart from './SimpleBarChart'

interface PlacementRow {
  year: number
  average_package: number | null
  highest_package: number | null
}

function formatPackage(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

export default function PlacementCharts({ data }: { data: PlacementRow[] }) {
  const [open, setOpen] = useState(false)

  if (data.length === 0) return null

  // Take up to the last 5 years of data that actually exists — never invent years
  const sorted = [...data].sort((a, b) => a.year - b.year).slice(-5)
  const yearsAvailable = sorted.length

  const avgData = sorted
    .filter((d) => d.average_package)
    .map((d) => ({ label: `${d.year}`, value: d.average_package as number }))

  const highData = sorted
    .filter((d) => d.highest_package)
    .map((d) => ({ label: `${d.year}`, value: d.highest_package as number }))

  if (avgData.length === 0 && highData.length === 0) return null

  const headerLabel =
    yearsAvailable >= 2
      ? `Placement Trends (Last ${yearsAvailable} Years)`
      : `Placement Data (FY ${sorted[0].year})`

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          {headerLabel}
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-8 border-t border-gray-100 pt-6">
          {yearsAvailable < 2 && (
            <p className="text-xs text-gray-400 -mt-2">
              Only one year of placement data has been recorded so far —
              chart will expand into a trend line as more years are added.
            </p>
          )}
          {avgData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Average Package {yearsAvailable >= 2 ? 'vs Year' : `— FY ${avgData[0].label}`}
              </h3>
              <SimpleBarChart
                data={avgData}
                barColorClass="bg-emerald-500"
                valueFormatter={formatPackage}
                emptyMessage="Average package data not available yet"
              />
            </div>
          )}
          {highData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Highest Package {yearsAvailable >= 2 ? 'vs Year' : `— FY ${highData[0].label}`}
              </h3>
              <SimpleBarChart
                data={highData}
                barColorClass="bg-amber-500"
                valueFormatter={formatPackage}
                emptyMessage="Highest package data not available yet"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
