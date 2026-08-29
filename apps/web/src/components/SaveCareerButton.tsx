'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Heart, BookmarkCheck } from 'lucide-react'

interface SaveCareerButtonProps {
  careerId: string
}

export default function SaveCareerButton({ careerId }: SaveCareerButtonProps) {
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
        .from('user_saved_careers')
        .select('id')
        .eq('user_id', user.id)
        .eq('career_id', careerId)
        .maybeSingle()

      setIsSaved(!!data)
      setLoading(false)
    }
    checkSaved()
  }, [careerId, supabase])

  const toggleSave = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError)
      alert('Authentication error. Please log in again.')
      return
    }
    
    if (!user) {
      window.location.href = '/login'
      return
    }

    console.log('Attempting to save career:', { userId: user.id, careerId })
    setToggling(true)

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('user_saved_careers')
          .delete()
          .eq('user_id', user.id)
          .eq('career_id', careerId)
        if (error) {
          console.error('Error unsaving career:', error)
          alert(`Failed to unsave career: ${error.message || 'Unknown error'}`)
          setToggling(false)
          return
        }
        setIsSaved(false)
      } else {
        const { error } = await supabase
          .from('user_saved_careers')
          .insert({ user_id: user.id, career_id: careerId })
        if (error) {
          console.error('Error saving career:', error)
          alert(`Failed to save career: ${error.message || 'Unknown error'}`)
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
      {isSaved ? 'Saved' : 'Save Career'}
    </button>
  )
}
