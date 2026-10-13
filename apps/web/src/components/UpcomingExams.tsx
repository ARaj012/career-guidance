'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Calendar, Clock, Target, Lock } from 'lucide-react'
import ExamCountdown from './ExamCountdown'

interface UpcomingExam {
  id: string
  tracking_type: string
  daysRemaining: number | null
  nextImportantDate: string | null
  nextImportantDateType: string | null
  exams: {
    id: string
    title: string
    slug: string
    conducting_body: string
    exam_schedules: Array<{
      registration_start: string | null
      registration_end: string | null
      exam_date_start: string | null
      result_date: string | null
      year: number | null
    }>
  }
}

export default function UpcomingExams() {
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSubscription, setHasSubscription] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadUpcomingExams() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Check subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      setHasSubscription(subscription?.status === 'active')

      if (!hasSubscription) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/exams/upcoming?limit=3')
      const data = await response.json()
      setUpcomingExams(data.upcomingExams || [])
      setLoading(false)
    }
    loadUpcomingExams()
  }, [supabase, hasSubscription])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="text-gray-500">Loading upcoming exams...</div>
      </div>
    )
  }

  if (!hasSubscription) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Exams
          </h3>
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Track your exams and get countdowns with a subscription
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    )
  }

  if (upcomingExams.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Exams
          </h3>
          <Link href="/exams" className="text-indigo-600 text-sm hover:underline">
            Browse Exams
          </Link>
        </div>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No upcoming exams tracked</p>
          <Link
            href="/exams"
            className="inline-block mt-3 text-indigo-600 text-sm font-medium hover:underline"
          >
            Start tracking exams
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Exams
        </h3>
        <Link href="/my-exams" className="text-indigo-600 text-sm hover:underline">
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {upcomingExams.map((item) => {
          const exam = item.exams
          const schedule = exam?.exam_schedules?.[0]
          
          return (
            <Link
              key={item.id}
              href={`/exams/${exam.slug}`}
              className="block p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{exam.title}</h4>
                  <p className="text-sm text-gray-500">{exam.conducting_body}</p>
                </div>
                {item.tracking_type === 'definitely_giving' && (
                  <Target className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                )}
              </div>
              {schedule && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {schedule.exam_date_start
                        ? new Date(schedule.exam_date_start).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'TBA'}
                    </span>
                  </div>
                  <ExamCountdown examDate={schedule.exam_date_start} />
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
