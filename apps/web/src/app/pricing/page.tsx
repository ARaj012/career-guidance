'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Check, X, Sparkles, Crown, Zap, Star, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  currency: string
  features: Record<string, any>
  display_order: number
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // Load subscription plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      
      setPlans(plansData || [])

      // Load user data
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Load user's current subscription
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('plan_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (subError && subError.code !== 'PGRST116') {
          console.error('Subscription load error:', subError)
        } else if (subError && subError.code === 'PGRST116') {
          // No subscription found - this is expected for new users
          console.log('No existing subscription found for user')
        }

        setCurrentPlan(subData?.plan_id || 'free')
      }

      setLoading(false)
    }
    loadData()
  }, [supabase])

  const getIcon = (planId: string) => {
    switch (planId) {
      case 'free': return Sparkles
      case 'premium': return Crown
      case 'pro': return Star
      default: return Sparkles
    }
  }

  const getIconColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'text-gray-600 bg-gray-100'
      case 'premium': return 'text-indigo-600 bg-indigo-100'
      case 'pro': return 'text-amber-600 bg-amber-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getButtonColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      case 'premium': return 'bg-indigo-600 text-white hover:bg-indigo-700'
      case 'pro': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
      default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `₹${price}`
  }

  const formatFeatureValue = (value: any) => {
    if (value === true || value === 'true') return 'Included'
    if (value === false || value === 'false') return 'Not included'
    if (value === 'unlimited') return 'Unlimited'
    if (typeof value === 'number') return value.toString()
    return value
  }

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    if (planId === 'free') {
      // Downgrade to free
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: 'free',
          status: 'active',
          cancel_at_period_end: true
        })
        .eq('user_id', user.id)

      if (!error) {
        setCurrentPlan('free')
        alert('Successfully downgraded to Free plan')
      }
      return
    }

    // Create payment order
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert('Failed to create payment order. Please try again.')
        return
      }

      // Check if using mock mode
      if (data.keyId === 'rzp_mock_test_key') {
        // Mock mode - simulate payment flow
        console.log('🧪 MOCK MODE: Simulating payment flow')

        // Simulate payment confirmation
        const confirmed = confirm(
          `🧪 MOCK PAYMENT MODE\n\n` +
          `You are about to subscribe to ${plans.find(p => p.id === planId)?.name} Plan (${billingCycle})\n` +
          `Amount: ₹${data.amount / 100}\n\n` +
          `This is a test - no real payment will be processed.\n\n` +
          `Click OK to simulate successful payment.`
        )

        if (confirmed) {
          // Simulate payment verification with plan info
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: data.orderId,
              razorpayPaymentId: `pay_mock_${Date.now()}`,
              razorpaySignature: 'mock_signature',
              planId: planId, // Pass planId directly
              billingCycle: billingCycle // Pass billingCycle directly
            }),
          })

          const verifyData = await verifyRes.json()

          if (verifyData.success) {
            setCurrentPlan(planId)
            alert('✅ Mock payment successful! Your subscription is now active.')
            window.location.href = '/subscription'
          } else {
            alert('❌ Mock payment verification failed. Please check console for details.')
          }
        }
        return
      }

      // Real Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'CareerGuide',
        description: `${plans.find(p => p.id === planId)?.name} Plan - ${billingCycle}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          // Verify payment on server
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: data.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          })

          const verifyData = await verifyRes.json()

          if (verifyData.success) {
            setCurrentPlan(planId)
            alert('Payment successful! Your subscription is now active.')
            window.location.href = '/subscription'
          } else {
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: function() {
            console.log('Checkout form closed')
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment processing failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-indigo-600 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600">Unlock your full potential with our career guidance platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full p-1 border border-gray-200 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'yearly' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-1">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = getIcon(plan.id)
            const iconColor = getIconColor(plan.id)
            const buttonColor = getButtonColor(plan.id)
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
            const isCurrentPlan = currentPlan === plan.id

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 p-8 relative ${
                  plan.id === 'premium' ? 'border-indigo-500 shadow-xl' : 'border-gray-200'
                }`}
              >
                {plan.id === 'premium' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{formatPrice(price)}</span>
                  {price > 0 && <span className="text-gray-500">/{billingCycle}</span>}
                </div>

                <div className="space-y-3 mb-8">
                  {Object.entries(plan.features).map(([key, value]) => {
                    const featureName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    const featureValue = formatFeatureValue(value)
                    const isIncluded = value !== false && value !== 'false'

                    return (
                      <div key={key} className="flex items-start gap-3">
                        {isIncluded ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm text-gray-700">{featureName}</p>
                          {typeof value === 'number' && value > 0 && (
                            <p className="text-xs text-gray-500">{featureValue} per month</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    isCurrentPlan 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : buttonColor
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Switch to Free' : 'Upgrade Now'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-3 px-4 text-sm font-semibold text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  'career_browsing',
                  'college_info', 
                  'exam_info',
                  'ai_chat_messages',
                  'recommendations',
                  'scholarships',
                  'roadmaps',
                  'career_comparison',
                  'college_comparison',
                  'save_items',
                  'priority_support',
                  'career_assessment',
                  'mentorship',
                  'advanced_analytics'
                ].map(feature => (
                  <tr key={feature} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </td>
                    {plans.map(plan => {
                      const value = plan.features[feature]
                      const isIncluded = value !== false && value !== 'false'
                      return (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {isIncluded ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Can I change my plan later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, debit cards, UPI, and net banking through Razorpay."
              },
              {
                q: "Is there a free trial?",
                a: "Our Free plan is always available with basic features. Premium plans have a 7-day money-back guarantee."
              },
              {
                q: "Can I cancel my subscription?",
                a: "Yes, you can cancel anytime. Your access continues until the end of your billing period."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
