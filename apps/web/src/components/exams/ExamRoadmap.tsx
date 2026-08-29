'use client'

import { useMemo, useState } from 'react'

export interface SyllabusRow {
  subject: string
  topic: string | null
  weightage: number | null
  stage?: string | null
}

interface ExamRoadmapProps {
  syllabusRows: SyllabusRow[]
  /** Optional — used to personalize the disclaimer copy ("JEE Main's actual syllabus..." vs "This exam's actual syllabus..."). */
  examName?: string
  /**
   * Optional — the correct display order for stage tabs, e.g. ["Prelims","Mains"].
   * Pass the `stage` values from exam_pattern (already sorted by stage_order) here,
   * since exam_syllabus itself has no stage_order column and its rows aren't
   * guaranteed to come back from Postgres in insertion order. Without this,
   * stages fall back to first-seen order in syllabusRows, which can occasionally
   * put "Mains" before "Prelims".
   */
  stageOrder?: string[]
}

// Cycles through the same badge-pill hues already used elsewhere on this
// page (Eligibility section: yellow/blue/green/red), so new subjects don't
// introduce a new color language.
const SUBJECT_STYLES = [
  { chip: 'bg-indigo-50 text-indigo-700', bar: 'bg-indigo-600' },
  { chip: 'bg-blue-50 text-blue-700', bar: 'bg-blue-500' },
  { chip: 'bg-green-50 text-green-700', bar: 'bg-green-500' },
  { chip: 'bg-yellow-50 text-yellow-700', bar: 'bg-yellow-500' },
  { chip: 'bg-red-50 text-red-700', bar: 'bg-red-500' },
  { chip: 'bg-purple-50 text-purple-700', bar: 'bg-purple-500' },
] as const

function priorityLabel(w: number): string {
  if (w >= 20) return 'High priority'
  if (w >= 12) return 'Medium-high'
  if (w >= 8) return 'Medium'
  if (w >= 5) return 'Moderate'
  return 'Low'
}

// Renders the subject-accordion + distribution bar for one stage's rows.
// This is exactly what the original single-stage ExamRoadmap rendered — now
// reusable per-stage-tab for exams like UPSC (Prelims / Mains / Interview).
function StageRoadmap({ rows }: { rows: SyllabusRow[] }) {
  const bySubject = useMemo(() => {
    const map: Record<string, { total: number | null; topics: { topic: string; weightage: number | null }[] }> = {}
    for (const row of rows) {
      if (!row.subject) continue
      if (!map[row.subject]) map[row.subject] = { total: null, topics: [] }
      const isSubjectTotal = row.topic === null || row.topic === 'Overall Subject Weightage'
      if (isSubjectTotal) {
        map[row.subject].total = row.weightage
      } else if (row.topic) {
        map[row.subject].topics.push({ topic: row.topic, weightage: row.weightage })
      }
    }
    for (const s of Object.keys(map)) {
      map[s].topics.sort((a, b) => (b.weightage ?? -1) - (a.weightage ?? -1))
    }
    return map
  }, [rows])

  const subjects = Object.keys(bySubject)
  const [openSubject, setOpenSubject] = useState<string | null>(subjects[0] ?? null)

  if (subjects.length === 0) {
    return <p className="text-sm text-gray-400 italic">Topic-wise breakdown for this stage is coming soon.</p>
  }

  const maxTopicWeightage = Math.max(
    1,
    ...subjects.flatMap((s) => bySubject[s].topics.map((t) => t.weightage ?? 0))
  )
  const hasSubjectTotals = subjects.every((s) => bySubject[s].total != null)

  return (
    <div>
      {hasSubjectTotals && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-xs text-gray-500 mb-3">Marks distribution across subjects</p>
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-gray-100">
            {subjects.map((s, i) => {
              const style = SUBJECT_STYLES[i % SUBJECT_STYLES.length]
              const pct = bySubject[s].total ?? 0
              return (
                <div
                  key={s}
                  className={`${style.bar} flex items-center justify-center text-[10px] font-medium text-white first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${pct}%` }}
                  title={`${s}: ${pct}%`}
                >
                  {pct >= 12 ? `${pct}%` : ''}
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
            {subjects.map((s, i) => {
              const style = SUBJECT_STYLES[i % SUBJECT_STYLES.length]
              return (
                <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2.5 h-2.5 rounded-sm ${style.bar}`} />
                  {s} {bySubject[s].total != null ? `(${bySubject[s].total}%)` : ''}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {subjects.map((s, i) => {
          const style = SUBJECT_STYLES[i % SUBJECT_STYLES.length]
          const isOpen = openSubject === s
          const topics = bySubject[s].topics
          return (
            <div key={s} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSubject(isOpen ? null : s)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{s}</h3>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${style.chip}`}>
                    {topics.length} focus area{topics.length !== 1 ? 's' : ''}
                    {bySubject[s].total != null ? ` · ${bySubject[s].total}% of paper` : ''}
                  </span>
                </div>
                <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
              </button>

              {isOpen && topics.length > 0 && (
                <div className="px-6 pb-6 space-y-3">
                  {topics.map((t) => (
                    <div key={t.topic} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-gray-900 leading-snug">{t.topic}</p>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                          {t.weightage != null ? `${t.weightage}%` : 'Not officially disclosed'}
                        </span>
                      </div>
                      {t.weightage != null && (
                        <>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                            <div
                              className={`h-1.5 rounded-full ${style.bar}`}
                              style={{ width: `${Math.min(100, (t.weightage / maxTopicWeightage) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">{priorityLabel(t.weightage)}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ExamRoadmap({ syllabusRows, examName, stageOrder }: ExamRoadmapProps) {
  // Group rows by stage. Single-stage exams (stage is null/undefined on every
  // row, or all rows share one stage) collapse to a single implicit group so
  // the UI is identical to before — stage tabs only appear when the exam
  // genuinely has 2+ distinct stages (e.g. UPSC: Prelims / Mains / Interview).
  const stageGroups = useMemo(() => {
    const map: Record<string, SyllabusRow[]> = {}
    const firstSeenOrder: string[] = []
    for (const row of syllabusRows) {
      const key = row.stage && row.stage.trim() ? row.stage : '__single__'
      if (!map[key]) {
        map[key] = []
        firstSeenOrder.push(key)
      }
      map[key].push(row)
    }
    // Prefer the caller-supplied order (from exam_pattern.stage_order, which IS
    // reliably sorted) — fall back to first-seen order only when it's not given.
    const order =
      stageOrder && stageOrder.length > 0 ? stageOrder.filter((s) => map[s]) : firstSeenOrder
    return { map, order }
  }, [syllabusRows, stageOrder])

  const stages = stageGroups.order
  const isMultiStage = stages.length > 1 && !(stages.length === 1 && stages[0] === '__single__')
  const [activeStage, setActiveStage] = useState<string>(stages[0] ?? '__single__')

  if (syllabusRows.length === 0) return null

  const label = examName ? `${examName}'s` : "This exam's"
  const currentRows = stageGroups.map[isMultiStage ? activeStage : stages[0]] ?? []

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Subject-wise Weightage & Topics</h2>
      <p className="text-gray-500 mb-4">
        Where the marks actually come from — study every topic, but sequence your effort by weightage
      </p>

      {/* Own-words framing so students don't mistake "high-yield topics" for "the entire syllabus" */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6">
        <p className="text-sm text-indigo-900 leading-relaxed">
          <span className="font-semibold">Read this as a heat map, not a checklist.</span> The topics below are the
          ones that have reliably pulled in the most marks over recent years, grouped so you know where to put your
          heaviest revision hours first. They are <span className="font-semibold">not</span> a shortened version of{' '}
          {label} syllabus — the official syllabus is longer than what&apos;s listed here, and questions do come
          from outside these high-frequency areas too. Go through the complete syllabus at least once; use the
          weightage below to decide what to revise first and revise hardest, not what to leave out.
        </p>
      </div>

      {isMultiStage && (
        <div className="flex flex-wrap gap-2 mb-5">
          {stages.map((stage, idx) => {
            const isActive = stage === activeStage
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setActiveStage(stage)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {idx + 1}
                </span>
                {stage}
              </button>
            )
          })}
        </div>
      )}

      <StageRoadmap rows={currentRows} />

      <p className="text-xs text-gray-400 mt-4">
        This list highlights where questions have concentrated in recent papers — it isn&apos;t the syllabus itself
        and isn&apos;t a promise about the next session&apos;s paper. Skipping a topic because it doesn&apos;t appear
        above is how avoidable marks get left on the table; cover everything in the official syllabus, and use this
        page to decide the order and depth of your revision.
      </p>
    </div>
  )
}
