'use client'

interface BarDatum {
  label: string
  value: number
}

interface SimpleBarChartProps {
  data: BarDatum[]
  barColorClass?: string // tailwind bg-* class
  valueFormatter?: (value: number) => string
  heightPx?: number
  emptyMessage?: string
}

export default function SimpleBarChart({
  data,
  barColorClass = 'bg-indigo-500',
  valueFormatter = (v) => `${v}`,
  heightPx = 160,
  emptyMessage = 'Data not available yet',
}: SimpleBarChartProps) {
  const clean = data.filter((d) => d.value !== null && d.value !== undefined && d.value > 0)

  if (clean.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-sm text-gray-400 p-6 rounded-xl bg-gray-50"
        style={{ minHeight: heightPx }}
      >
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-center font-medium">{emptyMessage}</p>
        <p className="text-xs text-gray-400 mt-1">Data will be updated as more information becomes available</p>
      </div>
    )
  }

  const max = Math.max(...clean.map((d) => d.value), 1)

  return (
    <div
      className="flex items-end gap-3 sm:gap-4"
      style={{ height: heightPx }}
    >
      {clean.map((d) => {
        const pct = Math.max((d.value / max) * 100, 4)
        return (
          <div
            key={d.label}
            className="flex-1 flex flex-col items-center justify-end h-full group"
          >
            <span className="text-[11px] font-semibold text-gray-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {valueFormatter(d.value)}
            </span>
            <div
              className={`w-full max-w-[36px] rounded-t-md ${barColorClass} transition-all duration-300 hover:opacity-80`}
              style={{ height: `${pct}%` }}
              title={`${d.label}: ${valueFormatter(d.value)}`}
            />
            <span className="text-[11px] text-gray-400 mt-2 font-medium">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
