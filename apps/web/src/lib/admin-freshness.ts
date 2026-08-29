import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export type FreshnessAlert = {
  id: string
  severity: AlertSeverity
  entity: 'exam' | 'college' | 'career'
  title: string
  reason: string
  href: string
  year?: number | null
}

const CURRENT_YEAR = new Date().getFullYear()

export async function getFreshnessAlerts(): Promise<FreshnessAlert[]> {
  const supabase = createAdminSupabaseClient()
  const alerts: FreshnessAlert[] = []

  const [{ data: exams }, { data: schedules }, { data: placements }, { data: cutoffs }, reviewsResult] =
    await Promise.all([
      supabase.from('exams').select('id, name, slug'),
      supabase.from('exam_schedules').select('exam_id, year, exam_date_start, registration_end'),
      supabase.from('college_placements').select('college_id, year, colleges(name, slug)'),
      supabase.from('college_exam_cutoffs').select('college_id, year, colleges(name, slug)'),
      supabase.from('admin_reviews').select('table_name, record_id, reviewed_at'),
    ])

  const reviews = reviewsResult.error ? [] : reviewsResult.data

  const reviewed = new Map<string, string>()
  for (const row of reviews ?? []) {
    reviewed.set(`${row.table_name}:${row.record_id}`, row.reviewed_at)
  }

  const latestScheduleByExam = new Map<string, { year: number; exam_date_start: string | null; registration_end: string | null }>()
  for (const row of schedules ?? []) {
    const year = Number(row.year ?? 0)
    const prev = latestScheduleByExam.get(row.exam_id)
    if (!prev || year > prev.year) {
      latestScheduleByExam.set(row.exam_id, {
        year,
        exam_date_start: row.exam_date_start,
        registration_end: row.registration_end,
      })
    }
  }

  for (const exam of exams ?? []) {
    const latest = latestScheduleByExam.get(exam.id)
    if (!latest) {
      alerts.push({
        id: `exam-nosched-${exam.id}`,
        severity: 'critical',
        entity: 'exam',
        title: exam.name,
        reason: 'No exam schedule on file. Students cannot see dates.',
        href: `/admin/exams/${exam.id}`,
      })
      continue
    }
    if (latest.year < CURRENT_YEAR) {
      alerts.push({
        id: `exam-year-${exam.id}`,
        severity: latest.year < CURRENT_YEAR - 1 ? 'critical' : 'warning',
        entity: 'exam',
        title: exam.name,
        reason: `Latest schedule is ${latest.year}. Add the ${CURRENT_YEAR} cycle.`,
        href: `/admin/exams/${exam.id}`,
        year: latest.year,
      })
    }
    if (latest.exam_date_start && new Date(latest.exam_date_start) < new Date() && latest.year <= CURRENT_YEAR) {
      const daysAgo = Math.floor((Date.now() - new Date(latest.exam_date_start).getTime()) / 86_400_000)
      if (daysAgo > 60 && latest.year < CURRENT_YEAR + 1) {
        alerts.push({
          id: `exam-past-${exam.id}`,
          severity: 'warning',
          entity: 'exam',
          title: exam.name,
          reason: `Exam date was ${daysAgo} days ago. Confirm next-year dates.`,
          href: `/admin/exams/${exam.id}`,
          year: latest.year,
        })
      }
    }
  }

  const latestPlacement = new Map<string, { year: number; name: string; slug: string }>()
  for (const row of placements ?? []) {
    const college = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges
    if (!college) continue
    const year = Number(row.year ?? 0)
    const prev = latestPlacement.get(row.college_id)
    if (!prev || year > prev.year) {
      latestPlacement.set(row.college_id, { year, name: college.name, slug: college.slug })
    }
  }
  for (const [collegeId, info] of latestPlacement) {
    if (info.year < CURRENT_YEAR - 1) {
      alerts.push({
        id: `place-${collegeId}`,
        severity: info.year < CURRENT_YEAR - 2 ? 'critical' : 'warning',
        entity: 'college',
        title: info.name,
        reason: `Placement stats last updated for ${info.year}.`,
        href: `/admin/colleges/${collegeId}`,
        year: info.year,
      })
    }
  }

  const latestCutoff = new Map<string, { year: number; name: string }>()
  for (const row of cutoffs ?? []) {
    const college = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges
    if (!college) continue
    const year = Number(row.year ?? 0)
    const prev = latestCutoff.get(row.college_id)
    if (!prev || year > prev.year) {
      latestCutoff.set(row.college_id, { year, name: college.name })
    }
  }
  for (const [collegeId, info] of latestCutoff) {
    if (info.year < CURRENT_YEAR - 1) {
      alerts.push({
        id: `cutoff-${collegeId}`,
        severity: 'info',
        entity: 'college',
        title: info.name,
        reason: `Admission cutoffs last recorded for ${info.year}.`,
        href: `/admin/colleges/${collegeId}`,
        year: info.year,
      })
    }
  }

  // Drop alerts that were recently marked reviewed (within 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 86_400_000
  return alerts
    .filter((alert) => {
      const table = alert.entity === 'exam' ? 'exams' : alert.entity === 'college' ? 'colleges' : 'careers'
      const recordId = alert.href.split('/').pop()
      const reviewedAt = reviewed.get(`${table}:${recordId}`)
      if (!reviewedAt) return true
      return new Date(reviewedAt).getTime() < thirtyDaysAgo
    })
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    })
}
