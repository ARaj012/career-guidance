/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import SaveExamButton from '@/components/SaveExamButton'

const STRATEGY_STEPS = [
  {
    title: 'Understand the Exam Pattern & Syllabus',
    description:
      'Get the official syllabus and past papers first. Knowing the exact topics, weightage, and question format shapes everything else you do.',
  },
  {
    title: 'Build Strong Fundamentals',
    description:
      'Go topic by topic through standard reference material before jumping to shortcuts or tricks — a shaky foundation shows up under exam pressure.',
  },
  {
    title: 'Practice with Timed Mock Tests',
    description:
      'Simulate real exam conditions regularly. Mocks reveal weak areas and build the speed and stamina the actual exam demands.',
  },
  {
    title: 'Review Mistakes & Refine',
    description:
      'After every mock, spend as much time reviewing wrong answers as you did taking the test. This is where most of the real improvement happens.',
  },
  {
    title: 'Final Revision & Exam-Day Strategy',
    description:
      'In the last phase, focus on quick revision, formula sheets, and deciding your question-attempt order and time allocation in advance.',
  },
]

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select(
      `
      *,
      exam_schedules ( registration_start, registration_end, exam_date_start, result_date, year, total_applicants, total_selected ),
      exam_eligibility ( min_percentage, class_required, stream_required, age_min, age_max )
    `
    )
    .eq('slug', slug)
    .maybeSingle()

  if (examError) {
    console.error('Failed to load exam:', {
      message: examError.message,
      details: examError.details,
      hint: examError.hint,
      code: examError.code,
    })
    throw new Error(`Failed to load exam "${slug}": ${examError.message}`)
  }

  if (!exam) {
    notFound()
  }

  // Most recent schedule (in case multiple years are stored)
  const schedules = ((exam as any).exam_schedules ?? []) as any[]
  const latestSchedule = [...schedules].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0] ?? null
  const eligibility = ((exam as any).exam_eligibility ?? [])[0] ?? null

  // Full cutoff history across all colleges for this exam
  const { data: cutoffRows } = await supabase
    .from('college_exam_cutoffs')
    .select(
      'year, category, cutoff_score, cutoff_rank, colleges ( name, slug, city, state, nirf_rank ), college_courses ( course_name, degree_type )'
    )
    .eq('exam_id', exam.id)
    .order('year', { ascending: false })
    .limit(500)

  const rows = (cutoffRows ?? []) as any[]
  const byYear = new Map<number, any[]>()
  for (const row of rows) {
    if (!byYear.has(row.year)) byYear.set(row.year, [])
    byYear.get(row.year)!.push(row)
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a)
  for (const y of years) {
    byYear.get(y)!.sort((a, b) => (a.colleges?.nirf_rank ?? 9999) - (b.colleges?.nirf_rank ?? 9999))
  }

  // Careers this exam is relevant for
  const { data: careerLinks } = await supabase
    .from('career_exams')
    .select('careers ( title, slug )')
    .eq('exam_id', exam.id)
    .limit(8)
  const relatedCareers = ((careerLinks ?? []) as any[]).map((c) => c.careers).filter(Boolean)

  // National/service-level cutoffs — for exams that don't gate a specific
  // college admission (NDA, UPSC CSE, CDS, NET exams, etc.)
  const { data: nationalCutoffRows } = await supabase
    .from('exam_national_cutoffs')
    .select('*')
    .eq('exam_id', exam.id)
    .order('year', { ascending: false })
    .limit(2000)

  const nationalCutoffs = (nationalCutoffRows ?? []) as any[]
  const nationalByYear = new Map<number, any[]>()
  for (const row of nationalCutoffs) {
    if (!nationalByYear.has(row.year)) nationalByYear.set(row.year, [])
    nationalByYear.get(row.year)!.push(row)
  }
  const nationalYears = Array.from(nationalByYear.keys()).sort((a, b) => b - a)
  const nationalYearsAsc = [...nationalYears].sort((a, b) => a - b)

  const hasInstitute = nationalCutoffs.some((r) => r.institute_name)
  const hasProgram = nationalCutoffs.some((r) => r.program_or_post)
  const hasPaper = nationalCutoffs.some((r) => r.paper_or_branch)
  const hasSection = nationalCutoffs.some((r) => r.section)
  const hasStage = nationalCutoffs.some((r) => r.stage)

  // Build a "Last N Years" pivot: one row per unique
  // institute/branch/program/category/stage combo, one column per year.
  // This is what actually answers "show me the trend across years" —
  // the per-year blocks further down are for full record-level detail.
  function pivotKey(row: any) {
    return [row.institute_name, row.paper_or_branch, row.program_or_post, row.stage, row.category ?? 'Common']
      .filter(Boolean)
      .join(' • ')
  }
  function pivotLabel(row: any) {
    return {
      institute: row.institute_name ?? null,
      branch: row.paper_or_branch ?? null,
      program: row.program_or_post ?? null,
      stage: row.stage ?? null,
      category: row.category ?? 'Common (all categories)',
    }
  }
  const pivotMap = new Map<string, { label: any; byYear: Map<number, any> }>()
  for (const row of nationalCutoffs) {
    const key = pivotKey(row)
    if (!pivotMap.has(key)) pivotMap.set(key, { label: pivotLabel(row), byYear: new Map() })
    pivotMap.get(key)!.byYear.set(row.year, row)
  }
  const pivotRows = Array.from(pivotMap.values())

  function formatCutoffCell(row: any | undefined) {
    if (!row || row.cutoff_score == null) return '—'
    let s = String(row.cutoff_score)
    if (row.cutoff_score_to != null) s += ` – ${row.cutoff_score_to}`
    return s
  }

  // Toppers — most recent year available, if any have been entered
  const { data: allToppers } = await supabase
    .from('exam_toppers')
    .select('*')
    .eq('exam_id', exam.id)
    .order('year', { ascending: false })
    .order('rank', { ascending: true })
    .limit(50)

  let toppersYear: number | null = null
  let toppers: any[] = []
  if (allToppers && allToppers.length > 0) {
    toppersYear = (allToppers[0] as any).year
    toppers = (allToppers as any[]).filter((t) => t.year === toppersYear)
  }

  // Subject-wise syllabus & weightage now lives on its own page
  // (/exams/[slug]/roadmap) to keep this page from getting bulky — here we
  // only need to know whether that data exists, to decide whether to show
  // the link card below.
  const { count: syllabusCount } = await supabase
    .from('exam_syllabus')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', exam.id)

  const hasSelectionStats = latestSchedule?.total_applicants && latestSchedule?.total_selected
  const selectionRate = hasSelectionStats
    ? ((latestSchedule.total_selected / latestSchedule.total_applicants) * 100).toFixed(2)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <Link href="/exams" className="text-indigo-200 hover:text-white text-sm">
            ← Back to Exams
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{exam.name}</h1>
          {exam.description && <p className="text-indigo-100 mt-3 text-lg max-w-2xl">{exam.description}</p>}
          <div className="flex flex-wrap gap-3 mt-6">
            {exam.exam_level && <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">🌐 {exam.exam_level}</span>}
            {exam.conducting_body && <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">🏛️ {exam.conducting_body}</span>}
            {exam.frequency && <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">📅 {exam.frequency}</span>}
            {exam.mode && <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">{exam.mode === 'Online' ? '💻' : '📝'} {exam.mode}</span>}
            {nationalYearsAsc.length > 0 && (
              <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">
                📊 {nationalYearsAsc[0]}–{nationalYearsAsc[nationalYearsAsc.length - 1]} cutoff data
              </span>
            )}
            {nationalCutoffs.length > 0 && (
              <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">
                📋 {nationalCutoffs.length} cutoff record{nationalCutoffs.length > 1 ? 's' : ''}
              </span>
            )}
            {nationalYearsAsc.length === 0 && years.length > 0 && (
              <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">
                📊 {years.length} year{years.length > 1 ? 's' : ''} of cutoff data
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Key dates */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📅 Key Dates{latestSchedule?.year ? ` (${latestSchedule.year})` : ''}
          </h2>
          {latestSchedule ? (
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Registration</p>
                <p className="font-medium text-gray-900 mt-1">
                  {formatDate(latestSchedule.registration_start) ?? 'TBA'} – {formatDate(latestSchedule.registration_end) ?? 'TBA'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Exam Date</p>
                <p className="font-medium text-gray-900 mt-1">{formatDate(latestSchedule.exam_date_start) ?? 'TBA'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Result Date</p>
                <p className="font-medium text-gray-900 mt-1">{formatDate(latestSchedule.result_date) ?? 'TBA'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Exact dates for the upcoming cycle haven&apos;t been added yet.{' '}
              {exam.official_url && (
                <a href={exam.official_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Check the official site for current dates →
                </a>
              )}
            </p>
          )}
        </div>

        {/* Eligibility */}
        {eligibility && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Eligibility</h2>
            <div className="flex flex-wrap gap-2">
              {eligibility.class_required && (
                <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">{eligibility.class_required}</span>
              )}
              {eligibility.stream_required && (
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{eligibility.stream_required}</span>
              )}
              {eligibility.min_percentage && (
                <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">Min {eligibility.min_percentage}%</span>
              )}
              {eligibility.age_max && (
                <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full">
                  Age: {eligibility.age_min}-{eligibility.age_max}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Selection overview */}
        {hasSelectionStats && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Selection Overview (Latest Cycle)</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{latestSchedule.total_applicants.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Total Applicants</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{latestSchedule.total_selected.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Total Selected</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-indigo-700">{selectionRate}%</p>
                <p className="text-xs text-indigo-600 mt-1">Selection Rate</p>
              </div>
            </div>
          </div>
        )}

        {exam.official_url && (
          <div className="flex flex-wrap gap-3 mb-8">
            <a
              href={exam.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition"
            >
              Go to Official Site →
            </a>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-8">
          <SaveExamButton examId={exam.id} />
        </div>

        {/* How to crack this exam — generic evergreen strategy */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">How to Crack This Exam</h2>
          <p className="text-gray-500 mb-6">A proven, general preparation strategy — adapt the timeline to how much time you have left</p>
          <div className="relative">
            {STRATEGY_STEPS.map((step, i) => {
              const isLast = i === STRATEGY_STEPS.length - 1
              return (
                <div key={step.title} className="relative flex gap-5 pb-8">
                  {!isLast && <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-indigo-200" />}
                  <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold shrink-0 bg-indigo-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Subject-wise syllabus weightage now lives on its own page — link out
            instead of rendering it inline, to keep this page from getting bulky */}
        {syllabusCount != null && syllabusCount > 0 && (
          <div className="mb-10">
            <Link
              href={`/exams/${slug}/roadmap`}
              className="group flex items-center justify-between gap-4 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 hover:shadow-lg transition"
            >
              <div>
                <h2 className="text-xl font-bold">Subject-wise Weightage & Study Roadmap</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  See exactly where the marks come from, subject by subject, and how to sequence your revision for {exam.name}.
                </p>
              </div>
              <span className="text-2xl shrink-0 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        )}

        {/* Toppers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Toppers {toppersYear ? `(${toppersYear})` : ''}
          </h2>
          {toppers.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-3 py-2 font-medium">Rank</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Score</th>
                    <th className="px-3 py-2 font-medium">City</th>
                  </tr>
                </thead>
                <tbody>
                  {toppers.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-900">{t.rank ? `#${t.rank}` : '—'}</td>
                      <td className="px-3 py-2 text-gray-900">{t.name}</td>
                      <td className="px-3 py-2 text-gray-600">{t.score ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{t.city ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Topper details haven&apos;t been added yet.{' '}
              {exam.official_url && (
                <a href={exam.official_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Check the official result page →
                </a>
              )}
            </p>
          )}
        </div>

        {/* Last N Years — pivot table, one row per institute/branch/category, one column per year */}
        {pivotRows.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">
                Cutoff Trend — Last {nationalYearsAsc.length} Year{nationalYearsAsc.length > 1 ? 's' : ''}
                <span className="text-gray-400 font-normal text-lg"> ({nationalYearsAsc[0]}–{nationalYearsAsc[nationalYearsAsc.length - 1]})</span>
              </h2>
            </div>
            <p className="text-gray-500 mb-6">Compare how cutoffs have moved year over year, side by side</p>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      {hasInstitute && <th className="px-3 py-2 font-medium whitespace-nowrap">Institute / Body</th>}
                      {hasPaper && <th className="px-3 py-2 font-medium whitespace-nowrap">Branch / Paper</th>}
                      {hasProgram && <th className="px-3 py-2 font-medium whitespace-nowrap">Program / Post</th>}
                      {hasStage && <th className="px-3 py-2 font-medium whitespace-nowrap">Stage</th>}
                      <th className="px-3 py-2 font-medium whitespace-nowrap">Category</th>
                      {nationalYearsAsc.map((y) => (
                        <th key={y} className="px-3 py-2 font-medium text-right whitespace-nowrap">{y}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pivotRows.map((pr, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        {hasInstitute && <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{pr.label.institute ?? '—'}</td>}
                        {hasPaper && <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{pr.label.branch ?? '—'}</td>}
                        {hasProgram && <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{pr.label.program ?? '—'}</td>}
                        {hasStage && <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{pr.label.stage ?? '—'}</td>}
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{pr.label.category}</td>
                        {nationalYearsAsc.map((y) => (
                          <td key={y} className="px-3 py-2 text-gray-900 text-right font-medium whitespace-nowrap">
                            {formatCutoffCell(pr.byYear.get(y))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Values shown as marks, percentile, or rank depending on the exam — see the detailed records below for units and sources.
              </p>
            </div>
          </div>
        )}

        {/* Detailed cutoff records — full record-level detail with sources, grouped by year */}
        {nationalYears.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Detailed Cutoff Records</h2>
            <p className="text-gray-500 mb-6">Full breakdown with sources for each year</p>
            <div className="space-y-6">
              {nationalYears.map((year) => (
                <div key={year} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {year} <span className="text-sm font-normal text-gray-400">({nationalByYear.get(year)!.length} record{nationalByYear.get(year)!.length > 1 ? 's' : ''})</span>
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500">
                          {hasInstitute && <th className="px-3 py-2 font-medium">Institute / Body</th>}
                          {hasPaper && <th className="px-3 py-2 font-medium">Branch / Paper</th>}
                          {hasProgram && <th className="px-3 py-2 font-medium">Program / Post</th>}
                          {hasStage && <th className="px-3 py-2 font-medium">Stage</th>}
                          {hasSection && <th className="px-3 py-2 font-medium">Section</th>}
                          <th className="px-3 py-2 font-medium">Category</th>
                          <th className="px-3 py-2 font-medium">Cutoff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nationalByYear.get(year)!.map((row) => (
                          <tr key={row.id} className="border-t border-gray-100">
                            {hasInstitute && <td className="px-3 py-2 text-gray-900">{row.institute_name ?? '—'}</td>}
                            {hasPaper && <td className="px-3 py-2 text-gray-600">{row.paper_or_branch ?? '—'}</td>}
                            {hasProgram && <td className="px-3 py-2 text-gray-600">{row.program_or_post ?? '—'}</td>}
                            {hasStage && <td className="px-3 py-2 text-gray-600">{row.stage ?? '—'}</td>}
                            {hasSection && <td className="px-3 py-2 text-gray-600">{row.section ?? '—'}</td>}
                            <td className="px-3 py-2 text-gray-600">{row.category ?? 'Common (all categories)'}</td>
                            <td className="px-3 py-2 text-gray-900 font-medium">
                              {row.cutoff_score != null ? (
                                <>
                                  {row.cutoff_score}
                                  {row.cutoff_score_to != null ? ` – ${row.cutoff_score_to}` : ''}
                                  {row.max_score ? ` / ${row.max_score}` : ''}
                                  {row.cutoff_metric ? (
                                    <span className="text-gray-400 font-normal"> ({row.cutoff_metric})</span>
                                  ) : null}
                                </>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {nationalByYear.get(year)!.some((r) => r.source_url) && (
                    <p className="text-xs text-gray-400 mt-3">
                      Source:{' '}
                      <a
                        href={nationalByYear.get(year)!.find((r) => r.source_url)?.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        verified official data →
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* College-based cutoff history — only shown when it's actually relevant */}
        {(years.length > 0 || nationalYears.length === 0) && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">College Cutoff History</h2>
            <p className="text-gray-500 mb-6">
              {years.length > 0
                ? `Showing cutoff data across ${years.length} year${years.length > 1 ? 's' : ''} for colleges in our database`
                : 'No college-wise cutoff data available yet for this exam.'}
            </p>
          </>
        )}


        <div className="space-y-8">
          {years.map((year) => (
            <div key={year} className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{year}</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-3 py-2 font-medium">College</th>
                      <th className="px-3 py-2 font-medium">Course</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Score</th>
                      <th className="px-3 py-2 font-medium">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byYear.get(year)!.map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          {row.colleges?.slug ? (
                            <Link href={`/colleges/${row.colleges.slug}`} className="text-indigo-600 hover:underline">
                              {row.colleges?.name}
                            </Link>
                          ) : (
                            row.colleges?.name ?? '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {row.college_courses?.course_name ?? '—'}
                          {row.college_courses?.degree_type ? ` (${row.college_courses.degree_type})` : ''}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{row.category ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{row.cutoff_score ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{row.cutoff_rank ? `#${row.cutoff_rank}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {relatedCareers.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Careers That Require This Exam</h2>
            <div className="flex flex-wrap gap-2">
              {relatedCareers.map((c: any) => (
                <Link
                  key={c.slug}
                  href={`/careers/${c.slug}`}
                  className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
