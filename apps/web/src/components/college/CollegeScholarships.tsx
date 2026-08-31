'use client'

import { useState, useMemo } from 'react'
import {
  Landmark,
  GraduationCap,
  Wallet,
  CalendarClock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react'

export interface ScholarshipDetail {
  link_id: string
  college_id: string
  college_slug: string
  college_name: string
  college_state: string | null
  scholarship_id: string
  scholarship_name: string
  scholarship_slug: string
  provider: string
  category: string | null
  level: string | null
  field_of_study: string[] | null
  amount_type: string
  amount_min: number | null
  amount_max: number | null
  application_deadline: string | null
  application_url: string | null
  eligibility_criteria: string | null
  required_documents: string[] | null
  how_to_apply: string | null
  scholarship_state: string | null
  match_type: 'national' | 'state' | 'field_specific'
  relevance_note: string | null
}

export interface ScholarshipUserProfile {
  state: string | null
  stream: string | null
  current_education: string | null
  class_level: string | null
}

function formatAmount(
  amount_type: string,
  min: number | null,
  max: number | null,
): string {
  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }
  const suffix =
    amount_type === 'annual'
      ? '/year'
      : amount_type === 'monthly'
        ? '/month'
        : amount_type === 'loan'
          ? ' (loan)'
          : ''
  if (min === null && max === null) return 'Amount varies'
  if (min !== null && max !== null && min !== max)
    return `${fmt(min)} – ${fmt(max)}${suffix}`
  const n = max ?? min ?? 0
  return `${fmt(n)}${suffix}`
}

function formatDeadline(deadline: string | null): string | null {
  if (!deadline) return null
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  const isPast = d.getTime() < today.setHours(0, 0, 0, 0)
  const formatted = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return isPast ? `Closed (${formatted})` : formatted
}

const STREAM_FIELD_MAP: Record<string, string[]> = {
  science: [
    'Science',
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'Engineering',
    'Technology',
    'Technical',
    'Medical',
    'Medicine',
  ],
  pcm: ['Engineering', 'Technology', 'Technical', 'Mathematics', 'Physics'],
  pcb: ['Medical', 'Medicine', 'Biology'],
  commerce: ['Commerce', 'Management'],
  arts: ['Arts', 'Humanities'],
  humanities: ['Arts', 'Humanities'],
}

function getPersonalizationNotes(
  s: ScholarshipDetail,
  profile: ScholarshipUserProfile | null,
  collegeState: string | null,
): { notes: string[]; matchCount: number } {
  const notes: string[] = []

  notes.push(
    s.match_type === 'national'
      ? 'Open to eligible students across India — not restricted by state.'
      : `Specific to ${collegeState ?? 'this state'} — matches this college's location.`,
  )

  if (!profile) {
    return { notes, matchCount: 0 }
  }

  let matchCount = 0

  if (
    profile.state &&
    s.scholarship_state &&
    s.scholarship_state !== 'All States'
  ) {
    if (profile.state === s.scholarship_state) {
      notes.push(
        `Your profile lists ${profile.state} as your state — you meet the state requirement.`,
      )
      matchCount++
    } else if (profile.state !== collegeState) {
      notes.push(
        `Your profile state (${profile.state}) differs from this college's state (${collegeState}) — check domicile rules before applying.`,
      )
    }
  }

  const levelText = `${profile.current_education ?? ''} ${profile.class_level ?? ''}`.toLowerCase()
  const scholarshipLevels = (s.level ?? '')
    .split(',')
    .map((l) => l.trim().toLowerCase())

  if (
    (levelText.includes('postgraduate') ||
      levelText.includes('pg') ||
      levelText.includes('master')) &&
    scholarshipLevels.includes('postgraduate')
  ) {
    notes.push('Matches your postgraduate education level.')
    matchCount++
  } else if (
    (levelText.includes('undergraduate') ||
      levelText.includes('ug') ||
      levelText.includes('bachelor') ||
      levelText.includes('12')) &&
    scholarshipLevels.includes('undergraduate')
  ) {
    notes.push('Matches your undergraduate education level.')
    matchCount++
  }

  const stream = (profile.stream ?? '').toLowerCase()
  const fields = s.field_of_study ?? []
  for (const key of Object.keys(STREAM_FIELD_MAP)) {
    if (stream.includes(key) && fields.some((f) => STREAM_FIELD_MAP[key].includes(f))) {
      notes.push(`Matches your ${profile.stream} stream.`)
      matchCount++
      break
    }
  }

  return { notes, matchCount }
}

type TabKey = 'all' | 'national' | 'state' | 'loans'

export default function CollegeScholarships({
  scholarships,
  collegeName,
  collegeState,
  userProfile,
}: {
  scholarships: ScholarshipDetail[]
  collegeName: string
  collegeState: string | null
  userProfile: ScholarshipUserProfile | null
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const grants = useMemo(
    () => scholarships.filter((s) => s.amount_type !== 'loan'),
    [scholarships],
  )
  const loans = useMemo(
    () => scholarships.filter((s) => s.amount_type === 'loan'),
    [scholarships],
  )
  const hasState = useMemo(
    () => scholarships.some((s) => s.match_type === 'state'),
    [scholarships],
  )

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: scholarships.length },
    {
      key: 'national',
      label: 'National',
      count: scholarships.filter((s) => s.match_type === 'national').length,
    },
    ...(hasState
      ? [
          {
            key: 'state' as TabKey,
            label: collegeState ?? 'State',
            count: scholarships.filter((s) => s.match_type === 'state').length,
          },
        ]
      : []),
    ...(loans.length > 0
      ? [{ key: 'loans' as TabKey, label: 'Loan Schemes', count: loans.length }]
      : []),
  ]

  const visible = useMemo(() => {
    if (activeTab === 'all') return scholarships
    if (activeTab === 'national')
      return scholarships.filter((s) => s.match_type === 'national')
    if (activeTab === 'state')
      return scholarships.filter((s) => s.match_type === 'state')
    if (activeTab === 'loans') return loans
    return scholarships
  }, [activeTab, scholarships, loans])

  if (scholarships.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-indigo-500" />
          Scholarships & Govt. Schemes
          <span className="text-sm font-normal text-gray-400">
            ({scholarships.length} for {collegeName})
          </span>
        </h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Curated for this college based on state and field of study — no need to browse the scholarships section separately.
      </p>

      {!userProfile && (
        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4">
          <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700">
            Sign in and fill in your state, stream, and education level in your profile to see which of these actually fit you.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === t.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {visible.map((s) => {
          const { notes, matchCount } = getPersonalizationNotes(
            s,
            userProfile,
            collegeState,
          )
          const isExpanded = expandedId === s.link_id
          const deadline = formatDeadline(s.application_deadline)
          const isLoan = s.amount_type === 'loan'

          return (
            <div
              key={s.link_id}
              className={`rounded-xl border p-4 transition-colors ${
                matchCount > 0
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {s.scholarship_name}
                    </h3>
                    {matchCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        <Sparkles className="w-3 h-3" /> Good match
                      </span>
                    )}
                    {isLoan && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Loan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{s.provider}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                    <Wallet className="w-3.5 h-3.5 text-green-600" />
                    {formatAmount(s.amount_type, s.amount_min, s.amount_max)}
                  </div>
                  {deadline && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 justify-end">
                      <CalendarClock className="w-3 h-3" />
                      {deadline}
                    </div>
                  )}
                </div>
              </div>

              {/* Why this applies to you */}
              <div className="mt-3 space-y-1">
                {notes.map((n, i) => (
                  <p
                    key={i}
                    className="text-xs text-gray-600 flex items-start gap-1.5"
                  >
                    <span className="text-gray-300 mt-0.5">•</span>
                    {n}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.link_id)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  {isExpanded ? 'Hide details' : 'Eligibility & how to apply'}
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {s.application_url && (
                  <a
                    href={s.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-indigo-700 font-medium flex items-center gap-1 ml-auto"
                  >
                    Apply <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                  {s.eligibility_criteria && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5" /> Eligibility
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                        {s.eligibility_criteria}
                      </p>
                    </div>
                  )}
                  {s.required_documents && s.required_documents.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Documents needed
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.required_documents.map((doc) => (
                          <span
                            key={doc}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.how_to_apply && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        How to apply
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                        {s.how_to_apply}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Matches are based on state, stream, and education level from your profile. Category (SC/ST/OBC/EWS), income, gender, and disability criteria aren&apos;t tracked yet — always verify those against the official eligibility before applying.
        </p>
      </div>
    </div>
  )
}
