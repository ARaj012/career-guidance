'use client'

import { useState } from 'react'

export interface ExamPatternSection {
  name: string
  questions?: number
  marks?: number
  duration_minutes?: number
  /** Positive marks awarded per correct answer IN THIS SECTION — only present
   *  when marking differs across sections (e.g. JEE Advanced, WBJEE, JAM,
   *  UPSC CSE Prelims). When every section shares the exam's top-level
   *  marks_per_correct, this is omitted and the section-level UI stays quiet. */
  marks_per_question?: number
  /** Marks deducted per wrong answer IN THIS SECTION. 0 means explicitly no
   *  negative marking for this section (different from `undefined`, which
   *  means "not specified"). */
  negative_marking?: number
  /** Freeform aside for a section, e.g. "Qualifying; not counted toward
   *  objective total" — rendered as a small note under the section row. */
  note?: string
}

export interface ExamPatternData {
  stage: string | null
  stage_order: number | null
  qualifying_note: string | null
  mode: string | null
  duration_minutes: number | null
  total_questions: number | null
  total_marks: number | null
  question_type: string | null
  marks_per_correct: number | null
  negative_marking: number | null
  sections: ExamPatternSection[] | null
  languages: string | null
  attempts_note: string | null
  notes: string | null
}

interface ExamPatternProps {
  /** One row per stage. Single-stage exams pass a 1-element array. */
  patterns: ExamPatternData[]
  /** Optional — used to personalize the intro copy. */
  examName?: string
}

function formatDuration(mins: number | null | undefined): string {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

// Formats a marks value compactly — 1.333 -> "1.33", 2 -> "2", 0.25 -> "0.25"
function formatMarks(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return String(rounded)
}

// Postgres `numeric` columns come back from PostgREST/Supabase as JSON
// strings (e.g. "3", "-1", "0"), not JS numbers — done to avoid silent
// precision loss. marks_per_correct, negative_marking, marks_per_question
// all use this DB type, so every read of them goes through here first.
// Without it, e.g. `"0" !== 0` is true in JS (different types are never
// strictly equal), which would wrongly treat "0" negative marking as "has
// negative marking" and render "−0 marks" instead of "No negative marking".
function toNum(v: number | string | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? n : null
}

// Section colors cycle in the same order as ExamRoadmap's SUBJECT_STYLES so
// the two pages feel like one visual system.
const SECTION_STYLES = [
  { bar: 'bg-indigo-500', dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700' },
  { bar: 'bg-blue-500', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700' },
  { bar: 'bg-green-500', dot: 'bg-green-500', chip: 'bg-green-50 text-green-700' },
  { bar: 'bg-yellow-500', dot: 'bg-yellow-500', chip: 'bg-yellow-50 text-yellow-700' },
  { bar: 'bg-red-500', dot: 'bg-red-500', chip: 'bg-red-50 text-red-700' },
  { bar: 'bg-purple-500', dot: 'bg-purple-500', chip: 'bg-purple-50 text-purple-700' },
] as const

// --- small icon set (inline SVG, no external dependency) ---
function IconMode() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconQuestions() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d="M9 9a3 3 0 1 1 4 2.83c-.7.26-1 .9-1 1.67v.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
function IconMarks() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
function IconRepeat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M17 2l4 4-4 4M7 22l-4-4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h13a4 4 0 0 1 4 4v2M21 18H8a4 4 0 0 1-4-4v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function IconFlag() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M5 3v18M5 4h12l-2.5 3.5L17 11H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Top summary tile — icon + accent color instead of a flat gray box.
function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'indigo' | 'blue' | 'green' | 'amber'
}) {
  const accents = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  } as const
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3 hover:border-gray-300 transition-colors">
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${accents[accent]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-base font-semibold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}

// A small "+2 / −0.66" pill for a section row, used when that section
// carries its own marks_per_question/negative_marking distinct from (or in
// place of) the exam-level scheme.
function SectionMarkingChip({ section }: { section: ExamPatternSection }) {
  const marksPerQ = toNum(section.marks_per_question)
  const neg = toNum(section.negative_marking)
  if (marksPerQ == null && neg == null) return null
  const hasNeg = neg != null && neg !== 0
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-gray-200">
      {marksPerQ != null && <span className="text-green-700">+{formatMarks(marksPerQ)}</span>}
      {marksPerQ != null && neg != null && <span className="text-gray-300">/</span>}
      {neg != null && (
        <span className={hasNeg ? 'text-red-600' : 'text-gray-400'}>
          {hasNeg ? `−${formatMarks(neg)}` : 'no negative'}
        </span>
      )}
    </span>
  )
}

// Renders a single stage's full pattern card (everything ExamPattern used to
// render for the whole exam). Reused per-tab for multi-stage exams.
function StagePatternCard({ pattern, label }: { pattern: ExamPatternData; label: string }) {
  const hasSections = pattern.sections && pattern.sections.length > 0
  const hasSectionMarks = hasSections && pattern.sections!.some((s) => s.marks != null)
  const hasSectionDuration = hasSections && pattern.sections!.some((s) => s.duration_minutes != null)
  const hasSectionMarking =
    hasSections && pattern.sections!.some((s) => toNum(s.marks_per_question) != null || toNum(s.negative_marking) != null)

  const maxSectionQuestions = hasSections
    ? Math.max(1, ...pattern.sections!.map((s) => s.questions ?? 0))
    : 1

  // Uniform marking (the common case): exam-level fields carry real values.
  const marksPerCorrect = toNum(pattern.marks_per_correct)
  const negativeMarking = toNum(pattern.negative_marking)
  const hasUniformMarking = marksPerCorrect != null
  const hasNegative = negativeMarking != null && negativeMarking !== 0

  // Mixed marking: exam-level fields are null (by design — a single number
  // can't represent it) but sections carry their own marks_per_question /
  // negative_marking. Without this branch the top tiles would wrongly show
  // "—" and "No negative marking".
  const isMixedMarking = !hasUniformMarking && hasSectionMarking

  return (
    <div>
      {/* Qualifying-for-next-stage callout — the thing that actually decides
          whether a student advances, so it sits above everything else. */}
      {pattern.qualifying_note && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4 flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mt-0.5">
            <IconFlag />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
              Qualifying criteria for {label}
            </p>
            <p className="text-sm text-amber-900 leading-relaxed">{pattern.qualifying_note}</p>
          </div>
        </div>
      )}

      {/* Top summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatTile icon={<IconMode />} label="Mode" value={pattern.mode ?? '—'} accent="indigo" />
        <StatTile icon={<IconClock />} label="Duration" value={formatDuration(pattern.duration_minutes)} accent="blue" />
        <StatTile
          icon={<IconQuestions />}
          label="Total Questions"
          value={pattern.total_questions != null ? String(pattern.total_questions) : '—'}
          accent="green"
        />
        <StatTile
          icon={<IconMarks />}
          label="Total Marks"
          value={pattern.total_marks != null ? String(pattern.total_marks) : '—'}
          accent="amber"
        />
      </div>

      {/* Marking scheme — three states: uniform (single number for the whole
          exam), mixed (varies by section — summarized here, detailed below in
          the section breakup), or unknown (neither is available). */}
      {isMixedMarking ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-4 flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mt-0.5">
            <IconLayers />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-1">
              Marking scheme varies by section
            </p>
            <p className="text-sm text-indigo-900 leading-relaxed mb-2">
              {label} doesn&apos;t use one flat marks-per-question across the whole paper — each section below has
              its own positive and negative marking.
            </p>
            <div className="flex flex-wrap gap-2">
              {pattern.sections!.map((s, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-indigo-400">{s.name.split('–')[0].split('—')[0].trim()}:</span>
                  <SectionMarkingChip section={s} />
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <IconPlus />
              <p className="text-xs font-semibold uppercase tracking-wide">For every correct answer</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {hasUniformMarking ? `+${formatMarks(marksPerCorrect!)}` : 'Not specified'}
              {hasUniformMarking && <span className="text-sm font-normal text-green-700 ml-1">marks</span>}
            </p>
          </div>
          <div className={`rounded-2xl p-5 border ${hasNegative ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`flex items-center gap-2 mb-1 ${hasNegative ? 'text-red-700' : 'text-gray-500'}`}>
              <IconMinus />
              <p className="text-xs font-semibold uppercase tracking-wide">For every wrong answer</p>
            </div>
            <p className={`text-2xl font-bold ${hasNegative ? 'text-red-900' : 'text-gray-600'}`}>
              {!hasUniformMarking ? 'Not specified' : hasNegative ? `−${formatMarks(negativeMarking!)}` : 'No negative marking'}
              {hasUniformMarking && hasNegative && <span className="text-sm font-normal text-red-700 ml-1">marks</span>}
            </p>
          </div>
        </div>
      )}

      {/* Question type / languages / attempts */}
      {(pattern.question_type || pattern.languages || pattern.attempts_note) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Question Type</p>
              <p className="text-sm text-gray-900">{pattern.question_type ?? '—'}</p>
            </div>
            {pattern.languages && (
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <IconGlobe /> Languages Available
                </p>
                <p className="text-sm text-gray-900">{pattern.languages}</p>
              </div>
            )}
            {pattern.attempts_note && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <IconRepeat /> Frequency & Attempts
                </p>
                <p className="text-sm text-gray-900">{pattern.attempts_note}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section-wise breakup */}
      {hasSections && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-xs text-gray-500 mb-4">
            Section-wise breakup{hasSectionMarking ? ' — including marking per section' : ''}
          </p>
          <div className="space-y-4">
            {pattern.sections!.map((s, idx) => {
              const style = SECTION_STYLES[idx % SECTION_STYLES.length]
              return (
                <div key={idx} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-sm ${style.dot}`} />
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.questions != null && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.chip}`}>
                          {s.questions} question{s.questions !== 1 ? 's' : ''}
                        </span>
                      )}
                      {hasSectionMarks && s.marks != null && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          {s.marks} marks
                        </span>
                      )}
                      {hasSectionDuration && s.duration_minutes != null && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          {formatDuration(s.duration_minutes)}
                        </span>
                      )}
                      <SectionMarkingChip section={s} />
                    </div>
                  </div>
                  {s.questions != null && (
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full ${style.bar}`}
                        style={{ width: `${Math.min(100, (s.questions / maxSectionQuestions) * 100)}%` }}
                      />
                    </div>
                  )}
                  {s.note && <p className="text-xs text-gray-400 mt-1.5 italic">{s.note}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Freeform notes */}
      {pattern.notes && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <p className="text-sm text-indigo-900 leading-relaxed">
            <span className="font-semibold">Good to know: </span>
            {pattern.notes}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ExamPattern({ patterns, examName }: ExamPatternProps) {
  const rows = (patterns ?? []).filter(Boolean)
  const isMultiStage = rows.length > 1
  const sorted = [...rows].sort((a, b) => (a.stage_order ?? 0) - (b.stage_order ?? 0))
  const [activeStage, setActiveStage] = useState<string>(sorted[0]?.stage ?? '')

  if (sorted.length === 0) return null

  const label = examName ?? 'This exam'
  const active = isMultiStage ? sorted.find((p) => p.stage === activeStage) ?? sorted[0] : sorted[0]

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Exam Pattern & Format</h2>
      <p className="text-gray-500 mb-4">
        {isMultiStage
          ? `${label} is conducted in ${sorted.length} stages — mode, duration, question types, and marking for each, so nothing on exam day is a surprise`
          : `Exactly how ${label} is conducted — mode, duration, question types, and marking, so nothing on exam day is a surprise`}
      </p>

      {isMultiStage && (
        <div className="flex flex-wrap gap-2 mb-5">
          {sorted.map((p, idx) => {
            const isActive = (p.stage ?? '') === activeStage
            return (
              <button
                key={p.stage ?? idx}
                type="button"
                onClick={() => setActiveStage(p.stage ?? '')}
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
                {p.stage ?? `Stage ${idx + 1}`}
              </button>
            )
          })}
        </div>
      )}

      {active && <StagePatternCard pattern={active} label={active.stage ?? label} />}

      <p className="text-xs text-gray-400 mt-4">
        Exam pattern details are set by the conducting body and can be revised year to year — always cross-check the
        latest official notification before exam day for the exact, current-year pattern.
      </p>
    </div>
  )
}
