'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Star, MessageSquare, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ReviewRow {
  id: string
  user_id: string
  rating: number
  comment: string | null
  is_current_student: boolean
  reviewer_name: string
  created_at: string
}

function StarRow({
  rating,
  size = 'w-4 h-4',
}: {
  rating: number
  size?: string
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${
            n <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function CollegeReviews({ collegeId }: { collegeId: string }) {
  const supabase = createClient()

  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [myRating, setMyRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isCurrentStudent, setIsCurrentStudent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData?.user?.id ?? null
      setUserId(uid)

      const { data: reviewData } = await supabase
        .from('college_reviews')
        .select('*')
        .eq('college_id', collegeId)
        .order('created_at', { ascending: false })

      const list = reviewData ?? []
      setReviews(list)

      if (uid) {
        const mine = list.find((r) => r.user_id === uid)
        if (mine) {
          setMyRating(mine.rating)
          setComment(mine.comment ?? '')
          setIsCurrentStudent(mine.is_current_student)
        }
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId])

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  async function handleSubmit() {
    if (!userId || myRating === 0) return
    setSubmitting(true)
    setError(null)

    const { data: userRow } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single()

    const { error: upsertError } = await supabase
      .from('college_reviews')
      .upsert(
        {
          college_id: collegeId,
          user_id: userId,
          rating: myRating,
          comment: comment.trim() || null,
          is_current_student: isCurrentStudent,
          reviewer_name: userRow?.full_name || 'Student',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'college_id,user_id' },
      )

    if (upsertError) {
      setError('Could not submit your review. Please try again.')
    } else {
      const { data: reviewData } = await supabase
        .from('college_reviews')
        .select('*')
        .eq('college_id', collegeId)
        .order('created_at', { ascending: false })
      setReviews(reviewData ?? [])
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Student Ratings & Reviews
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRow rating={avgRating} />
            <span className="text-sm font-semibold text-gray-700">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      {/* Submit form */}
      {userId ? (
        <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {reviews.some((r) => r.user_id === userId)
              ? 'Update your review'
              : 'Rate this college'}
          </p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMyRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    n <= (hoverRating || myRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience — academics, campus life, placements..."
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={isCurrentStudent}
                onChange={(e) => setIsCurrentStudent(e.target.checked)}
                className="rounded border-gray-300"
              />
              I currently study / studied here
            </label>
            <button
              onClick={handleSubmit}
              disabled={submitting || myRating === 0}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Submit
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        !loading && (
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100 text-sm text-gray-500">
            <Link
              href="/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Log in
            </Link>{' '}
            to rate this college and share your experience.
          </div>
        )
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Loading reviews...
        </p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No reviews yet — be the first to share your experience.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {r.reviewer_name}
                  </span>
                  {r.is_current_student && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      Current / Alumni Student
                    </span>
                  )}
                </div>
                <StarRow rating={r.rating} size="w-3.5 h-3.5" />
              </div>
              {r.comment && (
                <p className="text-sm text-gray-600 leading-relaxed mt-1">
                  {r.comment}
                </p>
              )}
              <p className="text-xs text-gray-300 mt-1">
                {new Date(r.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
