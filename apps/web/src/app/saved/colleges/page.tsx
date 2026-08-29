'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Heart, Building2, MapPin, IndianRupee, X, Star, GraduationCap } from 'lucide-react'

interface SavedCollege {
  id: string
  created_at: string
  colleges: any
}

export default function SavedCollegesPage() {
  const [savedColleges, setSavedColleges] = useState<SavedCollege[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSavedColleges() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data } = await supabase
        .from('user_saved_colleges')
        .select('id, created_at, colleges(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setSavedColleges(data as any || [])
      setLoading(false)
    }
    fetchSavedColleges()
  }, [supabase])

  const removeSaved = async (id: string) => {
    await supabase.from('user_saved_colleges').delete().eq('id', id)
    setSavedColleges(prev => prev.filter(sc => sc.id !== id))
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

  const TYPE_COLORS: Record<string, string> = {
    Government: 'bg-green-100 text-green-700',
    Private: 'bg-blue-100 text-blue-700',
    Deemed: 'bg-purple-100 text-purple-700',
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
              <Heart className="w-8 h-8 text-pink-500" /> Saved Colleges
            </h1>
            <p className="text-gray-500 mt-1">{savedColleges.length} colleges saved</p>
          </div>
          <Link href="/colleges" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Browse all colleges →
          </Link>
        </div>

        {savedColleges.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved colleges yet</h2>
            <p className="text-gray-500 mb-6">Start exploring colleges and save your favorites to compare later</p>
            <Link href="/colleges" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <Building2 className="w-4 h-4" /> Explore Colleges
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedColleges.map((saved) => (
              <div key={saved.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/colleges/${saved.colleges.slug}`} className="group">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                              {saved.colleges.name}
                            </h3>
                            {saved.colleges.is_featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[saved.colleges.type] || 'bg-gray-100 text-gray-600'}`}>
                              {saved.colleges.type}
                            </span>
                            {saved.colleges.naac_grade && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                NAAC {saved.colleges.naac_grade}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {saved.colleges.city}, {saved.colleges.state}
                          </div>
                        </div>
                        {(saved.colleges.nirf_rank || saved.colleges.qs_rank) && (
                          <div className="flex-shrink-0 text-center bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                            <div className="text-base font-bold text-indigo-700">
                              #{saved.colleges.nirf_rank || saved.colleges.qs_rank}
                            </div>
                            <div className="text-xs text-indigo-400">{saved.colleges.nirf_rank ? 'NIRF' : 'QS'}</div>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {formatFees(saved.colleges.annual_fees_min, saved.colleges.annual_fees_max)}
                      </div>
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
