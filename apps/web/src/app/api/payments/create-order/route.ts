import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// @ts-ignore - Razorpay types are not perfect
const Razorpay = require('razorpay')

export const runtime = 'nodejs'

let razorpay: any = null

// Initialize Razorpay only if keys are available
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

// Mock mode flag - set to true for testing without real Razorpay
const MOCK_MODE = !razorpay

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, billingCycle } = body

    // Mock mode for testing without real Razorpay
    if (MOCK_MODE) {
      console.log('🧪 MOCK MODE: Creating order for plan:', planId, 'billing:', billingCycle)

      // Mock plan details - matching database plan IDs
      const plans: Record<string, any> = {
        free: { amount: 0, name: 'Free Plan' },
        basic: { amount: 29900, name: 'Basic Plan' },
        premium: { amount: 59900, name: 'Premium Plan' },
        pro: { amount: 99900, name: 'Pro Plan' },
        enterprise: { amount: 249900, name: 'Enterprise Plan' }
      }

      const plan = plans[planId] || plans.premium
      const mockOrderId = `order_mock_${Date.now()}`

      // Store mock order in database
      const supabase = createClient()
      const authHeader = req.headers.get('authorization')
      let user = null

      // Try to get user from auth header or cookie
      if (authHeader) {
        const { data: { user: authUser } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        user = authUser
      } else {
        // Try to get user from session cookie
        const { data: { user: sessionUser } } = await supabase.auth.getUser()
        user = sessionUser
      }

      // For mock mode, allow payment even without perfect auth for testing
      if (!user) {
        console.log('🧪 MOCK MODE: No user authenticated, but allowing for testing')
        // Create a valid mock UUID for testing (only in development)
        if (process.env.NODE_ENV === 'development') {
          user = { id: '00000000-0000-0000-0000-000000000000' }
        } else {
          // In production, require authentication even for mock mode
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }
      }

      // Try to store mock order in database (but don't fail if it doesn't work)
      let orderStored = false
      try {
        const { error: orderError } = await supabase
          .from('payment_history')
          .insert({
            user_id: user.id,
            razorpay_order_id: mockOrderId,
            amount: plan.amount / 100, // Convert to rupees
            currency: 'INR',
            status: 'pending',
            payment_method: 'mock',
            metadata: {
              plan_id: planId,
              billing_cycle: billingCycle
            }
          })

        if (orderError) {
          console.error('Mock order creation error:', orderError)
          console.log('Continuing with mock payment despite database error')
        } else {
          console.log('Mock order created successfully in database')
          orderStored = true
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError)
        console.log('Continuing with mock payment despite database failure')
      }

      return NextResponse.json({
        orderId: mockOrderId,
        amount: plan.amount,
        currency: 'INR',
        keyId: 'rzp_mock_test_key',
        notes: {
          planId: planId,
          billingCycle: billingCycle
        }
      })
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.' },
        { status: 500 }
      )
    }

    // Get plan details
    const supabase = createClient()
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate amount based on billing cycle
    const amount = billingCycle === 'yearly' 
      ? plan.price_yearly * 100 // Razorpay expects amount in paise
      : plan.price_monthly * 100

    // Create Razorpay order
    const options = {
      amount: amount,
      currency: plan.currency,
      receipt: `sub_${user.id}_${planId}_${Date.now()}`,
      notes: {
        userId: user.id,
        planId: planId,
        billingCycle: billingCycle,
        userEmail: user.email,
      },
    }

    // @ts-ignore - Razorpay types have strict requirements
    const order = await razorpay.orders.create(options as any)

    // Store order details in payment_history
    await supabase.from('payment_history').insert({
      user_id: user.id,
      amount: amount / 100, // Convert back to rupees
      currency: plan.currency,
      status: 'pending',
      payment_method: 'razorpay',
      razorpay_order_id: order.id,
      metadata: {
        planId,
        billingCycle,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Payment order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
