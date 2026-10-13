import { Calendar, Clock, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface ExamStatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  interested: { label: 'Interested', color: 'bg-gray-100 text-gray-700', icon: Info },
  registration_open: { label: 'Registration Open', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  registration_closing_soon: { label: 'Closing Soon', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  registration_closed: { label: 'Registration Closed', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  admit_card_available: { label: 'Admit Card Available', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  exam_approaching: { label: 'Exam Approaching', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  exam_today: { label: 'Exam Today', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  exam_completed: { label: 'Exam Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  result_declared: { label: 'Result Declared', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

export default function ExamStatusBadge({ status }: ExamStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.interested
  const Icon = config.icon

  return (
    <span className={`${config.color} inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}
