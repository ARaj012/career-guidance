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
  const clean = data.filter((d) => d.value !== null && d.value !== undefined)

  if (clean.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400"
        style={{ height: heightPx }}
      >
        {emptyMessage}
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
