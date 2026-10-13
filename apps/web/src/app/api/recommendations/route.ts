import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Cache recommendations for 1 hour
export const revalidate = 3600

interface CareerWeight {
  weight: number
  subject_id: string
  career_id: string
  careers: {
    id: string
    title: string
    slug: string
    category: string
    avg_salary_min: number
    avg_salary_max: number
    growth_level: string
    competition_level: string
    demand_score: number
    is_trending: boolean
    description: string
  } | null
}

interface SubjectInput {
  subject_id: string
  score: number
  interest: number
}

interface CareerEntry {
  career: CareerWeight['careers']
  weightedSum: number
  totalWeight: number
  matchedSubjects: number
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { subjects } = await req.json() as { subjects: SubjectInput[] }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ error: 'subjects array is required' }, { status: 400 })
    }

    if (subjects.length > 20) {
      return NextResponse.json({ error: 'Too many subjects provided (max 20)' }, { status: 400 })
    }

    for (const subject of subjects) {
      if (!subject.subject_id || typeof subject.subject_id !== 'string') {
        return NextResponse.json({ error: 'Invalid subject_id' }, { status: 400 })
      }
      if (typeof subject.score !== 'number' || subject.score < 0 || subject.score > 100) {
        return NextResponse.json({ error: 'Invalid score (must be 0-100)' }, { status: 400 })
      }
      if (typeof subject.interest !== 'number' || subject.interest < 1 || subject.interest > 5) {
        return NextResponse.json({ error: 'Invalid interest (must be 1-5)' }, { status: 400 })
      }
    }

    const { data: weights, error } = await supabase
      .from('career_subject_weights')
      .select(`
        weight,
        subject_id,
        career_id,
        careers (
          id, title, slug, category,
          avg_salary_min, avg_salary_max,
          growth_level, competition_level,
          demand_score, is_trending, description
        )
      `)

    if (error) throw error

    const careerMap = new Map<string, CareerEntry>()

    for (const w of weights || []) {
  const typedW = w as unknown as CareerWeight
  const career = typedW.careers
  if (!career) continue

  if (!careerMap.has(career.id)) {
    careerMap.set(career.id, {
      career,
      weightedSum: 0,
      totalWeight: 0,
      matchedSubjects: 0
    })
  }

  const entry = careerMap.get(career.id)!
  entry.totalWeight += Number(typedW.weight)

  const userSubject = subjects.find(
    (s: SubjectInput) => s.subject_id === typedW.subject_id
  )

  if (userSubject) {
    entry.matchedSubjects++
    const normalizedScore = userSubject.score / 100
    const interestMultiplier = userSubject.interest / 5
    entry.weightedSum += Number(typedW.weight) * normalizedScore * interestMultiplier
  }
}

    const results = Array.from(careerMap.values())
      .filter(c => c.matchedSubjects > 0)
      .map(c => ({
        ...c.career,
        match_score: Math.round((c.weightedSum / c.totalWeight) * 100),
        matched_subjects: c.matchedSubjects
      }))
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10)

    return NextResponse.json({ recommendations: results })
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}