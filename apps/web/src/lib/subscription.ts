import { createClient } from '@/lib/supabase'

export interface Subscription {
  plan_id: string
  status: string
  features: Record<string, any>
}

export interface UsageStats {
  current_usage: number
  usage_limit: number
  plan_id: string
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient()
  
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  if (!subscription) {
    // Return free plan as default
    return {
      plan_id: 'free',
      status: 'active',
      features: {}
    }
  }

  // Get plan features
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('features')
    .eq('id', subscription.plan_id)
    .single()
  
  return {
    plan_id: subscription.plan_id,
    status: subscription.status,
    features: plan?.features || {}
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data } = await supabase
    .rpc('has_feature_access', { 
      p_user_id: userId, 
      p_feature: feature 
    })
  
  return data || false
}

/**
 * Get usage statistics for a feature
 */
export async function getUsageStats(userId: string, feature: string): Promise<UsageStats | null> {
  const supabase = createClient()
  
  const { data } = await supabase
    .rpc('get_usage', { 
      p_user_id: userId, 
      p_feature_type: feature 
    })
  
  return data as UsageStats || null
}

/**
 * Increment usage counter
 */
export async function incrementUsage(userId: string, feature: string): Promise<number> {
  const supabase = createClient()
  
  const { data } = await supabase
    .rpc('increment_usage', { 
      p_user_id: userId, 
      p_feature_type: feature 
    })
  
  return data || 0
}

/**
 * Check if user can use a feature (not at limit)
 */
export async function canUseFeature(userId: string, feature: string): Promise<{ canUse: boolean; remaining: number }> {
  const supabase = createClient()
  
  const result = await incrementUsage(userId, feature)
  
  if (result === -1) {
    // Unlimited access
    return { canUse: true, remaining: -1 }
  }
  
  // If result equals the limit, user has reached the limit
  const subscription = await getUserSubscription(userId)
  const usage_limit = subscription?.features[feature] as number || 0
  
  return {
    canUse: result <= usage_limit,
    remaining: Math.max(0, usage_limit - result)
  }
}

/**
 * Get plan tier for UI display
 */
export function getPlanTier(planId: string): 'free' | 'premium' | 'pro' {
  if (planId === 'premium') return 'premium'
  if (planId === 'pro') return 'pro'
  return 'free'
}

/**
 * Check if user is on premium or higher
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  return subscription?.plan_id !== 'free'
}

/**
 * Create free subscription for new user
 */
export async function createFreeSubscription(userId: string): Promise<void> {
  const supabase = createClient()
  
  await supabase.rpc('create_free_subscription', { p_user_id: userId })
}
