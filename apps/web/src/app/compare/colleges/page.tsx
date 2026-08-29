'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, MapPin, IndianRupee, Star, X, CheckCircle2, Award, Users } from 'lucide-react'

interface College {
  id: string
  name: string
  slug: string
  type: string
  state: string
  city: string
  nirf_rank: number | null
  qs_rank: number | null
  naac_grade: string | null
  established_year: number | null
  annual_fees_min: number | null
  annual_fees_max: number | null
  total_students: number | null
  is_featured: boolean
}

export default function CompareCollegesPage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchColleges() {
      const searchParams = new URLSearchParams(window.location.search)
      const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

      if (ids.length === 0 || ids.length > 3) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('colleges')
        .select('*')
        .in('id', ids)

      setColleges(data as College[] || [])
      setLoading(false)
    }
    fetchColleges()
  }, [supabase])

  const removeCollege = (id: string) => {
    const updated = colleges.filter(c => c.id !== id)
    setColleges(updated)
    if (updated.length > 0) {
      const newIds = updated.map(c => c.id).join(',')
      window.history.replaceState({}, '', `/compare/colleges?ids=${newIds}`)
    } else {
      window.location.href = '/colleges'
    }
  }

  const formatFees = (min: number | null, max: number | null) => {
    if (min === 0 && max === 0) return 'Free'
    if (!min && !max) return 'N/A'
    const fmt = (n: number) => {
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
      return `₹${n}`
    }
    if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}/yr`
    return fmt(min ?? max ?? 0) + '/yr'
  }

  const formatStudents = (n: number | null) => {
    if (!n) return 'N/A'
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
    return `${n}`
  }

  const getTypeColor = (type: string) => {
    if (type === 'Government') return 'bg-green-100 text-green-700'
    if (type === 'Private') return 'bg-blue-100 text-blue-700'
    return 'bg-purple-100 text-purple-700'
  }

  const getNAACColor = (grade: string) => {
    if (grade === 'A++') return 'bg-emerald-100 text-emerald-700'
    if (grade === 'A+') return 'bg-green-100 text-green-700'
    if (grade === 'A') return 'bg-lime-100 text-lime-700'
    if (grade === 'B+') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (colleges.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/colleges" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Colleges
          </Link>
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-500">No colleges selected for comparison. Please select 2-3 colleges to compare.</p>
            <Link href="/colleges" className="inline-flex items-center gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Browse Colleges
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/colleges" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Colleges
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Compare Colleges</h1>
            <p className="text-gray-500 mt-1">Comparing {colleges.length} colleges side by side</p>
          </div>
          <Link href="/colleges" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Add more colleges →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            <div className="font-semibold text-gray-700">Attribute</div>
            {colleges.map((college) => (
              <div key={college.id} className="relative">
                <Link href={`/colleges/${college.slug}`} className="font-semibold text-gray-900 hover:text-indigo-700 transition-colors line-clamp-2">
                  {college.name}
                </Link>
                <button
                  onClick={() => removeCollege(college.id)}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  title="Remove from comparison"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {colleges.length < 3 && (
              <div className="flex items-center justify-center">
                <Link href="/colleges" className="text-sm text-indigo-600 hover:text-indigo-800">
                  + Add college
                </Link>
              </div>
            )}
          </div>

          {/* Comparison rows */}
          <div className="divide-y divide-gray-100">
            {/* Type */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium">Type</div>
              {colleges.map((college) => (
                <div key={college.id}>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(college.type)}`}>
                    {college.type}
                  </span>
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>

            {/* Location */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </div>
              {colleges.map((college) => (
                <div key={college.id} className="text-sm text-gray-700">
                  {college.city}, {college.state}
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>

            {/* NIRF Rank */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <Award className="w-4 h-4" /> NIRF Rank
              </div>
              {colleges.map((college) => (
                <div key={college.id} className="text-sm font-bold text-indigo-600">
                  {college.nirf_rank ? `#${college.nirf_rank}` : 'N/A'}
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>

            {/* QS Rank */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <Award className="w-4 h-4" /> QS Rank
              </div>
              {colleges.map((college) => (
                <div key={college.id} className="text-sm font-bold text-amber-600">
                  {college.qs_rank ? `#${college.qs_rank}` : 'N/A'}
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>

            {/* NAAC Grade */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium">NAAC Grade</div>
              {colleges.map((college) => (
                <div key={college.id}>
                  {college.naac_grade && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getNAACColor(college.naac_grade)}`}>
                      {college.naac_grade}
                    </span>
                  )}
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>

            {/* Annual Fees */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Annual Fees
              </div>
              {colleges.map((college) => (
                <div key={college.id} className="text-sm font-semibold text-green-600">
                  {formatFees(college.annual_fees_min, college.annual_fees_max)}
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>

            {/* Students */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Students
              </div>
              {colleges.map((college) => (
                <div key={college.id} className="text-sm text-gray-700">
                  {formatStudents(college.total_students)}
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>

            {/* Established Year */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Established
              </div>
              {colleges.map((college) => (
                <div key={college.id} className="text-sm text-gray-700">
                  {college.established_year ? college.established_year : 'N/A'}
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>

            {/* Featured */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium">Featured</div>
              {colleges.map((college) => (
                <div key={college.id}>
                  {college.is_featured ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      <Star className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">No</span>
                  )}
                </div>
              ))}
              {colleges.length < 3 && <div />}
            </div>
          </div>
        </div>

        {/* Best for you recommendation */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Best Match Based on Your Profile
          </h3>
          {(() => {
            const bestMatch = [...colleges].sort((a, b) => {
              const aRank = a.nirf_rank || 9999
              const bRank = b.nirf_rank || 9999
              return aRank - bRank
            })[0]
            return bestMatch ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Based on NIRF ranking and reputation</p>
                  <Link href={`/colleges/${bestMatch.slug}`} className="text-lg font-bold text-indigo-700 hover:text-indigo-900 mt-1">
                    {bestMatch.name}
                  </Link>
                </div>
                <Link href={`/colleges/${bestMatch.slug}`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  View Details
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Complete your profile to get personalized recommendations</p>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
