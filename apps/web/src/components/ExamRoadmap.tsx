'use client'

import { useState } from 'react'
import { Calendar, Target, BookOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface ExamRoadmapProps {
  examId: string
  examTitle: string
  examDate: string | null
}

export default function ExamRoadmap({ examId, examTitle, examDate }: ExamRoadmapProps) {
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Calculate days remaining
  const daysRemaining = examDate 
    ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const enoughTime = daysRemaining !== null && daysRemaining >= 90

  const generateRoadmap = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, examTitle, examDate }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRoadmap(data.roadmap)
      } else {
        setError(data.error || 'Failed to generate roadmap')
      }
    } catch (err) {
      setError('Failed to generate roadmap')
    } finally {
      setLoading(false)
    }
  }

  if (!enoughTime) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-2">Limited Time for Preparation</h3>
            <p className="text-sm text-red-700 mb-3">
              With only {daysRemaining} days remaining, you may need an intensive preparation strategy. 
              Consider focusing on high-weightage topics and practicing mock tests.
            </p>
            <button
              onClick={generateRoadmap}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Intensive Roadmap'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-indigo-900 mb-2">AI-Generated Study Roadmap</h3>
            <p className="text-sm text-indigo-700 mb-3">
              Get a personalized study plan with {daysRemaining} days of preparation time, 
              including daily targets, topic prioritization, and milestone tracking.
            </p>
            <button
              onClick={generateRoadmap}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate AI Roadmap'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-900">Your Personalized Roadmap</h3>
      </div>
      
      <div className="space-y-4">
        {roadmap.phases?.map((phase: any, index: number) => (
          <div key={index} className="border-l-2 border-indigo-200 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-gray-900">{phase.name}</span>
              <span className="text-sm text-gray-500">({phase.duration})</span>
            </div>
            <ul className="space-y-1 text-sm text-gray-600">
              {phase.tasks?.map((task: string, taskIndex: number) => (
                <li key={taskIndex} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
