'use client'

interface Exam {
  id: string
  title?: string
  name?: string
  slug: string
  exam_schedules?: Array<{
    exam_date_start: string | null
    registration_start: string | null
    registration_end: string | null
  }>
  exam_date?: string | null
  registration_start_date?: string | null
  registration_end_date?: string | null
}

interface ExamCalendarProps {
  trackedExams: Exam[]
}

export default function ExamCalendar({ trackedExams }: ExamCalendarProps) {
  if (trackedExams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">📅</span>
        </div>
        <p>No tracked exams to display</p>
      </div>
    )
  }

  // Filter exams with dates - handle different schema structures
  const examsWithDates = trackedExams.filter(exam => {
    // Check for dates in exam_schedules first
    if (exam.exam_schedules?.[0]?.exam_date_start) return true
    // Check for direct date fields
    if (exam.exam_date) return true
    return false
  })
  
  if (examsWithDates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-sm mb-2">Calendar needs exam dates</p>
        <p className="text-xs text-gray-400">Re-track exams from exam pages to see calendar</p>
      </div>
    )
  }

  // Sort exams by date (only those with dates)
  const sortedExams = examsWithDates.sort((a, b) => {
    const dateA = a.exam_schedules?.[0]?.exam_date_start ? new Date(a.exam_schedules[0].exam_date_start).getTime() : 
                 a.exam_date ? new Date(a.exam_date).getTime() : Infinity
    const dateB = b.exam_schedules?.[0]?.exam_date_start ? new Date(b.exam_schedules[0].exam_date_start).getTime() : 
                 b.exam_date ? new Date(b.exam_date).getTime() : Infinity
    return dateA - dateB
  })

  return (
    <div className="space-y-3">
      {sortedExams.map((exam) => {
        // Handle different date field names
        const examDate = exam.exam_schedules?.[0]?.exam_date_start || exam.exam_date
        const daysRemaining = examDate 
          ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null

        return (
          <div key={exam.id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-md">
              <span className="text-lg">📅</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{exam.title || exam.name || exam.slug}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {examDate && (
                  <>
                    <span className="font-medium">{new Date(examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {daysRemaining !== null && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        daysRemaining > 30 
                          ? 'bg-green-500 text-white' 
                          : daysRemaining > 7 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-red-500 text-white'
                      }`}>
                        {daysRemaining > 0 ? `${daysRemaining}d left` : 'Today'}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
