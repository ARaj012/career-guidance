'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import {
  Search, Filter, TrendingUp, IndianRupee, BarChart3,
  ChevronDown, X, Flame, Star, Briefcase,
} from 'lucide-react'

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
  is_trending: boolean
  work_life_balance: number | null
}

const CATEGORIES = [
  'All', 'Technology', 'Medical', 'Engineering', 'Finance',
  'Law', 'Government', 'Education', 'Research', 'Design',
  'Media', 'Management', 'Agriculture', 'Defence',
]

const GROWTH_LEVELS = ['All', 'Very High', 'High', 'Medium', 'Low']

const SORT_OPTIONS = [
  { value: 'demand',      label: 'Demand Score'   },
  { value: 'salary_high', label: 'Highest Salary' },
  { value: 'salary_low',  label: 'Lowest Salary'  },
  { value: 'name',        label: 'Name A–Z'        },
]

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

const GROWTH_COLORS: Record<string, string> = {
  'Very High': 'bg-emerald-100 text-emerald-700',
  'High':      'bg-green-100 text-green-700',
  'Medium':    'bg-yellow-100 text-yellow-700',
  'Low':       'bg-red-100 text-red-700',
}

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedGrowth, setSelectedGrowth] = useState('All')
  const [sortBy, setSortBy] = useState('demand')
  const [trendingOnly, setTrendingOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchCareers() {
      const { data } = await supabase
        .from('careers')
        .select('id, title, slug, description, category, avg_salary_min, avg_salary_max, growth_level, competition_level, demand_score, is_trending, work_life_balance')
        .order('demand_score', { ascending: false })
      setCareers(data ?? [])
      setLoading(false)
    }
    fetchCareers()
  }, [supabase])

  const filtered = useMemo(() => {
    let result = [...careers]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    }
    if (selectedCategory !== 'All') result = result.filter(c => c.category === selectedCategory)
    if (selectedGrowth !== 'All') result = result.filter(c => c.growth_level === selectedGrowth)
    if (trendingOnly) result = result.filter(c => c.is_trending)

    result.sort((a, b) => {
      if (sortBy === 'demand') return (b.demand_score ?? 0) - (a.demand_score ?? 0)
      if (sortBy === 'salary_high') return (b.avg_salary_max ?? 0) - (a.avg_salary_max ?? 0)
      if (sortBy === 'salary_low') return (a.avg_salary_min ?? 999999) - (b.avg_salary_min ?? 999999)
      if (sortBy === 'name') return a.title.localeCompare(b.title)
      return 0
    })

    return result
  }, [careers, search, selectedCategory, selectedGrowth, sortBy, trendingOnly])

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('All')
    setSelectedGrowth('All')
    setSortBy('demand')
    setTrendingOnly(false)
  }

  const hasActiveFilters = search || selectedCategory !== 'All' ||
    selectedGrowth !== 'All' || trendingOnly

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Salary N/A'
    const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`
    if (min && max) return `${fmt(min)} – ${fmt(max)}/yr`
    if (min) return `From ${fmt(min)}/yr`
    return `Up to ${fmt(max!)}/yr`
  }

  // Category counts
  const categoryCounts = useMemo(() => {
    return careers.reduce<Record<string, number>>((acc, c) => {
      if (c.category) acc[c.category] = (acc[c.category] ?? 0) + 1
      return acc
    }, {})
  }, [careers])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading careers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explore Careers</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {careers.length} careers across Technology, Medical, Law, Finance & more
              </p>
            </div>
          </div>

          {/* Category quick filters */}
          <div className="flex flex-wrap gap-2 mt-4 ml-14">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {cat}
                {cat !== 'All' && categoryCounts[cat] ? (
                  <span className={`ml-1 ${selectedCategory === cat ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {categoryCounts[cat]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Sort Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search careers, skills, categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
                hasActiveFilters
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Growth Level</label>
                <div className="flex gap-2 flex-wrap">
                  {GROWTH_LEVELS.map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrowth(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedGrowth === g
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Show</label>
                <button
                  onClick={() => setTrendingOnly(!trendingOnly)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    trendingOnly
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Trending Only
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:text-red-700"
                >
                  <X className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of {careers.length} careers
            {selectedCategory !== 'All' && (
              <span className="ml-1">in <span className="font-medium text-indigo-600">{selectedCategory}</span></span>
            )}
          </p>
          {trendingOnly && (
            <span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full">
              <Flame className="w-3 h-3" /> Trending careers only
            </span>
          )}
        </div>

        {/* Career Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No careers found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="mt-4 text-indigo-600 hover:underline text-sm">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(career => (
              <Link key={career.id} href={`/careers/${career.slug}`}>
                <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 p-5 h-full flex flex-col group cursor-pointer">

                  {/* Top badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {career.category && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[career.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {career.category}
                        </span>
                      )}
                      {career.is_trending && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> Trending
                        </span>
                      )}
                    </div>
                    {career.demand_score && (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {career.demand_score}/10
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
                    {career.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">
                    {career.description}
                  </p>

                  {/* Salary */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <IndianRupee className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600 font-semibold text-sm">
                      {formatSalary(career.avg_salary_min, career.avg_salary_max)}
                    </span>
                  </div>

                  {/* Growth + Competition badges */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    {career.growth_level && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${GROWTH_COLORS[career.growth_level] ?? 'bg-gray-100 text-gray-600'}`}>
                        <TrendingUp className="w-3 h-3" />
                        {career.growth_level} Growth
                      </span>
                    )}
                    {career.competition_level && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                        {career.competition_level} Competition
                      </span>
                    )}
                  </div>

                  {/* Demand score bar */}
                  {career.demand_score && (
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Demand Score
                        </span>
                        <span className="font-semibold text-indigo-600">{career.demand_score}/10</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${(career.demand_score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* View details */}
                  <div className="mt-3 text-xs text-indigo-600 group-hover:text-indigo-800 font-medium text-right">
                    View details →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}