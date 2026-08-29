'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Heart, BookOpen, Calendar, ExternalLink, X, User } from 'lucide-react'

interface SavedExam {
  id: string
  created_at: string
  exams: any
}

export default function SavedExamsPage() {
  const [savedExams, setSavedExams] = useState<SavedExam[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSavedExams() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data } = await supabase
        .from('user_saved_exams')
        .select('id, created_at, exams(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setSavedExams(data as any || [])
      setLoading(false)
    }
    fetchSavedExams()
  }, [supabase])

  const removeSaved = async (id: string) => {
    await supabase.from('user_saved_exams').delete().eq('id', id)
    setSavedExams(prev => prev.filter(se => se.id !== id))
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'TBA'
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getLevelColor = (level: string) => {
    if (level === 'National') return 'bg-blue-100 text-blue-700'
    if (level === 'State') return 'bg-green-100 text-green-700'
    return 'bg-purple-100 text-purple-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-8 h-8 text-pink-500" /> Saved Exams
            </h1>
            <p className="text-gray-500 mt-1">{savedExams.length} exams saved</p>
          </div>
          <Link href="/exams" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Browse all exams →
          </Link>
        </div>

        {savedExams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved exams yet</h2>
            <p className="text-gray-500 mb-6">Start exploring exams and save your favorites to track important dates</p>
            <Link href="/exams" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <BookOpen className="w-4 h-4" /> Explore Exams
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedExams.map((saved) => {
              const exam = saved.exams
              const latestSchedule = exam.exam_schedules?.[0] || null

              return (
                <div key={saved.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/exams/${exam.slug}`} className="group">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                {exam.name}
                              </h3>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getLevelColor(exam.exam_level)}`}>
                                {exam.exam_level}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{exam.conducting_body}</p>
                          </div>
                        </div>
                      </Link>

                      {latestSchedule && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs text-gray-400">Exam:</span>
                            <span className="font-medium">{formatDate(latestSchedule.exam_date_start)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-xs text-gray-400">Apply:</span>
                            <span className="font-medium">{formatDate(latestSchedule.registration_start)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="text-xs text-gray-400">Result:</span>
                            <span className="font-medium">{formatDate(latestSchedule.result_date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="text-xs text-gray-400">Mode:</span>
                            <span className="font-medium">{exam.mode}</span>
                          </div>
                        </div>
                      )}

                      {exam.official_url && (
                        <div className="mt-3">
                          <a
                            href={exam.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            <ExternalLink className="w-3 h-3" /> Official Site
                          </a>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeSaved(saved.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from saved"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
