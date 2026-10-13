import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { examId, examTitle, examDate } = await req.json()
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Calculate days remaining
    const daysRemaining = examDate 
      ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 90 // Default to 90 days if no date

    // Generate AI roadmap (mock implementation for now)
    const roadmap = generateAIRoadmap(examTitle, daysRemaining)

    return NextResponse.json({ success: true, roadmap })
  } catch (error) {
    console.error('Error generating roadmap:', error)
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 })
  }
}

function generateAIRoadmap(examTitle: string, daysRemaining: number) {
  const phases = []
  
  if (daysRemaining >= 180) {
    // 6+ months - comprehensive preparation
    phases.push({
      name: 'Foundation Phase',
      duration: 'Months 1-2',
      tasks: [
        'Complete syllabus overview and topic categorization',
        'Build strong fundamentals in core subjects',
        'Set up daily study schedule (6-8 hours)',
        'Collect standard reference materials and past papers'
      ]
    })
    phases.push({
      name: 'Deep Learning Phase',
      duration: 'Months 3-4',
      tasks: [
        'Master each topic with in-depth study',
        'Practice topic-wise questions',
        'Create concise notes and formula sheets',
        'Join test series for continuous assessment'
      ]
    })
    phases.push({
      name: 'Intensive Practice Phase',
      duration: 'Months 5-6',
      tasks: [
        'Full-length mock tests weekly',
        'Analyze weak areas and focus improvement',
        'Revision of important formulas and concepts',
        'Time management practice'
      ]
    })
  } else if (daysRemaining >= 90) {
    // 3-6 months - focused preparation
    phases.push({
      name: 'Rapid Foundation',
      duration: 'First 30 days',
      tasks: [
        'Quick syllabus overview',
        'Focus on high-weightage topics first',
        'Create condensed study materials',
        'Daily practice of 50+ questions'
      ]
    })
    phases.push({
      name: 'Topic Mastery',
      duration: 'Days 31-60',
      tasks: [
        'Deep dive into important topics',
        'Practice previous year questions',
        'Topic-wise mock tests',
        'Regular revision schedule'
      ]
    })
    phases.push({
      name: 'Final Sprint',
      duration: 'Days 61-90',
      tasks: [
        'Full mock tests every 3 days',
        'Focus on speed and accuracy',
        'Revision of key concepts',
        'Exam strategy planning'
      ]
    })
  } else {
    // Less than 3 months - intensive preparation
    phases.push({
      name: 'Emergency Preparation',
      duration: 'All remaining days',
      tasks: [
        'Focus ONLY on high-weightage topics (70% syllabus)',
        'Practice previous year papers exclusively',
        'Daily full-length mock tests',
        'Quick revision of formulas and key concepts',
        'Prioritize accuracy over speed initially',
        'Identify and strengthen your strongest areas'
      ]
    })
  }

  return {
    examTitle,
    daysRemaining,
    phases,
    dailyHours: daysRemaining >= 90 ? '6-8 hours' : '10-12 hours',
    keyFocus: daysRemaining >= 90 ? 'Comprehensive coverage' : 'High-weightage topics only'
  }
}
