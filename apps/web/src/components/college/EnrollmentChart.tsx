'use client'

import { Users } from 'lucide-react'
import SimpleBarChart from './SimpleBarChart'

interface EnrollmentRow {
  year: number
  total_students: number
}

function formatStudents(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

export default function EnrollmentChart({ data }: { data: EnrollmentRow[] }) {
  const chartData = [...data]
    .sort((a, b) => a.year - b.year)
    .map((d) => ({ label: `${d.year}`, value: d.total_students }))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-500" />
        Student Enrollment Trend
      </h2>
      <SimpleBarChart
        data={chartData}
        barColorClass="bg-indigo-500"
        valueFormatter={formatStudents}
        emptyMessage="Enrollment history not available yet"
      />
    </div>
  )
}
