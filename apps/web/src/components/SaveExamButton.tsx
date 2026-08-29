'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Heart, BookmarkCheck } from 'lucide-react'

interface SaveExamButtonProps {
  examId: string
}

export default function SaveExamButton({ examId }: SaveExamButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkSaved() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('user_saved_exams')
        .select('id')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .maybeSingle()

      setIsSaved(!!data)
      setLoading(false)
    }
    checkSaved()
  }, [examId, supabase])

  const toggleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    setToggling(true)

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('user_saved_exams')
          .delete()
          .eq('user_id', user.id)
          .eq('exam_id', examId)
        if (error) {
          console.error('Error unsaving exam:', error)
          alert('Failed to unsave exam. Please try again.')
          setToggling(false)
          return
        }
        setIsSaved(false)
      } else {
        const { error } = await supabase
          .from('user_saved_exams')
          .insert({ user_id: user.id, exam_id: examId })
        if (error) {
          console.error('Error saving exam:', error)
          alert('Failed to save exam. Please try again.')
          setToggling(false)
          return
        }
        setIsSaved(true)
      }
    } catch (err) {
      console.error('Error in toggleSave:', err)
      alert('An error occurred. Please try again.')
    }

    setToggling(false)
  }

  if (loading) {
    return (
      <button disabled className="inline-flex items-center gap-2 border border-gray-200 text-gray-400 text-sm font-medium px-4 py-2.5 rounded-lg">
        <Heart className="w-4 h-4" /> Save
      </button>
    )
  }

  return (
    <button
      onClick={toggleSave}
      disabled={toggling}
      className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
        isSaved
          ? 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
      {isSaved ? 'Saved' : 'Save Exam'}
    </button>
  )
}
