/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import {
  User as UserIcon, Mail, GraduationCap, BookOpen, Target,
  CheckCircle2, ArrowLeft, Save, Award, Plus, X, ChevronDown,
  MapPin, IndianRupee, Trophy, Heart, Flame,
} from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────

const EDUCATION_OPTIONS = [
  'Class 9', 'Class 10', 'Class 11', 'Class 12 (Science)',
  'Class 12 (Commerce)', 'Class 12 (Arts)', 'Diploma',
  'B.Tech / B.E.', 'B.Sc', 'B.Com', 'BBA', 'BA', 'MBBS',
  'B.Arch', 'LLB', 'M.Tech', 'MBA', 'M.Sc', 'MA', 'PhD', 'Other',
]

const STREAM_OPTIONS = [
  'Science (PCM)', 'Science (PCB)', 'Science (PCMB)',
  'Commerce', 'Arts / Humanities', 'Not Applicable',
]

const BOARD_OPTIONS = [
  'CBSE', 'ICSE / ISC', 'State Board - UP', 'State Board - Maharashtra',
  'State Board - Tamil Nadu', 'State Board - Karnataka', 'State Board - Kerala',
  'State Board - West Bengal', 'State Board - Rajasthan', 'State Board - Bihar',
  'State Board - MP', 'State Board - Gujarat', 'State Board - Andhra Pradesh',
  'State Board - Telangana', 'IB (International Baccalaureate)', 'Other',
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu & Kashmir', 'Puducherry', 'Other',
]

const BUDGET_OPTIONS = [
  { value: 'govt_only',   label: 'Government only (< ₹1L total)' },
  { value: 'upto_5l',     label: 'Up to ₹5L total'              },
  { value: 'upto_10l',    label: 'Up to ₹10L total'             },
  { value: 'upto_20l',    label: 'Up to ₹20L total'             },
  { value: 'upto_50l',    label: 'Up to ₹50L total'             },
  { value: 'no_limit',    label: 'No budget constraint'          },
]

const POPULAR_EXAMS = [
  'JEE Main', 'JEE Advanced', 'NEET UG', 'CAT', 'CLAT', 'GATE',
  'UPSC CSE', 'BITSAT', 'VITEEE', 'SRMJEEE', 'XAT', 'MAT',
  'NDA', 'CDS', 'CUET', 'NIFT Entrance', 'NID Entrance', 'AILET',
  'State PSC', 'SSC CGL', 'IBPS PO', 'RRB', 'CUET PG',
]

const POPULAR_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Geography', 'Economics', 'Political Science',
  'Accountancy', 'Business Studies', 'Psychology', 'Sociology',
  'Physical Education', 'Fine Arts', 'Music', 'Sanskrit', 'Hindi',
]

const CAREER_DOMAINS = [
  'Technology', 'Medical', 'Engineering', 'Finance', 'Law',
  'Government / Civil Services', 'Education', 'Research / Science',
  'Design / Arts', 'Media / Journalism', 'Management / Business',
  'Agriculture', 'Defence', 'Architecture', 'Sports',
]

const WORK_PREFERENCES = [
  'Work from Home / Remote', 'Field Work / Outdoor',
  'Office / Corporate', 'Government Job',
  'Own Business / Startup', 'Research / Academia',
  'International Opportunities', 'Social Impact / NGO',
]

// ── Component ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<'education' | 'subjects' | 'goals' | 'preferences'>('education')

  // Form state
  const [education, setEducation]       = useState('')
  const [stream, setStream]             = useState('')
  const [board, setBoard]               = useState('')
  const [percentage, setPercentage]     = useState('')
  const [state, setState]               = useState('')
  const [subjects, setSubjects]         = useState<string[]>([])
  const [customSubject, setCustomSubject] = useState('')
  const [targetExams, setTargetExams]   = useState<string[]>([])
  const [careerGoal, setCareerGoal]     = useState('')
  const [budgetRange, setBudgetRange]   = useState('')
  const [preferences, setPreferences]   = useState<string[]>([])
  const [workPrefs, setWorkPrefs]       = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // maybeSingle() returns null (not an error) when zero rows exist —
      // e.g. a brand new user who hasn't saved a profile yet.
      // It still surfaces a real error if something else goes wrong
      // (like duplicate rows from a broken upsert), which we now log
      // and show instead of silently leaving the form blank.
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Failed to load profile:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        setLoadError(
          error.code === 'PGRST116'
            ? 'Multiple profile records found for your account — please contact support so we can merge them.'
            : `Could not load your saved profile: ${error.message || 'Unknown error'}`
        )
      }

      if (profile) {
        setEducation(profile.class_level || '')
        setStream(profile.stream || '')
        setBoard(profile.board || '')
        setPercentage(profile.percentage?.toString() || '')
        setState(profile.state || '')
        setSubjects(profile.subjects || [])
        setTargetExams(profile.target_exams || [])
        setCareerGoal(profile.career_goal || '')
        setBudgetRange(profile.budget_range || '')
        setPreferences(profile.career_preferences || [])
        setWorkPrefs(profile.work_preferences || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setLoadError('')

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        class_level: education,
        stream,
        board,
        percentage: percentage ? parseFloat(percentage) : null,
        state,
        subjects,
        target_exams: targetExams,
        career_goal: careerGoal,
        budget_range: budgetRange,
        career_preferences: preferences,
        work_preferences: workPrefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    setSaving(false)
    if (!error) {
      setSavedMsg('Profile saved successfully!')
      setTimeout(() => setSavedMsg(''), 3000)
    } else {
      console.error('Failed to save profile:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      setLoadError(`Could not save your profile: ${error.message || 'Unknown error'}`)
    }
  }

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  const addCustomSubject = () => {
    const s = customSubject.trim()
    if (s && !subjects.includes(s)) { setSubjects(p => [...p, s]); setCustomSubject('') }
  }

  // Completion
  const sections = [
    { label: 'Basic Info',         done: true                          },
    { label: 'Education Details',  done: !!education                   },
    { label: 'Marks & Location',   done: !!board && !!state            },
    { label: 'Subjects',           done: subjects.length > 0           },
    { label: 'Target Exams',       done: targetExams.length > 0        },
    { label: 'Career Goal',        done: !!careerGoal                  },
    { label: 'Career Preferences', done: preferences.length > 0        },
    { label: 'Work Style',         done: workPrefs.length > 0          },
  ]
  const completedCount = sections.filter(s => s.done).length
  const completionPct  = Math.round((completedCount / sections.length) * 100)

  const TABS = [
    { id: 'education',   label: 'Education',   icon: GraduationCap },
    { id: 'subjects',    label: 'Subjects',    icon: BookOpen      },
    { id: 'goals',       label: 'Goals',       icon: Target        },
    { id: 'preferences', label: 'Preferences', icon: Heart         },
  ] as const

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const fullName  = (user?.user_metadata?.full_name as string) || user?.email || ''
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const firstName = fullName.split(' ')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {savedMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {savedMsg}
          </div>
        )}

        {loadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── LEFT SIDEBAR ── */}
          <div className="space-y-5">

            {/* Avatar card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-indigo-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl font-bold">{firstName.charAt(0)}</span>
                </div>
              )}
              <h2 className="text-sm font-bold text-gray-900 truncate">{fullName}</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Google Connected
              </div>
              {careerGoal && (
                <div className="mt-3 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700 text-left">
                  🎯 Goal: <span className="font-medium">{careerGoal}</span>
                </div>
              )}
            </div>

            {/* Completion */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" /> Completion
              </h3>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-gray-500">{completedCount}/{sections.length} done</span>
                <span className="text-xs font-bold text-indigo-600">{completionPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="space-y-1.5">
                {sections.map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${s.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {s.done ? '✓' : ''}
                    </div>
                    <span className={`text-xs ${s.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Info</h3>
              <div className="space-y-2 text-xs">
                {education && <div className="flex gap-2"><GraduationCap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{education}</span></div>}
                {stream    && <div className="flex gap-2"><BookOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{stream}</span></div>}
                {state     && <div className="flex gap-2"><MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{state}</span></div>}
                {percentage && <div className="flex gap-2"><Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{percentage}%</span></div>}
                {budgetRange && <div className="flex gap-2"><IndianRupee className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{BUDGET_OPTIONS.find(b => b.value === budgetRange)?.label}</span></div>}
                {subjects.length > 0 && <div className="flex gap-2"><BookOpen className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{subjects.length} subjects</span></div>}
                {targetExams.length > 0 && <div className="flex gap-2"><Target className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{targetExams.length} target exams</span></div>}
              </div>
            </div>
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-indigo-500" /> Basic Information
                </h3>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="text-sm font-medium text-gray-800">{fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === id
                        ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">

                {/* ── EDUCATION TAB ── */}
                {activeTab === 'education' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-orange-500" /> Education Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Current Education Level *</label>
                        <div className="relative">
                          <select value={education} onChange={e => setEducation(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none">
                            <option value="">Select level...</option>
                            {EDUCATION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Stream / Branch</label>
                        <div className="relative">
                          <select value={stream} onChange={e => setStream(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none">
                            <option value="">Select stream...</option>
                            {STREAM_OPTIONS.map(o => <option key={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Board *</label>
                        <div className="relative">
                          <select value={board} onChange={e => setBoard(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none">
                            <option value="">Select board...</option>
                            {BOARD_OPTIONS.map(o => <option key={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Marks / CGPA (%)</label>
                        <input
                          type="number" min="0" max="100" step="0.1"
                          placeholder="e.g. 85.5"
                          value={percentage}
                          onChange={e => setPercentage(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Home State *</label>
                        <div className="relative">
                          <select value={state} onChange={e => setState(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none">
                            <option value="">Select state...</option>
                            {INDIAN_STATES.map(o => <option key={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Education Budget</label>
                        <div className="relative">
                          <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none">
                            <option value="">Select budget...</option>
                            {BUDGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUBJECTS TAB ── */}
                {activeTab === 'subjects' && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" /> My Subjects
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Add subjects you are studying — this helps us match you with the right careers and exams</p>

                    {/* Selected */}
                    {subjects.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Selected ({subjects.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {subjects.map(s => (
                            <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100 font-medium">
                              {s}
                              <button onClick={() => toggle(subjects, setSubjects, s)} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular */}
                    <p className="text-xs text-gray-400 mb-2">Popular subjects — click to add:</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {POPULAR_SUBJECTS.filter(s => !subjects.includes(s)).map(s => (
                        <button key={s} onClick={() => toggle(subjects, setSubjects, s)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                          <Plus className="w-3 h-3" /> {s}
                        </button>
                      ))}
                    </div>

                    {/* Custom */}
                    <div className="flex gap-2">
                      <input type="text" placeholder="Add custom subject..."
                        value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={addCustomSubject}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Target Exams */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-orange-500" /> Target Exams
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">Which exams are you preparing for?</p>

                      {targetExams.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {targetExams.map(e => (
                            <span key={e} className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-100 font-medium">
                              {e}
                              <button onClick={() => toggle(targetExams, setTargetExams, e)} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {POPULAR_EXAMS.filter(e => !targetExams.includes(e)).map(e => (
                          <button key={e} onClick={() => toggle(targetExams, setTargetExams, e)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors">
                            <Plus className="w-3 h-3" /> {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── GOALS TAB ── */}
                {activeTab === 'goals' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-500" /> Career Goal
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">What do you want to become? Be specific!</p>
                      <input
                        type="text"
                        placeholder="e.g. IAS Officer, Software Engineer at Google, Cardiologist, CA..."
                        value={careerGoal}
                        onChange={e => setCareerGoal(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {careerGoal && (
                        <div className="mt-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                          🎯 Your goal: <strong>{careerGoal}</strong>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-green-500" /> Education Budget
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">How much can you spend on your education in total?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {BUDGET_OPTIONS.map(o => (
                          <button key={o.value} onClick={() => setBudgetRange(o.value)}
                            className={`p-3 rounded-lg text-sm border text-left transition-all ${
                              budgetRange === o.value
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700'
                            }`}>
                            {budgetRange === o.value && '✓ '}{o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PREFERENCES TAB ── */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" /> Career Domain Interests
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">Select domains you are interested in (select all that apply)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CAREER_DOMAINS.map(domain => (
                          <button key={domain} onClick={() => toggle(preferences, setPreferences, domain)}
                            className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                              preferences.includes(domain)
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                            }`}>
                            {preferences.includes(domain) ? '✓ ' : ''}{domain}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" /> Work Style Preferences
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">What kind of work environment do you prefer?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {WORK_PREFERENCES.map(pref => (
                          <button key={pref} onClick={() => toggle(workPrefs, setWorkPrefs, pref)}
                            className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                              workPrefs.includes(pref)
                                ? 'bg-pink-500 text-white border-pink-500'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-pink-50 hover:border-pink-200'
                            }`}>
                            {workPrefs.includes(pref) ? '✓ ' : ''}{pref}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save + Recommend */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <Link href="/recommend"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Get Career Recommendations →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
