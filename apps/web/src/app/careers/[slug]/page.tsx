/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, TrendingUp, IndianRupee, Briefcase, BookOpen,
  GraduationCap, Star, CheckCircle2, Building2, Target,
  BarChart3, Lightbulb, ChevronRight, ExternalLink, Flame,
  Scale, Heart, LineChart, ArrowRight, BadgeCheck, Zap,
} from 'lucide-react'

// ── Category → College slugs mapping ──────────────────────────────────────
// Maps each career category to the most relevant colleges

const CATEGORY_COLLEGES: Record<string, string[]> = {
  Technology: [
    'iit-madras', 'iit-delhi', 'iit-bombay', 'iit-kanpur', 'iit-kharagpur',
    'iit-roorkee', 'iiit-hyderabad', 'bits-pilani', 'vit-vellore', 'nit-trichy',
    'nit-warangal', 'iisc-bangalore', 'iit-hyderabad', 'iiit-bangalore', 'srm-university',
  ],
  Engineering: [
    'iit-madras', 'iit-delhi', 'iit-bombay', 'iit-roorkee', 'iit-kharagpur',
    'nit-trichy', 'nit-warangal', 'nit-surathkal', 'bits-pilani', 'vit-vellore',
    'vnit-nagpur', 'mnit-jaipur', 'thapar-university', 'iit-bhu', 'iit-dhanbad',
  ],
  Medical: [
    'aiims-delhi', 'jipmer-puducherry', 'cmc-vellore', 'afmc-pune', 'mamc-delhi',
    'pgimer-chandigarh', 'aiims-jodhpur', 'aiims-bhopal', 'aiims-rishikesh',
    'mmc-chennai', 'gmc-mumbai', 'kgmu-lucknow', 'kmc-manipal', 'aiims-patna', 'bhu-ims',
  ],
  Management: [
    'iim-ahmedabad', 'iim-bangalore', 'iim-calcutta', 'iim-lucknow', 'iim-indore',
    'iim-kozhikode', 'xlri-jamshedpur', 'spjimr-mumbai', 'nmims-mumbai', 'mdi-gurugram',
    'iim-trichy', 'iit-delhi', 'iit-bombay', 'iit-kharagpur', 'sibm-pune',
  ],
  Finance: [
    'iim-ahmedabad', 'iim-calcutta', 'iim-bangalore', 'xlri-jamshedpur', 'nmims-mumbai',
    'srcc-delhi', 'spjimr-mumbai', 'bits-pilani', 'iit-bombay', 'dse-delhi',
    'mdi-gurugram', 'iim-lucknow', 'lsr-delhi', 'loyola-college-chennai', 'igidr-mumbai',
  ],
  Law: [
    'nlsiu-bangalore', 'nalsar-hyderabad', 'nlu-delhi', 'nujs-kolkata', 'nlu-jodhpur',
    'gnlu-gandhinagar', 'hnlu-raipur', 'rgnul-patiala', 'mnlu-mumbai', 'nluo-cuttack',
    'jgls-sonipat', 'sls-pune', 'du-law-faculty', 'glc-mumbai', 'cnlu-patna',
  ],
  Government: [
    'lbsnaa-mussoorie', 'jnu', 'university-of-delhi', 'bhu', 'hyderabad-university',
    'iipa-delhi', 'amu', 'panjab-university', 'tiss-mumbai', 'jmi-delhi',
    'lucknow-university', 'patna-university', 'osmania-university', 'jadavpur-university', 'iim-ahmedabad',
  ],
  Research: [
    'iisc-bangalore', 'tifr-mumbai', 'isi-kolkata', 'iiser-pune', 'iiser-kolkata',
    'iiser-mohali', 'iiser-bhopal', 'iiser-tvm', 'jncasr-bangalore', 'barc-training',
    'iit-madras', 'iit-delhi', 'iit-bombay', 'ncbs-bangalore', 'imsc-chennai',
  ],
  Design: [
    'nid-ahmedabad', 'nid-bangalore', 'nift-delhi', 'nift-mumbai', 'nift-bangalore',
    'nift-chennai', 'spa-delhi', 'cept-ahmedabad', 'srishti-bangalore', 'iit-bombay',
    'iit-delhi', 'mit-design-pune', 'pearl-academy-delhi', 'sid-pune', 'nift-hyderabad',
  ],
  Agriculture: [
    'iari-delhi', 'pau-ludhiana', 'tnau-coimbatore', 'gbpuat-pantnagar', 'angrau-guntur',
    'kau-thrissur', 'ccshau-hisar', 'ouat-bhubaneswar', 'aau-jorhat', 'ivri-bareilly',
    'bhu', 'iit-kharagpur', 'iit-roorkee', 'iiser-bhopal', 'university-of-delhi',
  ],
  Defence: [
    'nda-pune', 'ima-dehradun', 'afa-hyderabad', 'ina-ezhimala', 'ota-chennai',
    'rimc-dehradun', 'diat-pune', 'afmc-pune', 'iit-madras', 'iit-delhi',
    'nit-trichy', 'bits-pilani', 'cme-pune', 'mceme-secunderabad', 'iit-bombay',
  ],
  Media: [
    'iimc-delhi', 'acj-chennai', 'simc-pune', 'ftii-pune', 'srfti-kolkata',
    'xic-mumbai', 'mic-manipal', 'ajkmcrc-delhi', 'hyd-communication', 'jmi-delhi',
    'university-of-delhi', 'jadavpur-university', 'mumbai-university', 'pondicherry-university', 'christ-university',
  ],
  Education: [
    'tiss-mumbai', 'jnu', 'university-of-delhi', 'bhu', 'amu',
    'azim-premji-university', 'niepa-delhi', 'ncert-delhi', 'jamia-millia-islamia', 'ignou-delhi',
    'aud-delhi', 'panjab-university', 'hyderabad-university', 'jadavpur-university', 'calcutta-university',
  ],
}

// ── Config ─────────────────────────────────────────────────────────────────

const GROWTH_COLORS: Record<string, { bg: string; text: string }> = {
  'Very High': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'High':      { bg: 'bg-green-100',   text: 'text-green-700'   },
  'Medium':    { bg: 'bg-yellow-100',  text: 'text-yellow-700'  },
  'Low':       { bg: 'bg-red-100',     text: 'text-red-700'     },
}

const CATEGORY_COLORS: Record<string, string> = {
  Technology:  'bg-blue-100 text-blue-700',
  Medical:     'bg-red-100 text-red-700',
  Engineering: 'bg-orange-100 text-orange-700',
  Finance:     'bg-green-100 text-green-700',
  Law:         'bg-purple-100 text-purple-700',
  Government:  'bg-indigo-100 text-indigo-700',
  Education:   'bg-yellow-100 text-yellow-700',
  Research:    'bg-cyan-100 text-cyan-700',
  Design:      'bg-pink-100 text-pink-700',
  Media:       'bg-rose-100 text-rose-700',
  Management:  'bg-teal-100 text-teal-700',
  Agriculture: 'bg-lime-100 text-lime-700',
  Defence:     'bg-slate-100 text-slate-700',
}

const CAREER_STEPS: Record<string, string[]> = {
  Technology:  ['Complete B.Tech/BCA/BSc CS', 'Learn core programming skills', 'Build projects & GitHub portfolio', 'Clear internship / entry-level role', 'Gain 2-3 years experience', 'Specialise or move to senior role'],
  Medical:     ['Clear Class 12 with Biology (85%+)', 'Crack NEET UG', 'Complete MBBS (5.5 years)', 'Complete internship (1 year)', 'Choose specialisation (MD/MS)', 'Practice or join hospital'],
  Law:         ['Clear Class 12 (any stream)', 'Crack CLAT / AILET', 'Complete BA LLB (5 years)', 'Enrol in Bar Council', 'Join law firm / court as junior', 'Build practice area expertise'],
  Finance:     ['Complete B.Com / BBA / Economics', 'Pursue CA / CFA / MBA Finance', 'Clear relevant certifications', 'Join bank / finance firm', 'Build domain expertise', 'Move to senior analyst / manager role'],
  Government:  ['Complete Graduation (any stream)', 'Start UPSC/State PSC preparation', 'Clear Prelims exam', 'Clear Mains exam', 'Clear Personality Test/Interview', 'Join as IAS/IPS/IFS officer'],
  Engineering: ['Complete B.Tech in relevant branch', 'Gain core engineering skills', 'Clear GATE for PG / PSU jobs', 'Join as junior engineer', 'Get licensed / certified', 'Grow to senior / project engineer'],
  Management:  ['Complete graduation', 'Gain 2-3 years work experience', 'Crack CAT/XAT/GMAT', 'Complete MBA (2 years)', 'Join as management trainee', 'Rise to manager / director level'],
  Research:    ['Complete BSc/B.Tech', 'Clear JAM/JEST/GATE', 'Complete MSc/M.Tech', 'Publish research papers', 'Complete PhD (4-5 years)', 'Join as scientist / researcher'],
  Design:      ['Complete Class 12', 'Crack NID/NIFT entrance exam', 'Complete B.Des (4 years)', 'Build strong portfolio', 'Join design studio / agency', 'Grow to lead designer / art director'],
  Agriculture: ['Complete Class 12 with Biology/PCM', 'Join B.Sc Agriculture', 'Gain field experience', 'Clear ARS/SRF for research', 'Join agri firm / govt dept', 'Specialise in agro-tech / research'],
  Defence:     ['Clear Class 12 with PCM', 'Crack NDA / CDS / AFCAT', 'Complete training at NDA/IMA/AFA', 'Get commissioned as officer', 'Complete unit postings', 'Rise through ranks to senior officer'],
  Media:       ['Complete BA Journalism / Mass Comm', 'Complete PG diploma at IIMC/ACJ', 'Intern at media house', 'Start as junior reporter/writer', 'Build byline and credibility', 'Grow to senior journalist / editor'],
  Education:   ['Complete graduation in subject', 'Complete B.Ed / D.El.Ed', 'Clear CTET / State TET', 'Join school as teacher', 'Pursue M.Ed for advancement', 'Move to principal / academic head'],
}

const TOP_EMPLOYERS: Record<string, string[]> = {
  Technology:  ['Google', 'Microsoft', 'Amazon', 'Infosys', 'TCS', 'Wipro', 'Flipkart', 'Zomato'],
  Medical:     ['AIIMS', 'Apollo Hospitals', 'Fortis', 'Max Healthcare', 'Narayana Health', 'NIMHANS'],
  Law:         ['Supreme Court', 'AZB & Partners', 'Cyril Amarchand', 'Trilegal', 'S&R Associates'],
  Finance:     ['SEBI', 'RBI', 'Goldman Sachs', 'JP Morgan', 'HDFC Bank', 'ICICI Bank', 'Deloitte'],
  Government:  ['IAS (DoPT)', 'IPS (MHA)', 'IFS (MEA)', 'State Governments', 'PSUs', 'UPSC'],
  Engineering: ['L&T', 'BHEL', 'NTPC', 'ONGC', 'Tata Steel', 'Reliance', 'ISRO', 'DRDO'],
  Management:  ['McKinsey', 'BCG', 'Bain', 'Deloitte', 'KPMG', 'Amazon', 'HUL', 'ITC'],
  Research:    ['ISRO', 'DRDO', 'CSIR', 'IISc', 'IITs', 'TIFR', 'BARC', 'DST'],
  Design:      ['Myntra', 'Nykaa', 'Zomato', 'Swiggy', 'Ogilvy', 'Dentsu', 'WPP', 'Pentagram'],
  Agriculture: ['IARI', 'ICAR', 'NSC', 'Mahindra Agri', 'UPL', 'Bayer', 'State Agri Depts'],
  Defence:     ['Indian Army', 'Indian Navy', 'Indian Air Force', 'DRDO', 'HAL', 'BEL', 'ISRO'],
  Media:       ['Times of India', 'NDTV', 'The Hindu', 'India Today', 'ANI', 'BBC India', 'Netflix India'],
  Education:   ['Navodaya Vidyalaya', 'KVS', 'CBSE', 'NCERT', 'State Boards', 'BYJU\'S', 'Unacademy'],
}

const KEY_FACTS: Record<string, { icon: string; text: string }[]> = {
  Technology:  [{ icon: '💻', text: 'India has 5M+ software developers' }, { icon: '📈', text: 'IT sector growing at 15% annually' }, { icon: '🌍', text: 'Remote work widely available' }, { icon: '💰', text: 'Top engineers earn ₹1Cr+ at FAANG' }],
  Medical:     [{ icon: '🏥', text: 'India needs 600K+ more doctors' }, { icon: '📚', text: 'NEET is mandatory for all medical colleges' }, { icon: '⏰', text: 'MBBS takes 5.5 years including internship' }, { icon: '🌟', text: 'Specialists earn ₹50L–₹2Cr/yr' }],
  Law:         [{ icon: '⚖️', text: '1.5M+ advocates enrolled in India' }, { icon: '🏛️', text: 'Supreme Court has only 34 judges' }, { icon: '💼', text: 'Corporate lawyers earn ₹30L–₹1Cr+' }, { icon: '📜', text: 'Bar Council enrolment mandatory to practice' }],
  Finance:     [{ icon: '📊', text: 'Finance is among highest-paying sectors' }, { icon: '🏦', text: 'India has 12 public sector banks' }, { icon: '📈', text: 'Fintech growing at 22% CAGR' }, { icon: '🎓', text: 'CA pass rate is only ~10-15%' }],
  Government:  [{ icon: '🇮🇳', text: 'UPSC selects ~1000 officers per year' }, { icon: '📚', text: 'Average prep time: 2-4 years' }, { icon: '💼', text: 'Job security + pension benefits' }, { icon: '🏆', text: 'IAS is India\'s most prestigious career' }],
  Engineering: [{ icon: '🔧', text: '1.5M engineers graduate yearly in India' }, { icon: '🏗️', text: 'Core engineering salaries ₹5L–₹30L' }, { icon: '🌟', text: 'GATE score opens PSU + M.Tech doors' }, { icon: '🌍', text: 'Global demand for Indian engineers' }],
  Management:  [{ icon: '🎓', text: 'IIM graduates earn avg ₹25–30L first job' }, { icon: '🌍', text: 'MBA opens doors globally' }, { icon: '💡', text: 'Entrepreneurship common path' }, { icon: '📈', text: 'Management consulting growing rapidly' }],
  Research:    [{ icon: '🔬', text: 'JRF fellowship: ₹37K/month' }, { icon: '🏛️', text: 'India ranks 3rd in research output in Asia' }, { icon: '🌍', text: 'Global collaboration opportunities' }, { icon: '🎓', text: 'PhD + postdoc path takes 8-10 years' }],
  Design:      [{ icon: '🎨', text: 'Design industry worth $15B in India' }, { icon: '📱', text: 'UX/UI most in-demand design skill' }, { icon: '🏆', text: 'NID/NIFT graduates highly sought after' }, { icon: '🌍', text: 'Remote freelance opportunities abundant' }],
  Agriculture: [{ icon: '🌾', text: '58% of India depends on agriculture' }, { icon: '📈', text: 'Agritech attracting heavy VC investment' }, { icon: '🏛️', text: 'Govt schemes: PM Kisan, PMFBY' }, { icon: '🔬', text: 'Agricultural research offers stable careers' }],
  Defence:     [{ icon: '🎖️', text: 'Prestigious & respected career' }, { icon: '💰', text: 'Tax-free salary + perks + pension' }, { icon: '🏋️', text: 'High physical fitness required' }, { icon: '🌍', text: 'UN Peacekeeping missions available' }],
  Media:       [{ icon: '📺', text: 'OTT platforms creating new opportunities' }, { icon: '📱', text: 'Digital media fastest growing segment' }, { icon: '✍️', text: 'Freelance journalism widely available' }, { icon: '🎬', text: 'Film & web series boom in India' }],
  Education:   [{ icon: '📚', text: '9.5M teachers needed across India' }, { icon: '💻', text: 'EdTech sector worth $4B+' }, { icon: '🏛️', text: 'Govt teaching jobs offer job security' }, { icon: '🌟', text: 'CTET/TET mandatory for govt schools' }],
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Salary N/A'
  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }
  if (min && max) return `${fmt(min)} – ${fmt(max)}/yr`
  if (min) return `From ${fmt(min)}/yr`
  return `Up to ${fmt(max!)}/yr`
}

function formatFees(min: number | null, max: number | null): string {
  if (min === 0 && max === 0) return 'Free'
  if (!min && !max) return 'N/A'
  const fmt = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}/yr`
  return fmt(min ?? max ?? 0) + '/yr'
}

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('careers').select('title').eq('slug', slug).single()
  return { title: data?.title ? `${data.title} Career Guide | CareerGuide` : 'Career | CareerGuide' }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CareerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: careerRaw } = await supabase
    .from('careers')
    .select('id, title, slug, description, category, avg_salary_min, avg_salary_max, salary_currency, growth_level, competition_level, work_life_balance, demand_score, is_trending, created_at')
    .eq('slug', slug)
    .single()

  if (!careerRaw) notFound()
  const career = careerRaw as any

  // Skills
  const { data: skillsRaw } = await supabase
    .from('career_skills')
    .select('skill_id, skills(name, category)')
    .eq('career_id', career.id)
    .limit(20)
  const careerSkills: any[] = skillsRaw ?? []

  // Exams
  const { data: examsRaw } = await supabase
    .from('career_exams')
    .select('exam_id, exams(name, slug, exam_type, conducting_body)')
    .eq('career_id', career.id)
    .limit(10)
  const careerExams: any[] = examsRaw ?? []

  // ✅ FIXED: Fetch colleges relevant to this career's CATEGORY
  const categorySlugs = CATEGORY_COLLEGES[career.category] ?? []
  let relatedColleges: any[] = []

  if (categorySlugs.length > 0) {
    const { data: collegesRaw } = await supabase
      .from('colleges')
      .select('id, name, slug, type, state, city, nirf_rank, naac_grade, annual_fees_min, annual_fees_max')
      .in('slug', categorySlugs)
      .order('nirf_rank', { ascending: true, nullsFirst: false })
      .limit(8)
    relatedColleges = collegesRaw ?? []
  }

  // Similar careers
  const { data: similarRaw } = await supabase
    .from('careers')
    .select('id, title, slug, category, avg_salary_min, avg_salary_max, demand_score, growth_level')
    .eq('category', career.category ?? '')
    .neq('id', career.id)
    .limit(5)
  const similarCareers: any[] = similarRaw ?? []

  // Group skills by category
  const skillGroups = careerSkills.reduce<Record<string, string[]>>((acc, cs) => {
    if (!cs.skills) return acc
    const cat: string = cs.skills.category ?? 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(cs.skills.name as string)
    return acc
  }, {})

  const growthConfig = GROWTH_COLORS[career.growth_level] ?? GROWTH_COLORS['Medium']
  const categoryColor = career.category ? (CATEGORY_COLORS[career.category] ?? 'bg-gray-100 text-gray-700') : 'bg-gray-100 text-gray-700'
  const careerSteps = CAREER_STEPS[career.category] ?? CAREER_STEPS['Technology']
  const topEmployers = TOP_EMPLOYERS[career.category] ?? TOP_EMPLOYERS['Technology']
  const keyFacts = KEY_FACTS[career.category] ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/careers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Careers
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {career.category && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>{career.category}</span>
                )}
                {career.growth_level && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${growthConfig.bg} ${growthConfig.text}`}>
                    {career.growth_level} Growth
                  </span>
                )}
                {career.is_trending && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Trending
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">{career.title}</h1>
              {career.description && <p className="text-gray-600 leading-relaxed text-sm">{career.description}</p>}

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <IndianRupee className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <div className="text-sm font-bold text-gray-800">{formatSalary(career.avg_salary_min, career.avg_salary_max)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Avg Salary</div>
                </div>
                <div className="text-center">
                  <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${growthConfig.text}`} />
                  <div className="text-sm font-bold text-gray-800">{career.growth_level ?? 'N/A'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Growth</div>
                </div>
                <div className="text-center">
                  <BarChart3 className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                  <div className="text-sm font-bold text-gray-800">{career.demand_score ?? 'N/A'}/10</div>
                  <div className="text-xs text-gray-400 mt-0.5">Demand</div>
                </div>
                <div className="text-center">
                  <Scale className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <div className="text-sm font-bold text-gray-800">{career.competition_level ?? 'N/A'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Competition</div>
                </div>
              </div>

              {/* Score Bars */}
              <div className="mt-5 space-y-3">
                {career.demand_score && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Demand Score</span>
                      <span className="font-semibold text-indigo-600">{career.demand_score}/10</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(career.demand_score / 10) * 100}%` }} />
                    </div>
                  </div>
                )}
                {career.work_life_balance && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> Work-Life Balance</span>
                      <span className="font-semibold text-pink-600">{career.work_life_balance}/10</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-pink-400 h-2 rounded-full" style={{ width: `${(career.work_life_balance / 10) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/recommend" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                  <Target className="w-4 h-4" /> Get Recommendations
                </Link>
                <Link href={`/roadmaps/${career.slug}`} className="inline-flex items-center gap-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                  <Lightbulb className="w-4 h-4" /> View Roadmap
                </Link>
              </div>
            </div>

            {/* Key Facts */}
            {keyFacts.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-indigo-500" />
                  Key Facts about {career.category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {keyFacts.map((fact, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-indigo-100">
                      <span className="text-xl">{fact.icon}</span>
                      <p className="text-sm text-gray-700">{fact.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Path Steps */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-green-500" />
                How to Become a {career.title}
              </h2>
              <div className="space-y-3">
                {careerSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 font-medium pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            {careerSkills.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  Skills Required
                  <span className="text-sm font-normal text-gray-400">({careerSkills.length})</span>
                </h2>
                {Object.keys(skillGroups).length > 1 ? (
                  <div className="space-y-4">
                    {Object.entries(skillGroups).map(([cat, skills]) => (
                      <div key={cat}>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</h3>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg font-medium border border-indigo-100">{skill}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {careerSkills.map((cs, i) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg font-medium border border-indigo-100">
                        {cs.skills?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Top Employers */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Top Employers
              </h2>
              <div className="flex flex-wrap gap-2">
                {topEmployers.map((employer, i) => (
                  <span key={i} className="px-3 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-200 font-medium hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                    {employer}
                  </span>
                ))}
              </div>
            </div>

            {/* Entrance Exams */}
            {careerExams.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                  Entrance Exams
                  <span className="text-sm font-normal text-gray-400">({careerExams.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {careerExams.map((ce) => (
                    ce.exams && (
                      <Link key={ce.exam_id} href="/exams">
                        <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors group border border-transparent hover:border-orange-200">
                          <div>
                            <p className="text-sm font-medium text-gray-800 group-hover:text-orange-700">{ce.exams.name}</p>
                            {ce.exams.conducting_body && <p className="text-xs text-gray-400 mt-0.5">{ce.exams.conducting_body}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {ce.exams.exam_type && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{ce.exams.exam_type}</span>}
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                          </div>
                        </div>
                      </Link>
                    )
                  ))}
                </div>
                <Link href="/exams" className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all exams →</Link>
              </div>
            )}

            {/* ✅ FIXED: Best Colleges for THIS Career */}
            {relatedColleges.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                  Best Colleges for {career.category}
                </h2>
                <p className="text-xs text-gray-400 mb-4">Top institutions that offer programs relevant to this career</p>
                <div className="space-y-3">
                  {relatedColleges.map((college) => (
                    <Link key={college.id} href={`/colleges/${college.slug}`}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors group border border-transparent hover:border-purple-200">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-purple-700 truncate">{college.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {college.city}, {college.state}
                            {college.naac_grade ? ` · NAAC ${college.naac_grade}` : ''}
                            {` · ${college.type}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          {college.nirf_rank && (
                            <div className="text-center">
                              <div className="text-xs font-bold text-indigo-600">#{college.nirf_rank}</div>
                              <div className="text-xs text-gray-400">NIRF</div>
                            </div>
                          )}
                          <div className="text-right">
                            <div className="text-xs font-medium text-gray-600">{formatFees(college.annual_fees_min, college.annual_fees_max)}</div>
                            <div className="text-xs text-gray-400">per year</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/colleges" className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Browse all colleges →
                </Link>
              </div>
            )}

            {/* Salary by Experience */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-500" /> Salary by Experience
              </h2>
              <div className="space-y-3">
                {[
                  { level: 'Entry Level (0–2 yrs)',    pct: 40, color: 'bg-blue-400',    min: career.avg_salary_min, max: career.avg_salary_min ? Math.round(career.avg_salary_min * 1.3) : null },
                  { level: 'Mid Level (3–7 yrs)',      pct: 65, color: 'bg-indigo-500',  min: career.avg_salary_min ? Math.round(career.avg_salary_min * 1.5) : null, max: career.avg_salary_max },
                  { level: 'Senior Level (8–15 yrs)',  pct: 85, color: 'bg-purple-500',  min: career.avg_salary_max, max: career.avg_salary_max ? Math.round(career.avg_salary_max * 1.8) : null },
                  { level: 'Expert / Lead (15+ yrs)',  pct: 100, color: 'bg-pink-500',   min: career.avg_salary_max ? Math.round(career.avg_salary_max * 1.5) : null, max: career.avg_salary_max ? Math.round(career.avg_salary_max * 3) : null },
                ].map(({ level, pct, color, min, max }) => (
                  <div key={level}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{level}</span>
                      <span className="text-green-700 font-semibold">{formatSalary(min, max)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-5">

            {/* Overview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Career Overview
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Category',    value: career.category,           Icon: Target     },
                  { label: 'Growth',      value: career.growth_level,       Icon: TrendingUp  },
                  { label: 'Competition', value: career.competition_level,  Icon: Scale      },
                  { label: 'Demand',      value: career.demand_score ? `${career.demand_score}/10` : null, Icon: BarChart3 },
                  { label: 'Work-Life',   value: career.work_life_balance ? `${career.work_life_balance}/10` : null, Icon: Heart },
                  { label: 'Trending',    value: career.is_trending ? 'Yes 🔥' : 'Stable',  Icon: Flame  },
                ].filter(item => item.value).map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500"><Icon className="w-3.5 h-3.5" />{label}</div>
                    <span className="text-xs font-medium text-gray-800">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500"><IndianRupee className="w-3.5 h-3.5" />Salary</div>
                  <span className="text-xs font-medium text-green-700">{formatSalary(career.avg_salary_min, career.avg_salary_max)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <h3 className="text-sm font-semibold text-indigo-800 mb-3">Quick Actions</h3>
              <div className="space-y-1">
                {[
                  { href: '/recommend',              Icon: Target,    label: 'Get Recommendations' },
                  { href: `/roadmaps/${career.slug}`, Icon: Lightbulb, label: 'Career Roadmap'      },
                  { href: '/exams',                  Icon: BookOpen,  label: 'Browse Exams'        },
                  { href: '/colleges',               Icon: Building2, label: 'Browse Colleges'     },
                ].map(({ href, Icon, label }) => (
                  <Link key={label} href={href} className="flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-900 transition-colors p-2 hover:bg-indigo-100 rounded-lg">
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Is this right for you */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-green-500" /> Is this right for you?
              </h3>
              <div className="space-y-2">
                {[
                  { text: `You enjoy ${career.category?.toLowerCase() ?? 'this field'} topics`, good: true },
                  { text: 'Manageable competition level', good: career.competition_level !== 'Very High' },
                  { text: 'Good work-life balance', good: (career.work_life_balance ?? 5) >= 6 },
                  { text: 'High job demand in market', good: (career.demand_score ?? 5) >= 7 },
                  { text: 'Strong growth potential', good: ['High', 'Very High'].includes(career.growth_level) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.good ? 'bg-green-100' : 'bg-red-100'}`}>
                      <span className={`text-xs ${item.good ? 'text-green-600' : 'text-red-500'}`}>{item.good ? '✓' : '✕'}</span>
                    </div>
                    <p className="text-xs text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
              <Link href="/recommend" className="mt-4 block text-center text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Take Career Quiz →
              </Link>
            </div>

            {/* Similar Careers */}
            {similarCareers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Similar Careers
                </h3>
                <div className="space-y-1">
                  {similarCareers.map((sc) => (
                    <Link key={sc.id} href={`/careers/${sc.slug}`}>
                      <div className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{sc.title}</p>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500" />
                        </div>
                        {(sc.avg_salary_min || sc.avg_salary_max) && (
                          <p className="text-xs text-green-600 mt-0.5">{formatSalary(sc.avg_salary_min, sc.avg_salary_max)}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/careers" className="mt-3 block text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium">View all careers →</Link>
              </div>
            )}

            {/* Dashboard CTA */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
              <GraduationCap className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="font-semibold text-sm mb-1">Track Your Progress</h3>
              <p className="text-xs text-indigo-200 mb-3">Save this career and track your journey on your dashboard.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-white text-indigo-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                Go to Dashboard <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
