import { Clock } from 'lucide-react'

interface ExamCountdownProps {
  examDate: string | null
  showLabel?: boolean
}

export default function ExamCountdown({ examDate, showLabel = true }: ExamCountdownProps) {
  if (!examDate) return null

  const now = new Date()
  const examDateObj = new Date(examDate)
  const diffTime = examDateObj.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Exam completed</span>
      </div>
    )
  }

  if (diffDays === 0) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Exam Today!</span>
      </div>
    )
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return 'text-red-600'
    if (days <= 7) return 'text-orange-600'
    if (days <= 15) return 'text-yellow-600'
    return 'text-blue-600'
  }

  const getUrgencyLabel = (days: number) => {
    if (days === 1) return 'Tomorrow'
    if (days <= 3) return `${days} days left`
    if (days <= 7) return '1 week left'
    if (days <= 15) return '2 weeks left'
    return `${days} days remaining`
  }

  return (
    <div className={`flex items-center gap-2 ${getUrgencyColor(diffDays)}`}>
      <Clock className="w-4 h-4" />
      {showLabel && <span className="text-sm font-medium">{getUrgencyLabel(diffDays)}</span>}
      {!showLabel && <span className="text-sm font-medium">{diffDays}d</span>}
    </div>
  )
}
