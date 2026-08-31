'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import {
  MapPin, GraduationCap, Star, ExternalLink, Filter,
  Search, Building2, ChevronDown, X, Users, Award, IndianRupee,
  Check, GitCompare, Landmark,
} from 'lucide-react'

interface College {
  id: string
  name: string
  slug: string
  type: string
  state: string
  city: string
  country: string
  nirf_rank: number | null
  qs_rank: number | null
  naac_grade: string | null
  established_year: number | null
  website_url: string | null
  logo_url: string | null
  total_students: number | null
  is_featured: boolean
  annual_fees_min: number | null
  annual_fees_max: number | null
  fee_note: string | null
  why_join: string | null
}

const TYPE_COLORS: Record<string, string> = {
  Government: 'bg-green-100 text-green-700 border-green-200',
  Private: 'bg-blue-100 text-blue-700 border-blue-200',
  Deemed: 'bg-purple-100 text-purple-700 border-purple-200',
}

const NAAC_COLORS: Record<string, string> = {
  'A++': 'bg-emerald-100 text-emerald-700',
  'A+': 'bg-green-100 text-green-700',
  'A': 'bg-lime-100 text-lime-700',
  'B+': 'bg-yellow-100 text-yellow-700',
}

const STATES = [
  'All States','Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Odisha','Puducherry','Punjab','Rajasthan',
  'Tamil Nadu','Telangana','Tripura','Uttarakhand','Uttar Pradesh','West Bengal',
]

const DOMAINS = [
  'All Domains','Engineering','Medical','Management','Law','Civil Services',
  'Research','Design','Agriculture','Defence','Journalism','Hotel Management',
  'Pharmacy','Finance','Arts','Sports','Environment',
]

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  Engineering: ['iit','nit','iiit','bits','vit','srm','thapar','kiit','rvce','bmsce','lpu','chandigarh','amrita','manipal','psg','bit-mesra','ict-mumbai','daiict'],
  Medical: ['aiims','jipmer','cmc','afmc','mamc','mmc','gmc','kgmu','kmc','amrita-medical','stjohns','bhu-ims','pgimer','srmc','nimhans'],
  Management: ['iim','xlri','spjimr','nmims','mdi','imt','great-lakes','sibm','fore','lbsim'],
  Law: ['nlsiu','nalsar','nlu','nujs','gnlu','rgnul','nluo','cnlu','tnnlu','hnlu','mnlu','jgls','sls','amity-law','du-law','ils-law','glc-mumbai','bhu-law','amu-law'],
  'Civil Services': ['lbsnaa','jnu','du-humanities','hyderabad-university','tiss','iipa','sppu-polsci','patna-university','bhu-arts','amu-social','panjab','osmania','magadh','lucknow-university','ignou','jmi','ddu','gauhati','ranchi-university'],
  Research: ['iisc','tifr','isi','iiser','jncasr','sinp','ncbs','imsc','csir','nias','barc'],
  Design: ['nid','nift','spa','cept','jjcoa','srishti','mit-design','pearl','sid-pune'],
  Agriculture: ['iari','pau','tnau','gbpuat','angrau','kau','ccshau','aau','ouat','rajuvas','ivri','mafsu'],
  Defence: ['nda','ima','afa','ina','rimc','ota','diat','cme','mceme'],
  Journalism: ['iimc','acj','simc','xic','mic-manipal','ajkmcrc','hyd-communication','ftii','srfti'],
  'Hotel Management': ['ihm','wgsha','ocld'],
  Pharmacy: ['jss-pharmacy','mcphs','bcp','amrita-pharmacy','srips','niper'],
  Finance: ['srcc','lsr','hindu-college','loyola','st-xaviers','presidency-college','icai','icmai','icsi','nism','ibps','nibm','iibf','mse','dse','igidr'],
  Arts: ['nsd','sna','msu-finearts','gcfa','rbu','iksv','kalakshetra','university-of-delhi','jnu','bhu','calcutta','madras-university','mumbai-university'],
  Sports: ['lnipe','sai','nsnis','tnpesu','amity-sports'],
  Environment: ['ifri','wii','iifm','nih-roorkee','cee','wihg','ncpor','iirs'],
}

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([])
  const [filtered, setFiltered] = useState<College[]>([])
  const [scholarshipCounts, setScholarshipCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedState, setSelectedState] = useState('All States')
  const [selectedType, setSelectedType] = useState('All Types')
  const [selectedDomain, setSelectedDomain] = useState('All Domains')
  const [sortBy, setSortBy] = useState('nirf')
  const [showFilters, setShowFilters] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    async function fetchColleges() {
      const [collegesRes, scholarshipCountsRes] = await Promise.all([
        supabase
          .from('colleges')
          .select('*')
          .order('nirf_rank', { ascending: true, nullsFirst: false }),
        supabase
          .from('college_scholarship_counts')
          .select('college_id, scholarship_count'),
      ])

      if (!collegesRes.error) {
        setColleges(collegesRes.data || [])
        setFiltered(collegesRes.data || [])
      }

      if (!scholarshipCountsRes.error) {
        const counts: Record<string, number> = {}
        for (const row of scholarshipCountsRes.data || []) {
          counts[row.college_id] = row.scholarship_count
        }
        setScholarshipCounts(counts)
      }

      setLoading(false)
    }
    fetchColleges()
  }, [])

  useEffect(() => {
    let result = [...colleges]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q)
      )
    }
    if (selectedState !== 'All States') result = result.filter(c => c.state === selectedState)
    if (selectedType !== 'All Types') result = result.filter(c => c.type === selectedType)
    if (featuredOnly) result = result.filter(c => c.is_featured)

    if (selectedDomain !== 'All Domains') {
      const keywords = DOMAIN_KEYWORDS[selectedDomain] || []
      result = result.filter(c => keywords.some(k => c.slug.includes(k)))
    }

    result.sort((a, b) => {
      if (sortBy === 'nirf') {
        if (a.nirf_rank === null) return 1
        if (b.nirf_rank === null) return -1
        return a.nirf_rank - b.nirf_rank
      }
      if (sortBy === 'qs') {
        if (a.qs_rank === null) return 1
        if (b.qs_rank === null) return -1
        return a.qs_rank - b.qs_rank
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'fees_low') return (a.annual_fees_min ?? 999999999) - (b.annual_fees_min ?? 999999999)
      if (sortBy === 'fees_high') return (b.annual_fees_max ?? 0) - (a.annual_fees_max ?? 0)
      if (sortBy === 'students') return (b.total_students ?? 0) - (a.total_students ?? 0)
      if (sortBy === 'scholarships') return (scholarshipCounts[b.id] ?? 0) - (scholarshipCounts[a.id] ?? 0)
      return 0
    })

    setFiltered(result)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedState, selectedType, selectedDomain, sortBy, featuredOnly, colleges, scholarshipCounts])

  const clearFilters = () => {
    setSearch('')
    setSelectedState('All States')
    setSelectedType('All Types')
    setSelectedDomain('All Domains')
    setSortBy('nirf')
    setFeaturedOnly(false)
  }

  const hasActiveFilters = search || selectedState !== 'All States' ||
    selectedType !== 'All Types' || selectedDomain !== 'All Domains' || featuredOnly

  const formatFees = (min: number | null, max: number | null) => {
    if (min === 0 && max === 0) return 'Free / Stipend Paid'
    if (!min && !max) return 'Fees N/A'
    const fmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
      return `₹${n}`
    }
    if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}/yr`
    if (min) return `From ${fmt(min)}/yr`
    return `Up to ${fmt(max!)}/yr`
  }

  const formatStudents = (n: number | null) => {
    if (!n) return null
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
    return `${n}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading colleges...</p>
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
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Colleges & Universities</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {colleges.length}+ institutions — Engineering, Medical, Law, Management, Design, Civil Services & more
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 ml-14">
            {[
              { label: 'Government', count: colleges.filter(c => c.type === 'Government').length, color: 'text-green-600' },
              { label: 'Private', count: colleges.filter(c => c.type === 'Private').length, color: 'text-blue-600' },
              { label: 'Deemed', count: colleges.filter(c => c.type === 'Deemed').length, color: 'text-purple-600' },
              { label: 'Featured', count: colleges.filter(c => c.is_featured).length, color: 'text-indigo-600' },
            ].map(s => (
              <div key={s.label} className="text-sm">
                <span className={`font-semibold ${s.color}`}>{s.count}</span>
                <span className="text-gray-400 ml-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search colleges, cities, states..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${hasActiveFilters ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="nirf">Sort: NIRF Rank</option>
              <option value="qs">Sort: QS Rank</option>
              <option value="name">Sort: Name A–Z</option>
              <option value="fees_low">Sort: Lowest Fees</option>
              <option value="fees_high">Sort: Highest Fees</option>
              <option value="students">Sort: Largest</option>
              <option value="scholarships">Sort: Most Scholarships</option>
            </select>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Domain</label>
                <select
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">State</label>
                <select
                  value={selectedState}
                  onChange={e => setSelectedState(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                <div className="flex gap-2">
                  {['All Types', 'Government', 'Private', 'Deemed'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${selectedType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Show</label>
                <button
                  onClick={() => setFeaturedOnly(!featuredOnly)}
                  className={`px-3 py-2 rounded-lg text-sm border flex items-center gap-2 transition-colors ${featuredOnly ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Star className="w-3.5 h-3.5" />
                  Featured only
                </button>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-700">
                  <X className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of {colleges.length} colleges
          </p>
          {selectedForCompare.size > 0 && (
            <Link
              href={`/compare/colleges?ids=${Array.from(selectedForCompare).join(',')}`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <GitCompare className="w-4 h-4" /> Compare ({selectedForCompare.size})
            </Link>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No colleges found</p>
            <button onClick={clearFilters} className="mt-4 text-indigo-600 hover:underline text-sm">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(college => (
              <div key={college.id} className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 overflow-hidden group h-full flex flex-col">
                <div className={`h-1 ${college.nirf_rank && college.nirf_rank <= 10 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : college.nirf_rank && college.nirf_rank <= 50 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`} />

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {college.logo_url && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={college.logo_url}
                            alt=""
                            className="w-7 h-7 object-contain"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[college.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {college.type}
                          </span>
                          {college.naac_grade && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NAAC_COLORS[college.naac_grade] || 'bg-gray-100 text-gray-600'}`}>
                              NAAC {college.naac_grade}
                            </span>
                          )}
                          {college.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        </div>
                        <Link href={`/colleges/${college.slug}`} className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
                          {college.name}
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newSet = new Set(selectedForCompare)
                          if (newSet.has(college.id)) {
                            newSet.delete(college.id)
                          } else if (newSet.size < 3) {
                            newSet.add(college.id)
                          }
                          setSelectedForCompare(newSet)
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          selectedForCompare.has(college.id)
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={selectedForCompare.has(college.id) ? 'Remove from comparison' : 'Add to comparison'}
                      >
                        {selectedForCompare.has(college.id) ? <Check className="w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
                      </button>
                      {college.nirf_rank ? (
                        <div className="flex-shrink-0 text-center bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5">
                          <div className="text-base font-bold text-indigo-700 leading-none">#{college.nirf_rank}</div>
                          <div className="text-xs text-indigo-400 mt-0.5">NIRF</div>
                        </div>
                      ) : college.qs_rank ? (
                        <div className="flex-shrink-0 text-center bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                          <div className="text-base font-bold text-amber-600 leading-none">#{college.qs_rank}</div>
                          <div className="text-xs text-amber-400 mt-0.5">QS</div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span>{college.city ? `${college.city}, ` : ''}{college.state}</span>
                  </div>

                  {/* Fees + Scholarships Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${college.annual_fees_min === 0 && college.annual_fees_max === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'}`}>
                        {formatFees(college.annual_fees_min, college.annual_fees_max)}
                      </span>
                    </div>
                    {scholarshipCounts[college.id] > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        <Landmark className="w-3 h-3" />
                        {scholarshipCounts[college.id]} scholarships
                      </span>
                    )}
                  </div>

                  {college.why_join && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-1">
                      {college.why_join}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
                    {college.established_year && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Est. {college.established_year}
                      </span>
                    )}
                    {college.total_students && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {formatStudents(college.total_students)} students
                      </span>
                    )}
                    {college.qs_rank && college.nirf_rank && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        QS #{college.qs_rank}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <Link href={`/colleges/${college.slug}`} className="text-xs text-indigo-600 group-hover:text-indigo-800 font-medium flex items-center gap-1">
                      View details <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
