'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Calendar, Clock, Target, Heart, Filter, Bell, CheckCircle, ChevronDown } from 'lucide-react'
import ExamStatusBadge from '@/components/ExamStatusBadge'
import ExamCountdown from '@/components/ExamCountdown'
import ExamCalendar from '@/components/ExamCalendar'
import ExamRoadmap from '@/components/ExamRoadmap'
import DailyTaskList from '@/components/DailyTaskList'

interface TrackedExam {
  id: string
  user_id: string
  exam_id: string
  tracking_type: string
  current_status: string
  priority: number
  notes: string | null
  created_at: string
  exam: {
    id: string
    title?: string
    name?: string
    slug: string
    conducting_body?: string
    exam_level?: string
    mode?: string
    exam_schedules?: Array<{
      exam_date_start: string | null
      registration_start: string | null
      registration_end: string | null
    }>
    exam_date?: string | null
    registration_start_date?: string | null
    registration_end_date?: string | null
  } | null
  showRoadmap?: boolean
  showTasks?: boolean
}

export default function MyExamsPage() {
  const [trackedExams, setTrackedExams] = useState<TrackedExam[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'interested' | 'definitely_giving'>('all')
  const [hasSubscription, setHasSubscription] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadExams() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      // Check subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      const isActive = subscription?.status === 'active'
      setHasSubscription(isActive)

      if (!isActive) {
        setLoading(false)
        return
      }

      console.log('🔍 Loading tracked exams...')
      const response = await fetch('/api/exams/my-exams')
      const data = await response.json()
      console.log('📦 Tracked exams data:', data)
      setTrackedExams(data.trackedExams || [])
      setLoading(false)
    }
    loadExams()
  }, [supabase])

  const filteredExams = trackedExams.filter(exam => {
    if (filter === 'all') return true
    return exam.tracking_type === filter
  }) // Don't filter out null exams - we'll show them

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading your tracked exams...</p>
        </div>
      </div>
    )
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Required</h2>
          <p className="text-gray-600 mb-6">
            Exam tracking and notifications are available only to subscribers. Upgrade to access this feature.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">My Tracked Exams</h1>
              <p className="text-gray-600 text-sm">
                Track your exams, get notifications, and never miss important dates.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center gap-4 border border-gray-100">
          <Filter className="w-5 h-5 text-indigo-600" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({trackedExams.length})
            </button>
            <button
              onClick={() => setFilter('definitely_giving')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === 'definitely_giving' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Giving This ({trackedExams.filter(e => e.tracking_type === 'definitely_giving').length})
            </button>
            <button
              onClick={() => setFilter('interested')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === 'interested' 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Interested ({trackedExams.filter(e => e.tracking_type === 'interested').length})
            </button>
          </div>
        </div>

        {/* Exam List */}
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <Target className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No tracked exams yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start tracking exams to get personalized study plans, countdowns, and important notifications.
            </p>
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-200"
            >
              Browse Exams
              <span className="text-xl">→</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredExams.map((item) => {
              const exam = item.exam
              
              // Handle different database schema structures
              const examName = exam?.title || exam?.name || 'Tracked Exam'
              const examSlug = exam?.slug || 'exams'
              const conductingBody = exam?.conducting_body || 'N/A'
              
              // Handle different date field names
              const examDate = exam?.exam_schedules?.[0]?.exam_date_start || exam?.exam_date
              const regStart = exam?.exam_schedules?.[0]?.registration_start || exam?.registration_start_date
              const regEnd = exam?.exam_schedules?.[0]?.registration_end || exam?.registration_end_date
              
              // Calculate days remaining
              const daysRemaining = examDate 
                ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null
              
              // Determine if enough time for preparation
              const enoughTime = daysRemaining !== null && daysRemaining >= 90
              
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                >
                  {/* Header Gradient */}
                  <div className={`bg-gradient-to-r p-6 ${
                    item.tracking_type === 'definitely_giving' 
                      ? 'from-green-500 to-emerald-600' 
                      : 'from-pink-500 to-rose-600'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {examSlug && examSlug !== 'exams' ? (
                            <Link
                              href={`/exams/${examSlug}`}
                              className="text-2xl font-bold text-white hover:text-white/90 transition"
                            >
                              {examName}
                            </Link>
                          ) : (
                            <div className="text-2xl font-bold text-white">
                              {examName}
                            </div>
                          )}
                          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <ExamStatusBadge status={item.current_status} />
                          </div>
                        </div>
                        <p className="text-white/90 text-sm font-medium">
                          {conductingBody}
                        </p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                        {item.tracking_type === 'definitely_giving' ? (
                          <Target className="w-6 h-6 text-white" />
                        ) : (
                          <Heart className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Countdown and Features when we have proper data */}
                    {examDate && (
                      <div className="space-y-4 mb-6">
                        {/* Countdown */}
                        {daysRemaining !== null && (
                          <div className={`p-4 rounded-xl ${
                            enoughTime 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
                              : 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  enoughTime ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                  <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <span className="text-lg font-bold text-gray-900">
                                    {daysRemaining > 0 
                                      ? `${daysRemaining} days` 
                                      : daysRemaining === 0 
                                        ? 'Today!' 
                                        : 'Passed'}
                                  </span>
                                  <p className="text-xs text-gray-500">until exam</p>
                                </div>
                              </div>
                              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                enoughTime 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-red-500 text-white'
                              }`}>
                                {enoughTime ? '✓ On Track' : '⚠️ Hurry Up'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* AI Roadmap and Daily Tasks Section */}
                        <div className="mt-6 space-y-4">
                          <button
                            onClick={() => {
                              const updatedExams = trackedExams.map(e => 
                                e.id === item.id 
                                  ? { ...e, showRoadmap: !e.showRoadmap, showTasks: false }
                                  : { ...e, showRoadmap: false, showTasks: false }
                              )
                              setTrackedExams(updatedExams)
                            }}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-600 rounded-lg">
                                <Target className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-gray-900">AI Study Roadmap</p>
                                <p className="text-xs text-gray-600">Personalized plan based on {daysRemaining !== null ? `${daysRemaining} days` : 'time'} remaining</p>
                              </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${item.showRoadmap ? 'rotate-180' : ''}`} />
                          </button>

                          {item.showRoadmap && (
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                              <ExamRoadmap 
                                examId={item.exam_id} 
                                examTitle={examName} 
                                examDate={examDate}
                              />
                            </div>
                          )}

                          <button
                            onClick={() => {
                              const updatedExams = trackedExams.map(e => 
                                e.id === item.id 
                                  ? { ...e, showTasks: !e.showTasks, showRoadmap: false }
                                  : { ...e, showTasks: false, showRoadmap: false }
                              )
                              setTrackedExams(updatedExams)
                            }}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-600 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-gray-900">Daily Task List</p>
                                <p className="text-xs text-gray-600">Track your daily progress and stay on schedule</p>
                              </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${item.showTasks ? 'rotate-180' : ''}`} />
                          </button>

                          {item.showTasks && (
                            <DailyTaskList 
                              examId={item.exam_id} 
                              examTitle={examName} 
                              daysRemaining={daysRemaining}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Show exam dates if available */}
                    {(regStart || regEnd || examDate) && (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Important Dates
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {regStart && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <span className="text-gray-500 text-xs block mb-1">Registration Start</span>
                              <span className="text-gray-900 font-semibold">
                                {new Date(regStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                          {regEnd && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <span className="text-gray-500 text-xs block mb-1">Registration End</span>
                              <span className="text-gray-900 font-semibold">
                                {new Date(regEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                          {examDate && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <span className="text-gray-500 text-xs block mb-1">Exam Date</span>
                              <span className="text-gray-900 font-semibold">
                                {new Date(examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Tracked on {new Date(item.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      {examSlug && examSlug !== 'exams' && (
                        <Link
                          href={`/exams/${examSlug}`}
                          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-semibold hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all duration-200"
                        >
                          View Details
                          <span className="text-lg">→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Calendar and Notifications Section */}
        {trackedExams.length > 0 && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Exam Calendar</h3>
                  <p className="text-sm text-gray-500">View all your tracked exams with countdowns</p>
                </div>
              </div>
              <ExamCalendar trackedExams={trackedExams.filter(e => e.exam !== null).map(e => ({ ...e.exam!, exam_schedules: e.exam?.exam_schedules }))} />
              
              {trackedExams.filter(e => e.exam === null).length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs text-yellow-800 font-medium">
                    {trackedExams.filter(e => e.exam === null).length} exam(s) need re-tracking to show in calendar
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-500">Manage your exam notifications</p>
                </div>
              </div>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                Go to Notifications
                <span className="text-lg">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
