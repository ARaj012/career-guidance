'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'


interface Subject {
  id: string
  name: string
  stream: string
}

interface SubjectInput {
  subject_id: string
  name: string
  score: number
  interest: number
}

interface CareerResult {
  id: string
  title: string
  slug: string
  category: string
  avg_salary_min: number
  avg_salary_max: number
  growth_level: string
  demand_score: number
  is_trending: boolean
  description: string
  match_score: number
  matched_subjects: number
}

export default function RecommendPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedStream, setSelectedStream] = useState('Science')
  const [subjectInputs, setSubjectInputs] = useState<SubjectInput[]>([])
  const [results, setResults] = useState<CareerResult[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1=stream, 2=subjects, 3=results

  const supabase = createClient()

  // Fetch subjects when stream changes
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .or(`stream.eq.${selectedStream},stream.eq.All`)

      if (data) {
        setSubjects(data)
        setSubjectInputs(
          data.map(s => ({
            subject_id: s.id,
            name: s.name,
            score: 75,
            interest: 3
          }))
        )
      }
    }
    fetchSubjects()
  }, [selectedStream])

  const updateSubjectScore = (id: string, score: number) => {
    setSubjectInputs(prev =>
      prev.map(s => s.subject_id === id ? { ...s, score } : s)
    )
  }

  const updateSubjectInterest = (id: string, interest: number) => {
    setSubjectInputs(prev =>
      prev.map(s => s.subject_id === id ? { ...s, interest } : s)
    )
  }

  const getRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: subjectInputs })
      })
      const data = await response.json()
      setResults(data.recommendations || [])
      setStep(3)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-2xl font-bold text-indigo-600">CareerGuide</a>
        <a href="/dashboard" className="text-gray-600 hover:text-indigo-600 text-sm">
          Back to Dashboard
        </a>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Find Your Perfect Career
          </h1>
          <p className="text-gray-500 text-lg">
            Tell us about your subjects and interests — we will match you with the best careers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { num: 1, label: 'Choose Stream' },
            { num: 2, label: 'Rate Subjects' },
            { num: 3, label: 'View Results' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s.num ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-sm font-medium ${
                  step >= s.num ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className={`w-16 h-0.5 ${step > s.num ? 'bg-indigo-600' : 'bg-gray-200'}`}/>}
            </div>
          ))}
        </div>

        {/* STEP 1: Choose Stream */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What stream are you in?
            </h2>
            <p className="text-gray-500 mb-8">
              This helps us show you the most relevant subjects
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Science', icon: '🔬', desc: 'Physics, Chemistry, Biology, Maths' },
                { name: 'Commerce', icon: '📊', desc: 'Accountancy, Economics, Business Studies' },
                { name: 'Arts', icon: '🎨', desc: 'History, Geography, Political Science' },
              ].map((stream) => (
                <button
                  key={stream.name}
                  onClick={() => setSelectedStream(stream.name)}
                  className={`p-6 rounded-2xl border-2 text-left transition ${
                    selectedStream === stream.name
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-4xl mb-3">{stream.icon}</div>
                  <h3 className="font-bold text-gray-900 text-lg">{stream.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{stream.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition"
            >
              Continue with {selectedStream} →
            </button>
          </div>
        )}

        {/* STEP 2: Rate Subjects */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Rate your subjects
            </h2>
            <p className="text-gray-500 mb-8">
              Enter your marks (0-100) and interest level (1-5) for each subject
            </p>

            <div className="space-y-6">
              {subjectInputs.map((subject) => (
                <div key={subject.subject_id} className="border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">{subject.name}</h3>
                    <span className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1 rounded-full">
                      {selectedStream}
                    </span>
                  </div>

                  {/* Score Slider */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-500">Your Score / Marks</label>
                      <span className="text-indigo-600 font-bold text-lg">{subject.score}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={subject.score}
                      onChange={(e) => updateSubjectScore(subject.subject_id, Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Interest Rating */}
                  <div>
                    <label className="text-sm text-gray-500 mb-2 block">
                      Interest Level
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => updateSubjectInterest(subject.subject_id, level)}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                            subject.interest >= level
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {level === 1 ? '😐' : level === 2 ? '🙂' : level === 3 ? '😊' : level === 4 ? '😃' : '🤩'}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={getRecommendations}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Finding Careers...' : 'Get My Career Matches →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Top Career Matches
              </h2>
              <p className="text-gray-500 mt-1">
                Based on your {selectedStream} subjects and interest levels
              </p>
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                <p className="text-gray-500 text-lg">
                  No matches found. Try adjusting your scores.
                </p>
                <button onClick={() => setStep(2)}
                  className="mt-4 text-indigo-600 font-semibold hover:underline">
                  Go back and adjust
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((career, index) => (
                  <Link key={career.id} href={`/careers/${career.slug}`}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-yellow-100 text-yellow-600' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{career.title}</h3>
                          <p className="text-gray-500 text-sm">{career.description}</p>
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="text-right ml-4">
                        <div className={`text-3xl font-extrabold ${
                          career.match_score >= 70 ? 'text-green-600' :
                          career.match_score >= 50 ? 'text-yellow-600' :
                          'text-red-500'
                        }`}>
                          {career.match_score}%
                        </div>
                        <div className="text-xs text-gray-400">Match Score</div>
                      </div>
                    </div>

                    {/* Match Score Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            career.match_score >= 70 ? 'bg-green-500' :
                            career.match_score >= 50 ? 'bg-yellow-500' :
                            'bg-red-400'
                          }`}
                          style={{ width: `${career.match_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Career Details */}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="bg-indigo-50 text-indigo-600 text-xs px-3 py-1 rounded-full font-medium">
                        {career.category}
                      </span>
                      <span className="bg-green-50 text-green-600 text-xs px-3 py-1 rounded-full font-medium">
                        Rs.{(career.avg_salary_min/100000).toFixed(0)}L - Rs.{(career.avg_salary_max/100000).toFixed(0)}L/yr
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        career.growth_level === 'Very High' ? 'bg-green-100 text-green-700' :
                        career.growth_level === 'High' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {career.growth_level} Growth
                      </span>
                      {career.is_trending && (
                        <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full font-medium">
                          Trending
                        </span>
                      )}
                      <span className="bg-purple-50 text-purple-600 text-xs px-3 py-1 rounded-full font-medium">
                        Demand: {career.demand_score}/10
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Try Again */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => { setStep(1); setResults([]) }}
                className="flex-1 border-2 border-indigo-200 text-indigo-600 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition"
              >
                Try Again with Different Subjects
              </button>
              <a href="/dashboard"
                className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold text-center hover:bg-indigo-700 transition">
                Save and Go to Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}