'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Lock, Crown, Sparkles, X, Check } from 'lucide-react'
import Link from 'next/link'

interface PremiumFeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
}

export default function PremiumFeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: PremiumFeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      // Check feature access via RPC
      const { data } = await supabase
        .rpc('has_feature_access', { 
          p_user_id: user.id, 
          p_feature: feature 
        })
      
      setHasAccess(data || false)
      setLoading(false)
    }
    checkAccess()
  }, [supabase, feature])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
        <p className="text-gray-600 text-sm mb-4">
          This feature is available for Premium and Pro subscribers
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Crown className="w-4 h-4" /> Upgrade Now
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Smaller version for inline usage
export function PremiumBadge({ feature }: { feature: string }) {
  const [isPremium, setIsPremium] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkPremium() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .rpc('has_feature_access', { 
          p_user_id: user.id, 
          p_feature: feature 
        })
      
      setIsPremium(data || false)
    }
    checkPremium()
  }, [supabase, feature])

  if (!isPremium) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
        <Crown className="w-3 h-3" /> Premium
      </span>
    )
  }

  return null
}

// Usage limit indicator
export function UsageIndicator({ feature, current, usage_limit }: { feature: string; current: number; usage_limit: number }) {
  const percentage = usage_limit === -1 ? 100 : Math.min((current / usage_limit) * 100, 100)
  const isNearLimit = usage_limit !== -1 && percentage >= 80
  const isAtLimit = usage_limit !== -1 && current >= usage_limit

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">
        {usage_limit === -1 ? 'Unlimited' : `${current}/${usage_limit}`}
      </span>
    </div>
  )
}
