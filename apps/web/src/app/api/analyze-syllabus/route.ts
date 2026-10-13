import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { examId, examSlug, daysRemaining } = await req.json()
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get exam details
    const { data: exam } = await supabase
      .from('exams')
      .select('*')
      .eq('slug', examSlug)
      .maybeSingle()

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Generate syllabus analysis based on exam type and time remaining
    const analysis = generateSyllabusAnalysis(exam, daysRemaining)

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Error analyzing syllabus:', error)
    return NextResponse.json({ error: 'Failed to analyze syllabus' }, { status: 500 })
  }
}

function generateSyllabusAnalysis(exam: any, daysRemaining: number | null) {
  const examName = exam.name || exam.title || exam.slug || 'Exam'
  const timeAvailable = daysRemaining || 90
  
  // Generate high-priority topics based on exam type
  const highPriorityTopics = getHighPriorityTopics(examName, timeAvailable)
  
  // Generate study plan based on remaining time
  const studyPlan = generateTimeBasedStudyPlan(examName, timeAvailable, highPriorityTopics)
  
  return {
    examName,
    daysRemaining: timeAvailable,
    strategy: getStrategy(timeAvailable),
    highPriorityTopics,
    studyPlan,
    dailyHours: timeAvailable >= 90 ? '6-8 hours' : '10-12 hours',
    focusArea: timeAvailable >= 90 ? 'Comprehensive coverage' : 'High-weightage topics only'
  }
}

function getHighPriorityTopics(examName: string, daysRemaining: number) {
  const examLower = examName.toLowerCase()
  
  // Generate topics based on exam type
  if (examLower.includes('gate')) {
    return [
      { topic: 'Engineering Mathematics', weightage: 15, difficulty: 'high' },
      { topic: 'General Aptitude', weightage: 15, difficulty: 'medium' },
      { topic: 'Subject-specific topics (Core)', weightage: 70, difficulty: 'high' },
      { topic: 'Previous year papers (last 10 years)', weightage: 20, difficulty: 'high' },
      { topic: 'Numerical methods', weightage 10, difficulty: 'medium' },
      { topic: 'Formulas and shortcuts', weightage: 5, difficulty: 'low' }
    ]
  } else if (examLower.includes('upsc') || examLower.includes('cse')) {
    return [
      { topic: 'Current Affairs', weightage: 40, difficulty: 'medium' },
      { topic: 'History & Polity', weightage: 25, difficulty: 'high' },
      { topic: 'Geography & Environment', weightage: 20, difficulty: 'medium' },
      { topic: 'Economy & Science', weightage: 15, difficulty: 'medium' },
      { topic: 'CSAT (Decision making)', weightage: 30, difficulty: 'low' }
    ]
  } else if (examLower.includes('cat')) {
    return [
      { topic: 'Quantitative Aptitude', weightage: 34, difficulty: 'high' },
      { topic: 'Verbal Ability', weightage: 34, difficulty: 'medium' },
      { topic: 'Data Interpretation', weightage: 16, difficulty: 'medium' },
      { topic: 'Logical Reasoning', weightage: 16, difficulty: 'medium' },
      { topic: 'Reading Comprehension', weightage: 24, difficulty: 'low' }
    ]
  } else if (examLower.includes('jee')) {
    return [
      { topic: 'Physics', weightage: 33, difficulty: 'high' },
      { topic: 'Chemistry', weightage: 33, difficulty: 'high' },
      { topic: 'Mathematics', weightage: 34, difficulty: 'high' },
      { topic: 'Previous year questions', weightage: 25, difficulty: 'high' },
      { topic: 'Formula memorization', weightage: 10, difficulty: 'low' }
    ]
  } else {
    // Generic fallback
    return [
      { topic: 'Core subjects', weightage: 60, difficulty: 'high' },
      { topic: 'Previous year papers', weightage: 20, difficulty: 'high' },
      { topic: 'Practice tests', weightage: 15, difficulty: 'medium' },
      { topic: 'Revision of formulas', weightage: 5, difficulty: 'low' }
    ]
  }
}

function getStrategy(daysRemaining: number) {
  if (daysRemaining >= 180) {
    return 'Long-term comprehensive preparation'
  } else if (daysRemaining >= 90) {
    return 'Focused preparation with weekly targets'
  } else if (daysRemaining >= 30) {
    return 'Intensive preparation focusing on high-weightage topics'
  } else {
    return 'Emergency preparation - maximum practice and key topics only'
  }
}

function generateTimeBasedStudyPlan(examName: string, daysRemaining: number, highPriorityTopics: any[]) {
  const phases = []
  
  if (daysRemaining >= 180) {
    phases.push({
      name: 'Foundation Phase (Days 1-60)',
      tasks: [
        'Complete syllabus overview and topic categorization',
        'Build strong fundamentals in core subjects',
        'Set up daily study schedule (6-8 hours)',
        'Collect standard reference materials and past papers',
        ...highPriorityTopics.slice(0, 2).map(t => `Study ${t.topic} fundamentals`)
      ]
    })
    phases.push({
      name: 'Deep Learning Phase (Days 61-120)',
      tasks: [
        'Master each topic with in-depth study',
        'Practice topic-wise questions',
        'Create concise notes and formula sheets',
        'Join test series for continuous assessment',
        ...highPriorityTopics.slice(2, 4).map(t => `Focus on ${t.topic}`)
      ]
    })
    phases.push({
      name: 'Intensive Practice Phase (Days 121-180)',
      tasks: [
        'Full-length mock tests weekly',
        'Analyze weak areas and focus improvement',
        'Revision of important formulas and concepts',
        'Time management practice',
        ...highPriorityTopics.slice(4).map(t => `Perfect ${t.topic}`)
      ]
    })
  } else if (daysRemaining >= 90) {
    phases.push({
      name: 'Rapid Foundation (Days 1-30)',
      tasks: [
        'Quick syllabus overview',
        'Focus on high-weightage topics first',
        'Create condensed study materials',
        'Daily practice of 50+ questions',
        ...highPriorityTopics.slice(0, 3).map(t => `Study ${t.topic} basics`)
      ]
    })
    phases.push({
      name: 'Topic Mastery (Days 31-60)',
      tasks: [
        'Deep dive into important topics',
        'Practice previous year questions',
        'Topic-wise mock tests',
        'Regular revision schedule',
        ...highPriorityTopics.slice(3, 5).map(t => `Master ${t.topic}`)
      ]
    })
    phases.push({
      name: 'Final Sprint (Days 61-90)',
      tasks: [
        'Full mock tests every 3 days',
        'Focus on speed and accuracy',
        'Revision of key concepts',
        'Exam strategy planning',
        ...highPriorityTopics.map(t => `Perfect ${t.topic}`)
      ]
    })
  } else {
    phases.push({
      name: 'Emergency Preparation (All ' + daysRemaining + ' days)',
      tasks: [
        'Focus ONLY on high-weightage topics (70% syllabus)',
        'Practice previous year papers exclusively',
        'Daily full-length mock tests',
        'Quick revision of formulas and key concepts',
        'Prioritize accuracy over speed initially',
        'Identify and strengthen your strongest areas',
        ...highPriorityTopics.map(t => `Focus on ${t.topic} (high priority)`)
      ]
    })
  }
  
  return phases
}
