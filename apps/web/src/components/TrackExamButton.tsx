'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Heart, BookmarkCheck, Target, AlertCircle } from 'lucide-react'

interface TrackExamButtonProps {
  examId: string
  examSlug: string
}

export default function TrackExamButton({ examId, examSlug }: TrackExamButtonProps) {
  const [isTracked, setIsTracked] = useState(false)
  const [trackingType, setTrackingType] = useState<'interested' | 'definitely_giving' | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        setCheckingSubscription(false)
        return
      }

      // Check subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      setHasSubscription(subscription?.status === 'active')
      setCheckingSubscription(false)

      // Check if tracked
      const { data } = await supabase
        .from('user_saved_exams')
        .select('tracking_type')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .maybeSingle()

      setIsTracked(!!data)
      setTrackingType(data?.tracking_type || null)
      setLoading(false)
    }
    checkStatus()
  }, [examId, supabase])

  const trackExam = async (type: 'interested' | 'definitely_giving') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    if (!hasSubscription) {
      window.location.href = '/pricing'
      return
    }

    setToggling(true)
    setShowMenu(false)

    try {
      console.log('🚀 Tracking exam:', { examId, examSlug, type })
      
      const response = await fetch('/api/track-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          examSlug, // Send both ID and slug for reliability
          trackingType: type,
        }),
      })

      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (!response.ok) {
        if (data.requiresSubscription) {
          window.location.href = '/pricing'
          return
        }
        console.error('Tracking error details:', data)
        throw new Error(data.error || data.details || 'Failed to track exam')
      }

      setIsTracked(true)
      setTrackingType(type)
      console.log('✅ Exam tracked successfully')
    } catch (err) {
      console.error('❌ Error tracking exam:', err)
      alert(`Failed to track exam: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    setToggling(false)
  }

  const untrackExam = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setToggling(true)
    setShowMenu(false)

    try {
      const response = await fetch(`/api/track-exam?examId=${examId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to untrack exam')
      }

      setIsTracked(false)
      setTrackingType(null)
    } catch (err) {
      console.error('Error untracking exam:', err)
      alert('Failed to untrack exam. Please try again.')
    }

    setToggling(false)
  }

  if (loading || checkingSubscription) {
    return (
      <button disabled className="inline-flex items-center gap-2 border border-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg">
        <Heart className="w-4 h-4" /> Save
      </button>
    )
  }

  if (isTracked) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={toggling}
          className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
            trackingType === 'definitely_giving'
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
          }`}
        >
          {trackingType === 'definitely_giving' ? <Target className="w-4 h-4" /> : <BookmarkCheck className="w-4 h-4" />}
          {trackingType === 'definitely_giving' ? 'I\'m Giving This' : 'Interested'}
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <div className="py-1">
              <button
                onClick={() => trackExam('interested')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Heart className="w-4 h-4" /> Interested
              </button>
              <button
                onClick={() => trackExam('definitely_giving')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Target className="w-4 h-4" /> I'm Giving This
              </button>
              <hr className="my-1" />
              <button
                onClick={untrackExam}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Untrack Exam
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={toggling}
        className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Heart className="w-4 h-4" /> Track Exam
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              onClick={() => trackExam('interested')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Heart className="w-4 h-4" /> Interested
            </button>
            <button
              onClick={() => trackExam('definitely_giving')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Target className="w-4 h-4" /> I'm Giving This
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
