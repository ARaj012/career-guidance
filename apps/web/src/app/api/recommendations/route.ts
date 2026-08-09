import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
    const { subjects } = await req.json() as { subjects: SubjectInput[] }

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