'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Settings, Bell, Calendar, Clock, Save, X, Check, AlertCircle } from 'lucide-react'

export default function ExamPreferencesPage({ params }: { params: Promise<{ examId: string }> }) {
  const [examId, setExamId] = useState<string>('')
  const [preferences, setPreferences] = useState({
    notifyRegistrationStart: true,
    notifyRegistrationEnd: true,
    notifyAdmitCard: true,
    notifyExamDate: true,
    notifyAnswerKey: true,
    notifyResult: true,
    notifyDateChanges: true,
    notifyGeneralUpdates: true,
    countdownReminders: true,
    countdownDays: [60, 30, 15, 7, 3, 1, 0],
    isTrackingEnabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const resolvedParams = await params
      setExamId(resolvedParams.examId)
    }
    init()
  }, [params])

  useEffect(() => {
    async function loadPreferences() {
      if (!examId) return
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      setHasSubscription(subscription?.status === 'active')

      if (!hasSubscription) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/exams/preferences?examId=${examId}`)
      const data = await response.json()
      
      if (data.preferences && data.preferences.length > 0) {
        const pref = data.preferences[0]
        setPreferences({
          notifyRegistrationStart: pref.notify_registration_start,
          notifyRegistrationEnd: pref.notify_registration_end,
          notifyAdmitCard: pref.notify_admit_card,
          notifyExamDate: pref.notify_exam_date,
          notifyAnswerKey: pref.notify_answer_key,
          notifyResult: pref.notify_result,
          notifyDateChanges: pref.notify_date_changes,
          notifyGeneralUpdates: pref.notify_general_updates,
          countdownReminders: pref.countdown_reminders,
          countdownDays: pref.countdown_days || [60, 30, 15, 7, 3, 1, 0],
          isTrackingEnabled: pref.is_tracking_enabled,
        })
      }
      
      setLoading(false)
    }
    loadPreferences()
  }, [examId, supabase, router, hasSubscription])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/exams/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: examId,
          ...preferences,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.requiresSubscription) {
          router.push('/pricing')
          return
        }
        throw new Error(data.error || 'Failed to save preferences')
      }

      alert('Preferences saved successfully!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    }
    setSaving(false)
  }

  const toggleCountdownDay = (day: number) => {
    if (preferences.countdownDays.includes(day)) {
      setPreferences({
        ...preferences,
        countdownDays: preferences.countdownDays.filter(d => d !== day),
      })
    } else {
      setPreferences({
        ...preferences,
        countdownDays: [...preferences.countdownDays, day].sort((a, b) => b - a),
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading preferences...</div>
      </div>
    )
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Required</h2>
          <p className="text-gray-600 mb-6">
            Notification preferences are available only to subscribers.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            View Plans
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-2 inline-flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Notification Preferences
            </h1>
            <p className="text-gray-600 mt-1">
              Customize how you receive notifications for this exam
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Tracking */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Enable Tracking</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Turn on to receive notifications and track this exam
                </p>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, isTrackingEnabled: !preferences.isTrackingEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.isTrackingEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    preferences.isTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notification Types */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Types
            </h3>
            <div className="space-y-4">
              {[
                { key: 'notifyRegistrationStart', label: 'Registration Opening', icon: Calendar },
                { key: 'notifyRegistrationEnd', label: 'Registration Closing', icon: Calendar },
                { key: 'notifyAdmitCard', label: 'Admit Card Release', icon: Calendar },
                { key: 'notifyExamDate', label: 'Exam Date', icon: Clock },
                { key: 'notifyAnswerKey', label: 'Answer Key Release', icon: Calendar },
                { key: 'notifyResult', label: 'Result Declaration', icon: Calendar },
                { key: 'notifyDateChanges', label: 'Date Changes', icon: AlertCircle },
                { key: 'notifyGeneralUpdates', label: 'General Updates', icon: Bell },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <button
                    onClick={() => setPreferences({ ...preferences, [item.key]: !preferences[item.key as keyof typeof preferences] })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences[item.key as keyof typeof preferences] ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        preferences[item.key as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Countdown Reminders */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Countdown Reminders
              </h3>
              <button
                onClick={() => setPreferences({ ...preferences, countdownReminders: !preferences.countdownReminders })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.countdownReminders ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    preferences.countdownReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Get notified when the exam is X days away
            </p>
            <div className="flex flex-wrap gap-2">
              {[60, 30, 15, 7, 3, 1, 0].map((day) => (
                <button
                  key={day}
                  onClick={() => toggleCountdownDay(day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.countdownDays.includes(day)
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {day === 0 ? 'Exam Day' : `${day} days`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
