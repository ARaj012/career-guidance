'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Calendar, Clock, Trash2, ArrowRight, TrendingUp } from 'lucide-react'

interface RecommendationSession {
  id: string
  created_at: string
  stream: string
  subjects: any[]
  recommendations: any[]
}

export default function RecommendationHistoryPage() {
  const [sessions, setSessions] = useState<RecommendationSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data } = await supabase
        .from('user_recommendation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setSessions(data as RecommendationSession[] || [])
      setLoading(false)
    }
    fetchHistory()
  }, [supabase])

  const deleteSession = async (id: string) => {
    await supabase.from('user_recommendation_history').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTopCareer = (recommendations: any[]) => {
    return recommendations.length > 0 ? recommendations[0] : null
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
              <TrendingUp className="w-8 h-8 text-indigo-600" /> Recommendation History
            </h1>
            <p className="text-gray-500 mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''} saved</p>
          </div>
          <Link href="/recommend" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            New Recommendation →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No recommendation history yet</h2>
            <p className="text-gray-500 mb-6">Take the career quiz to see your personalized recommendations</p>
            <Link href="/recommend" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <TrendingUp className="w-4 h-4" /> Take Career Quiz
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const topCareer = getTopCareer(session.recommendations)
              return (
                <div key={session.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
                          {session.stream}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.created_at)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Clock className="w-4 h-4" />
                          {session.subjects.length} subjects
                        </div>
                      </div>

                      {topCareer && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Top Match</p>
                              <Link href={`/careers/${topCareer.slug}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-700">
                                {topCareer.title}
                              </Link>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                topCareer.match_score >= 70 ? 'text-green-600' :
                                topCareer.match_score >= 50 ? 'text-yellow-600' :
                                'text-red-500'
                              }`}>
                                {topCareer.match_score}%
                              </div>
                              <p className="text-xs text-gray-400">Match Score</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {session.recommendations.length} career recommendation{session.recommendations.length !== 1 ? 's' : ''}
                        </span>
                        <Link href="/recommend" className="text-indigo-600 text-sm font-medium hover:underline">
                          View all →
                        </Link>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteSession(session.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
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
