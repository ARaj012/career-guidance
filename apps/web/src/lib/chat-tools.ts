/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/lib/chat-tools.ts
//
// Defines the tools Groq's model can call to answer questions using your
// real, verified data instead of guessing. Each tool mirrors a query
// already used in your colleges/exams/careers detail pages, so results
// stay consistent with what's shown on-site.
//
// NOTE: tool *schema* below is in OpenAI-compatible function-calling
// format, which Groq uses. The Supabase query functions underneath are
// unchanged and would work identically with any other provider — only
// the schema shape differs.

import { supabaseChat as supabase } from './supabase-chat'

// ── Tool schemas (OpenAI/Groq function-calling format) ──────────────────────

export const GROQ_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_colleges',
      description:
        'Search for colleges by name, city, or state. Use this first when the user asks about a college by name or asks for colleges in a location. Returns basic info + slugs to look up full details.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search text — college name, city, or state' },
          limit: { type: 'number', description: 'Max results, default 8' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_college_details',
      description:
        'Get full details for one specific college by its slug — includes about, courses offered, admission cutoffs (per exam/year/category), and placement stats (rate, avg/median/highest package, top recruiters). Use this after search_colleges to answer specific questions about a college.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The college slug, e.g. "iit-bombay"' },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_exams',
      description:
        'Search for entrance exams by name (e.g. "JEE", "NEET", "CAT"). Returns basic info + slugs.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search text — exam name or abbreviation' },
          limit: { type: 'number', description: 'Max results, default 8' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_exam_details',
      description:
        'Get full details for one specific exam by its slug — description, exam level, conducting body, key dates, eligibility, and recent cutoff data. Use this after search_exams for specific questions about an exam.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The exam slug, e.g. "jee-main"' },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_careers',
      description:
        'Search for career paths by title or category (e.g. "software engineer", "doctor", "Technology"). Returns basic info + slugs.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search text — career title or category' },
          limit: { type: 'number', description: 'Max results, default 8' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_career_details',
      description:
        'Get full details for one specific career by its slug — description, salary range, growth/demand/competition levels, required skills, and relevant entrance exams. Use this after search_careers for specific career questions.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The career slug, e.g. "software-engineer"' },
        },
        required: ['slug'],
      },
    },
  },
] as const

// ── Tool executors (unchanged — provider-agnostic) ──────────────────────────

export async function executeTool(name: string, input: any): Promise<any> {
  switch (name) {
    case 'search_colleges':
      return searchColleges(input.query, input.limit ?? 8)
    case 'get_college_details':
      return getCollegeDetails(input.slug)
    case 'search_exams':
      return searchExams(input.query, input.limit ?? 8)
    case 'get_exam_details':
      return getExamDetails(input.slug)
    case 'search_careers':
      return searchCareers(input.query, input.limit ?? 8)
    case 'get_career_details':
      return getCareerDetails(input.slug)
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

async function searchColleges(query: string, limit: number) {
  const { data, error } = await supabase
    .from('colleges')
    .select('name, slug, city, state, type, nirf_rank, naac_grade')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
    .order('nirf_rank', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { message: 'No colleges found matching that search.' }
  return { colleges: data }
}

async function getCollegeDetails(slug: string) {
  const { data: college, error } = await supabase
    .from('colleges')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !college) return { error: 'College not found for that slug.' }

  const [{ data: courses }, { data: cutoffs }, { data: placements }] = await Promise.all([
    supabase.from('college_courses').select('*').eq('college_id', college.id),
    supabase
      .from('college_exam_cutoffs')
      .select('year, category, cutoff_score, cutoff_rank, exams(name)')
      .eq('college_id', college.id)
      .order('year', { ascending: false })
      .limit(20),
    supabase
      .from('college_placements')
      .select('*')
      .eq('college_id', college.id)
      .order('year', { ascending: false })
      .limit(3),
  ])

  return {
    name: college.name,
    slug: college.slug,
    about: college.about,
    city: college.city,
    state: college.state,
    type: college.type,
    nirf_rank: college.nirf_rank,
    naac_grade: college.naac_grade,
    annual_fees_min: college.annual_fees_min,
    annual_fees_max: college.annual_fees_max,
    website_url: college.website_url,
    courses: courses ?? [],
    recent_cutoffs: cutoffs ?? [],
    recent_placements: placements ?? [],
  }
}

async function searchExams(query: string, limit: number) {
  const { data, error } = await supabase
    .from('exams')
    .select('name, slug, exam_level, conducting_body, frequency')
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { message: 'No exams found matching that search.' }
  return { exams: data }
}

async function getExamDetails(slug: string) {
  const { data: exam, error } = await supabase
    .from('exams')
    .select(
      `*, exam_schedules ( registration_start, registration_end, exam_date_start, result_date, year ),
       exam_eligibility ( min_percentage, class_required, stream_required, age_min, age_max )`
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error || !exam) return { error: 'Exam not found for that slug.' }

  const { data: recentCutoffs } = await supabase
    .from('exam_national_cutoffs')
    .select('year, institute_name, program_or_post, category, cutoff_score')
    .eq('exam_id', exam.id)
    .order('year', { ascending: false })
    .limit(15)

  return {
    name: exam.name,
    slug: exam.slug,
    description: exam.description,
    exam_level: exam.exam_level,
    conducting_body: exam.conducting_body,
    frequency: exam.frequency,
    mode: exam.mode,
    official_url: exam.official_url,
    schedules: exam.exam_schedules ?? [],
    eligibility: exam.exam_eligibility ?? [],
    recent_national_cutoffs: recentCutoffs ?? [],
  }
}

async function searchCareers(query: string, limit: number) {
  const { data, error } = await supabase
    .from('careers')
    .select('title, slug, category, avg_salary_min, avg_salary_max, growth_level')
    .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
    .limit(limit)

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { message: 'No careers found matching that search.' }
  return { careers: data }
}

async function getCareerDetails(slug: string) {
  const { data: career, error } = await supabase
    .from('careers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !career) return { error: 'Career not found for that slug.' }

  const [{ data: skillsRaw }, { data: examsRaw }] = await Promise.all([
    supabase.from('career_skills').select('skills(name, category)').eq('career_id', career.id),
    supabase.from('career_exams').select('exams(name, slug, conducting_body)').eq('career_id', career.id),
  ])

  return {
    title: career.title,
    slug: career.slug,
    description: career.description,
    category: career.category,
    avg_salary_min: career.avg_salary_min,
    avg_salary_max: career.avg_salary_max,
    growth_level: career.growth_level,
    competition_level: career.competition_level,
    demand_score: career.demand_score,
    work_life_balance: career.work_life_balance,
    skills: (skillsRaw ?? []).map((s: any) => s.skills).filter(Boolean),
    relevant_exams: (examsRaw ?? []).map((e: any) => e.exams).filter(Boolean),
  }
}
