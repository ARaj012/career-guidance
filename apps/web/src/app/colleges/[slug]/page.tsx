/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, GraduationCap, ExternalLink, Building2, BookOpen,
  Star, CalendarDays, ArrowLeft, BadgeCheck, Trophy, Users,
  Award, IndianRupee, ChevronRight,
} from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  Government: 'bg-green-100 text-green-700',
  Private:    'bg-blue-100 text-blue-700',
  Deemed:     'bg-purple-100 text-purple-700',
}

const NAAC_COLORS: Record<string, string> = {
  'A++': 'bg-emerald-100 text-emerald-700',
  'A+':  'bg-green-100 text-green-700',
  'A':   'bg-lime-100 text-lime-700',
  'B+':  'bg-yellow-100 text-yellow-700',
}

function formatStudents(n: number | null): string | null {
  if (!n) return null
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `${(n / 1000).toFixed(0)}K`
  return `${n}`
}

function formatFees(min: number | null, max: number | null): string {
  if (min === 0 && max === 0) return 'Free / Govt Subsidized'
  if (!min && !max) return 'Fee info N/A'
  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}/yr`
  if (min) return `From ${fmt(min)}/yr`
  return `Up to ${fmt(max!)}/yr`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('colleges').select('name').eq('slug', slug).single()
  return {
    title: data?.name ? `${data.name} | CareerGuide` : 'College | CareerGuide',
  }
}

export default async function CollegeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // ✅ Await params — required in Next.js 15/16
  const { slug } = await params

  const supabase = await createServerSupabaseClient()

  const { data: collegeRaw } = await supabase
    .from('colleges')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!collegeRaw) notFound()

  const college = collegeRaw as any

  const { data: coursesRaw } = await supabase
    .from('college_courses')
    .select('*')
    .eq('college_id', college.id)
    .order('degree_type')

  const courses: any[] = coursesRaw ?? []

  const { data: cutoffsRaw } = await supabase
    .from('college_exam_cutoffs')
    .select('*, exams(name, slug)')
    .eq('college_id', college.id)
    .order('year', { ascending: false })

  const cutoffs: any[] = cutoffsRaw ?? []

  // Group courses by degree type
  const degreeGroups = courses.reduce<Record<string, any[]>>((acc, c) => {
    const key = c.degree_type || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const degreeOrder = ['Undergraduate', 'Postgraduate', 'Doctoral', 'Diploma', 'Other']
  const sortedDegrees = Object.keys(degreeGroups).sort(
    (a, b) => degreeOrder.indexOf(a) - degreeOrder.indexOf(b)
  )

  const isTopRanked = college.nirf_rank && college.nirf_rank <= 10
  const typeColor = TYPE_COLORS[college.type] ?? 'bg-gray-100 text-gray-700'
  const naacColor = college.naac_grade ? (NAAC_COLORS[college.naac_grade] ?? 'bg-gray-100 text-gray-600') : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Accent bar */}
      <div className={`h-1.5 ${isTopRanked ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link href="/colleges" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Colleges
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor}`}>
                  {college.type}
                </span>
                {college.naac_grade && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${naacColor}`}>
                    NAAC {college.naac_grade}
                  </span>
                )}
                {college.is_featured && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Featured
                  </span>
                )}
                {college.established_year && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Est. {college.established_year}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">{college.name}</h1>

              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                {college.city ? `${college.city}, ` : ''}{college.state}
                {college.country ? `, ${college.country}` : ''}
              </div>
            </div>

            {/* Rank Badges */}
            <div className="flex sm:flex-col gap-3 flex-shrink-0">
              {college.nirf_rank && (
                <div className="text-center bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 min-w-[80px]">
                  <Trophy className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-indigo-700">#{college.nirf_rank}</div>
                  <div className="text-xs text-indigo-400 font-medium">NIRF Rank</div>
                </div>
              )}
              {college.qs_rank && (
                <div className="text-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 min-w-[80px]">
                  <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-amber-600">#{college.qs_rank}</div>
                  <div className="text-xs text-amber-400 font-medium">QS Rank</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center">
              <BookOpen className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <div className="text-lg font-semibold text-gray-800">{courses.length > 0 ? courses.length : '—'}</div>
              <div className="text-xs text-gray-400">Courses</div>
            </div>
            <div className="text-center">
              <Users className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-semibold text-gray-800">{formatStudents(college.total_students) ?? '—'}</div>
              <div className="text-xs text-gray-400">Students</div>
            </div>
            <div className="text-center">
              <Building2 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-semibold text-gray-800">{college.type}</div>
              <div className="text-xs text-gray-400">Type</div>
            </div>
            <div className="text-center">
              <BadgeCheck className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-semibold text-gray-800">{college.naac_grade ?? '—'}</div>
              <div className="text-xs text-gray-400">NAAC Grade</div>
            </div>
          </div>

          {/* Fees Banner */}
          {(college.annual_fees_min !== null || college.annual_fees_max !== null) && (
            <div className="mt-5 flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
              <IndianRupee className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  {formatFees(college.annual_fees_min, college.annual_fees_max)}
                </p>
                {college.fee_note && (
                  <p className="text-xs text-green-600 mt-0.5">{college.fee_note}</p>
                )}
              </div>
            </div>
          )}

          {/* Website Button */}
          {college.website_url && (
            <div className="mt-5">
              <a
                href={college.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Visit Official Website <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Courses */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Courses Offered
                {courses.length > 0 && (
                  <span className="text-sm font-normal text-gray-400">({courses.length} total)</span>
                )}
              </h2>

              {courses.length > 0 ? (
                <div className="space-y-5">
                  {sortedDegrees.map(degree => (
                    <div key={degree}>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          degree === 'Undergraduate' ? 'bg-blue-400' :
                          degree === 'Postgraduate'  ? 'bg-purple-400' :
                          degree === 'Doctoral'      ? 'bg-rose-400' :
                          'bg-gray-400'
                        }`} />
                        {degree}
                        <span className="font-normal normal-case">({degreeGroups[degree].length})</span>
                      </h3>
                      <div className="space-y-2">
                        {degreeGroups[degree].map((course: any) => (
                          <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{course.course_name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {course.duration_years} year{course.duration_years > 1 ? 's' : ''}
                                {course.total_seats ? ` · ${course.total_seats} seats` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {course.annual_fees && (
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                  {formatFees(course.annual_fees, null)}
                                </span>
                              )}
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                degree === 'Undergraduate' ? 'bg-blue-50 text-blue-600' :
                                degree === 'Postgraduate'  ? 'bg-purple-50 text-purple-600' :
                                degree === 'Doctoral'      ? 'bg-rose-50 text-rose-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {degree === 'Undergraduate' ? 'UG' :
                                 degree === 'Postgraduate'  ? 'PG' :
                                 degree === 'Doctoral'      ? 'PhD' : 'Diploma'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Course details coming soon</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Exam Cutoffs */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" /> Admission Cutoffs
              </h2>
              {cutoffs.length > 0 ? (
                <div className="space-y-3">
                  {cutoffs.map((cutoff: any) => (
                    <div key={cutoff.id} className="p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">
                          {cutoff.exams?.name ?? 'Exam'}
                        </p>
                        <span className="text-xs text-gray-400">{cutoff.year}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {cutoff.cutoff_score
                          ? `Min Score: ${cutoff.cutoff_score}`
                          : cutoff.cutoff_rank
                          ? `Rank: #${cutoff.cutoff_rank}`
                          : 'See official site'}
                        {cutoff.category ? ` · ${cutoff.category}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Cutoff data coming soon</p>
              )}
              <Link href="/exams" className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Browse all exams →
              </Link>
            </div>

            {/* Fees Summary */}
            <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
              <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Fee Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Annual Fees</span>
                  <span className="font-semibold text-green-800">
                    {formatFees(college.annual_fees_min, college.annual_fees_max)}
                  </span>
                </div>
                {college.fee_note && (
                  <p className="text-xs text-green-600 mt-1">{college.fee_note}</p>
                )}
                <p className="text-xs text-green-500 mt-2">* Fees are approximate. Check official website for exact figures.</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
              <h3 className="text-sm font-semibold text-indigo-800 mb-3">Explore More</h3>
              <div className="space-y-2">
                {[
                  { href: '/careers',  icon: GraduationCap, label: 'Browse Careers'          },
                  { href: '/recommend',icon: BadgeCheck,    label: 'Get Recommendations'     },
                  { href: '/exams',    icon: Trophy,        label: 'View All Exams'          },
                  { href: '/colleges', icon: Building2,     label: 'All Colleges'            },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={label} href={href} className="flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-900 transition-colors group">
                    <Icon className="w-4 h-4" />
                    {label}
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
