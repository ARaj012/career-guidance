import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// @ts-ignore - Razorpay types are not perfect
const Razorpay = require('razorpay')

export const runtime = 'nodejs'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, billingCycle } = body

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
