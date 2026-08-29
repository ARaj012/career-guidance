'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface Milestone {
  id: string
  title: string
  description?: string
}

interface RoadmapProgressTrackerProps {
  roadmapId: string
  milestones: Milestone[]
}

export default function RoadmapProgressTracker({ roadmapId, milestones }: RoadmapProgressTrackerProps) {
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => {
    async function fetchProgress() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('user_roadmap_progress')
        .select('milestone_id, is_completed')
        .eq('user_id', user.id)
        .eq('roadmap_id', roadmapId)

      const progressMap: Record<string, boolean> = {}
      if (data) {
        data.forEach(item => {
          progressMap[item.milestone_id] = item.is_completed
        })
      }
      setProgress(progressMap)
      setLoading(false)
    }
    fetchProgress()
  }, [roadmapId, supabase])

  const toggleMilestone = async (milestoneId: string, milestoneTitle: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    setUpdating(prev => ({ ...prev, [milestoneId]: true }))

    try {
      const currentStatus = progress[milestoneId] || false
      const newStatus = !currentStatus

      if (newStatus) {
        // Insert or update
        const { error } = await supabase
          .from('user_roadmap_progress')
          .upsert({
            user_id: user.id,
            roadmap_id: roadmapId,
            milestone_id: milestoneId,
            milestone_title: milestoneTitle,
            is_completed: newStatus,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,roadmap_id,milestone_id'
          })

        if (error) {
          console.error('Error updating progress:', error)
          return
        }
      } else {
        // Delete
        const { error } = await supabase
          .from('user_roadmap_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('roadmap_id', roadmapId)
          .eq('milestone_id', milestoneId)

        if (error) {
          console.error('Error deleting progress:', error)
          return
        }
      }

      setProgress(prev => ({ ...prev, [milestoneId]: newStatus }))
    } catch (error) {
      console.error('Error in toggleMilestone:', error)
    } finally {
      setUpdating(prev => ({ ...prev, [milestoneId]: false }))
    }
  }

  const completedCount = Object.values(progress).filter(Boolean).length
  const totalCount = milestones.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">{progressPercentage}%</div>
          <div className="text-xs text-gray-500">{completedCount} of {totalCount} completed</div>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
        <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
      </div>

      <div className="space-y-3">
        {milestones.map((milestone) => {
          const isCompleted = progress[milestone.id] || false
          const isUpdating = updating[milestone.id]

          return (
            <button
              key={milestone.id}
              onClick={() => toggleMilestone(milestone.id, milestone.title)}
              disabled={isUpdating}
              className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition text-left disabled:opacity-50"
            >
              <div className="mt-0.5">
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isCompleted ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                  {milestone.title}
                </p>
                {milestone.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{milestone.description}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
