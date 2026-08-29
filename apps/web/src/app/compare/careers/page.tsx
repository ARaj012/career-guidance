'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, IndianRupee, BarChart3, Scale, Heart, X, CheckCircle2 } from 'lucide-react'

interface Career {
  id: string
  title: string
  slug: string
  description: string | null
  category: string | null
  avg_salary_min: number | null
  avg_salary_max: number | null
  growth_level: string | null
  competition_level: string | null
  demand_score: number | null
  work_life_balance: number | null
  is_trending: boolean
}

export default function CompareCareersPage() {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCareers() {
      const searchParams = new URLSearchParams(window.location.search)
      const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

      if (ids.length === 0 || ids.length > 3) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('careers')
        .select('*')
        .in('id', ids)

      setCareers(data as Career[] || [])
      setLoading(false)
    }
    fetchCareers()
  }, [supabase])

  const removeCareer = (id: string) => {
    const updated = careers.filter(c => c.id !== id)
    setCareers(updated)
    if (updated.length > 0) {
      const newIds = updated.map(c => c.id).join(',')
      window.history.replaceState({}, '', `/compare/careers?ids=${newIds}`)
    } else {
      window.location.href = '/careers'
    }
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'N/A'
    const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`
    if (min && max) return `${fmt(min)} – ${fmt(max)}/yr`
    if (min) return `From ${fmt(min)}/yr`
    return `Up to ${fmt(max!)}/yr`
  }

  const getGrowthColor = (level: string) => {
    if (level === 'Very High') return 'text-emerald-600 bg-emerald-50'
    if (level === 'High') return 'text-green-600 bg-green-50'
    if (level === 'Medium') return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getCompetitionColor = (level: string) => {
    if (level === 'Very High') return 'text-red-600 bg-red-50'
    if (level === 'High') return 'text-orange-600 bg-orange-50'
    if (level === 'Medium') return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (careers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/careers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Careers
          </Link>
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-500">No careers selected for comparison. Please select 2-3 careers to compare.</p>
            <Link href="/careers" className="inline-flex items-center gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Browse Careers
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
            <Link href="/careers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Careers
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Compare Careers</h1>
            <p className="text-gray-500 mt-1">Comparing {careers.length} careers side by side</p>
          </div>
          <Link href="/careers" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Add more careers →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            <div className="font-semibold text-gray-700">Attribute</div>
            {careers.map((career) => (
              <div key={career.id} className="relative">
                <Link href={`/careers/${career.slug}`} className="font-semibold text-gray-900 hover:text-indigo-700 transition-colors">
                  {career.title}
                </Link>
                <button
                  onClick={() => removeCareer(career.id)}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  title="Remove from comparison"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {careers.length < 3 && (
              <div className="flex items-center justify-center">
                <Link href="/careers" className="text-sm text-indigo-600 hover:text-indigo-800">
                  + Add career
                </Link>
              </div>
            )}
          </div>

          {/* Comparison rows */}
          <div className="divide-y divide-gray-100">
            {/* Category */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium">Category</div>
              {careers.map((career) => (
                <div key={career.id} className="text-sm">
                  {career.category && (
                    <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      {career.category}
                    </span>
                  )}
                </div>
              ))}
              {careers.length < 3 && <div />}
            </div>

            {/* Salary */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Average Salary
              </div>
              {careers.map((career) => (
                <div key={career.id} className="text-sm font-semibold text-green-600">
                  {formatSalary(career.avg_salary_min, career.avg_salary_max)}
                </div>
              ))}
              {careers.length < 3 && <div />}
            </div>

            {/* Growth Level */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Growth Level
              </div>
              {careers.map((career) => (
                <div key={career.id}>
                  {career.growth_level && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getGrowthColor(career.growth_level)}`}>
                      {career.growth_level}
                    </span>
                  )}
                </div>
              ))}
              {careers.length < 3 && <div />}
            </div>

            {/* Competition Level */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <Scale className="w-4 h-4" /> Competition
              </div>
              {careers.map((career) => (
                <div key={career.id}>
                  {career.competition_level && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(career.competition_level)}`}>
                      {career.competition_level}
                    </span>
                  )}
                </div>
              ))}
              {careers.length < 3 && <div />}
            </div>

            {/* Demand Score */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Demand Score
              </div>
              {careers.map((career) => (
                <div key={career.id} className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${(career.demand_score || 0) * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{career.demand_score || 0}/10</span>
                </div>
              ))}
              {careers.length < 3 && <div />}
            </div>

            {/* Work-Life Balance */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <Heart className="w-4 h-4" /> Work-Life Balance
              </div>
              {careers.map((career) => (
                <div key={career.id} className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-pink-400 h-2 rounded-full"
                      style={{ width: `${(career.work_life_balance || 0) * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-pink-600">{career.work_life_balance || 0}/10</span>
                </div>
              ))}
              {careers.length < 3 && <div />}
            </div>

            {/* Trending */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium">Trending</div>
              {careers.map((career) => (
                <div key={career.id}>
                  {career.is_trending ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                      🔥 Yes
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">No</span>
                  )}
                </div>
              ))}
              {careers.length < 3 && <div />}
            </div>

            {/* Description */}
            <div className="grid grid-cols-4 gap-4 p-4">
              <div className="text-sm text-gray-500 font-medium">Description</div>
              {careers.map((career) => (
                <div key={career.id} className="text-sm text-gray-600 line-clamp-3">
                  {career.description}
                </div>
              ))}
              {careers.length < 3 && <div />}
            </div>
          </div>
        </div>

        {/* Best for you recommendation */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Best Match Based on Your Profile
          </h3>
          {(() => {
            const bestMatch = [...careers].sort((a, b) => (b.demand_score || 0) - (a.demand_score || 0))[0]
            return bestMatch ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Based on demand score and growth potential</p>
                  <Link href={`/careers/${bestMatch.slug}`} className="text-lg font-bold text-indigo-700 hover:text-indigo-900 mt-1">
                    {bestMatch.title}
                  </Link>
                </div>
                <Link href={`/careers/${bestMatch.slug}`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
