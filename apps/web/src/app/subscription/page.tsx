'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { CreditCard, Calendar, CheckCircle2, XCircle, ArrowRight, Crown, Sparkles, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  id: string
  plan_id: string
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
}

interface Plan {
  id: string
  name: string
  features: Record<string, any>
}

interface Usage {
  feature_type: string
  current_usage: number
  usage_limit: number
  plan_id: string
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [usage, setUsage] = useState<Usage[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      // Load subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setSubscription(subData)

      if (subData) {
        // Load plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', subData.plan_id)
          .single()
        
        setPlan(planData)

        // Load usage stats
        const { data: usageData } = await supabase
          .rpc('get_usage', { p_user_id: user.id, p_feature_type: 'ai_chat_messages' })
        
        // Get usage for multiple features
        const features = ['ai_chat_messages', 'recommendations', 'save_items']
        const usageResults: Usage[] = []
        
        for (const feature of features) {
          const { data } = await supabase
            .rpc('get_usage', { p_user_id: user.id, p_feature_type: feature })
          
          if (data) {
            usageResults.push(data as Usage)
          }
        }
        
        setUsage(usageResults)
      }

      setLoading(false)
    }
    loadData()
  }, [supabase])

  const handleCancelSubscription = async () => {
    if (!subscription || !confirm('Are you sure you want to cancel your subscription?')) return

    setCancelling(true)
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('id', subscription.id)

    setCancelling(false)
    if (!error) {
      setSubscription({ ...subscription, cancel_at_period_end: true })
      alert('Subscription will be cancelled at the end of your billing period')
    } else {
      alert('Failed to cancel subscription')
    }
  }

  const handleReactivateSubscription = async () => {
    if (!subscription) return

    const { error } = await supabase
      .from('user_subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('id', subscription.id)

    if (!error) {
      setSubscription({ ...subscription, cancel_at_period_end: false })
      alert('Subscription reactivated successfully')
    } else {
      alert('Failed to reactivate subscription')
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return Sparkles
      case 'premium': return Crown
      case 'pro': return Star
      default: return Sparkles
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'text-gray-600 bg-gray-100'
      case 'premium': return 'text-indigo-600 bg-indigo-100'
      case 'pro': return 'text-amber-600 bg-amber-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getFeatureName = (feature: string) => {
    return feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const PlanIcon = plan ? getPlanIcon(plan.id) : Sparkles
  const planColor = plan ? getPlanColor(plan.id) : 'text-gray-600 bg-gray-100'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600 mb-8">Manage your subscription and view usage statistics</p>

        {/* Current Plan Card */}
        {subscription && plan && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${planColor}`}>
                  <PlanIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{plan.name} Plan</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {subscription.status === 'active' ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" /> {subscription.status}
                      </span>
                    )}
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-sm capitalize">{subscription.billing_cycle}</span>
                  </div>
                </div>
              </div>
              {plan.id !== 'free' && (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Change Plan <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Current Period</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Billing Cycle</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{subscription.billing_cycle}</p>
                </div>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 text-sm">
                  Your subscription will be cancelled on {formatDate(subscription.current_period_end)}. 
                  You can reactivate it anytime before then.
                </p>
                <button
                  onClick={handleReactivateSubscription}
                  className="mt-2 text-amber-700 text-sm font-medium hover:underline"
                >
                  Reactivate Subscription
                </button>
              </div>
            )}

            {plan.id !== 'free' && !subscription.cancel_at_period_end && (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="text-red-600 text-sm hover:underline disabled:opacity-50"
              >
                {cancelling ? 'Processing...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        )}

        {/* Usage Statistics */}
        {plan && plan.id !== 'free' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
            <div className="space-y-4">
              {usage.map((usageItem) => (
                <div key={usageItem.feature_type}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">{getFeatureName(usageItem.feature_type)}</span>
                    <span className="text-sm text-gray-500">
                      {usageItem.usage_limit === -1 ? 'Unlimited' : `${usageItem.current_usage}/${usageItem.usage_limit}`}
                    </span>
                  </div>
                  {usageItem.usage_limit !== -1 && (
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((usageItem.current_usage / usageItem.usage_limit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Features */}
        {plan && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(plan.features).map(([key, value]) => {
                const isIncluded = value !== false && value !== 'false'
                return (
                  <div key={key} className="flex items-center gap-2">
                    {isIncluded ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                    <span className="text-sm text-gray-700">
                      {getFeatureName(key)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Upgrade CTA for Free Users */}
        {plan && plan.id === 'free' && (
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Upgrade to Premium</h3>
                <p className="text-gray-600 text-sm">Get unlimited access to all features</p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View Plans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
