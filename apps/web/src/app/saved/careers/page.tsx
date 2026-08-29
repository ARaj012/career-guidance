'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Heart, Briefcase, TrendingUp, IndianRupee, X, ChevronRight } from 'lucide-react'

interface SavedCareer {
  id: string
  created_at: string
  careers: any
}

export default function SavedCareersPage() {
  const [savedCareers, setSavedCareers] = useState<SavedCareer[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSavedCareers() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data } = await supabase
        .from('user_saved_careers')
        .select('id, created_at, careers(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setSavedCareers(data as any || [])
      setLoading(false)
    }
    fetchSavedCareers()
  }, [supabase])

  const removeSaved = async (id: string) => {
    await supabase.from('user_saved_careers').delete().eq('id', id)
    setSavedCareers(prev => prev.filter(sc => sc.id !== id))
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Salary N/A'
    const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`
    if (min && max) return `${fmt(min)} – ${fmt(max)}/yr`
    if (min) return `From ${fmt(min)}/yr`
    return `Up to ${fmt(max!)}/yr`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-8 h-8 text-pink-500" /> Saved Careers
            </h1>
            <p className="text-gray-500 mt-1">{savedCareers.length} careers saved</p>
          </div>
          <Link href="/careers" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Browse all careers →
          </Link>
        </div>

        {savedCareers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved careers yet</h2>
            <p className="text-gray-500 mb-6">Start exploring careers and save your favorites to compare later</p>
            <Link href="/careers" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <Briefcase className="w-4 h-4" /> Explore Careers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedCareers.map((saved) => (
              <div key={saved.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/careers/${saved.careers.slug}`} className="group">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {saved.careers.title}
                      </h3>
                    </Link>
                    {saved.careers.category && (
                      <span className="inline-block mt-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {saved.careers.category}
                      </span>
                    )}
                    {saved.careers.description && (
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{saved.careers.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {formatSalary(saved.careers.avg_salary_min, saved.careers.avg_salary_max)}
                      </div>
                      {saved.careers.growth_level && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {saved.careers.growth_level} Growth
                        </div>
                      )}
                      {saved.careers.demand_score && (
                        <div className="text-indigo-600 font-medium">Demand: {saved.careers.demand_score}/10</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeSaved(saved.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from saved"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
