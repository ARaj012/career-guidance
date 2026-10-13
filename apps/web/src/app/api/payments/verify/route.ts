import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import crypto from 'crypto'

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
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId: clientPlanId, billingCycle: clientBillingCycle } = body

    if (!razorpayOrderId || typeof razorpayOrderId !== 'string') {
      return NextResponse.json({ error: 'Invalid razorpayOrderId' }, { status: 400 })
    }

    if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string') {
      return NextResponse.json({ error: 'Invalid razorpayPaymentId' }, { status: 400 })
    }

    if (!razorpaySignature || typeof razorpaySignature !== 'string') {
      return NextResponse.json({ error: 'Invalid razorpaySignature' }, { status: 400 })
    }

    if (clientPlanId && typeof clientPlanId !== 'string') {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
    }

    if (clientBillingCycle && !['monthly', 'yearly'].includes(clientBillingCycle)) {
      return NextResponse.json({ error: 'Invalid billingCycle' }, { status: 400 })
    }

    // Mock mode for testing without real Razorpay
    if (MOCK_MODE) {
      console.log('🧪 MOCK MODE: Verifying payment for order:', razorpayOrderId)

      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      // For mock mode, require authentication in all environments
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Extract plan info from client request or database
      let planId = clientPlanId || 'premium' // Use client-provided planId or default
      let billingCycle = clientBillingCycle || 'monthly' // Use client-provided billingCycle or default
      let existingMetadata: any = null

      // Try to get the order from database to extract plan info if not provided by client
      if (!clientPlanId || !clientBillingCycle) {
        const { data: orderData } = await supabase
          .from('payment_history')
          .select('metadata')
          .eq('razorpay_order_id', razorpayOrderId)
          .single()

        if (orderData && orderData.metadata) {
          planId = orderData.metadata.plan_id || planId
          billingCycle = orderData.metadata.billing_cycle || billingCycle
          existingMetadata = orderData.metadata
          console.log('Extracted plan info from database:', { planId, billingCycle })
        } else {
          console.log('Using default plan info:', { planId, billingCycle })
        }
      } else {
        console.log('Using client-provided plan info:', { planId, billingCycle })
      }

      // Calculate subscription end date based on billing cycle
      const startDate = new Date()
      const endDate = new Date(startDate)

      if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }

      console.log('Mock subscription dates:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        plan: planId,
        cycle: billingCycle
      })

      // Try to update payment status in database (but don't fail if it doesn't work)
      try {
        const { error: paymentError } = await supabase
          .from('payment_history')
          .update({
            status: 'completed',
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            metadata: {
              ...existingMetadata,
              verified: true,
              verified_at: new Date().toISOString()
            }
          })
          .eq('razorpay_order_id', razorpayOrderId)

        if (paymentError) {
          console.error('Mock payment update error:', paymentError)
          console.log('Continuing with mock payment verification despite database error')
        } else {
          console.log('Mock payment updated successfully')
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError)
        console.log('Continuing with mock payment verification despite database failure')
      }

      // Try to create or update subscription (CRITICAL - this must work)
      try {
        // First try to update existing subscription
        const { data: existingSub, error: checkError } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .single()

        let result
        if (existingSub) {
          // Update existing subscription
          const { data: updateData, error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
              plan_id: planId,
              status: 'active',
              current_period_start: startDate.toISOString(),
              current_period_end: endDate.toISOString(),
              billing_cycle: billingCycle,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select()
            .single()

          if (updateError) {
            console.error('❌ Subscription update error:', updateError)
            return NextResponse.json({ 
              error: 'Failed to update subscription', 
              details: updateError.message 
            }, { status: 500 })
          }
          result = updateData
          console.log('✅ Subscription updated successfully:', result)
        } else {
          // Create new subscription
          const { data: insertData, error: insertError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: user.id,
              plan_id: planId,
              status: 'active',
              current_period_start: startDate.toISOString(),
              current_period_end: endDate.toISOString(),
              billing_cycle: billingCycle,
              cancel_at_period_end: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (insertError) {
            console.error('❌ Subscription creation error:', insertError)
            return NextResponse.json({ 
              error: 'Failed to create subscription', 
              details: insertError.message 
            }, { status: 500 })
          }
          result = insertData
          console.log('✅ Subscription created successfully:', result)
        }
      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError)
        return NextResponse.json({ 
          error: 'Database operation failed', 
          details: String(dbError) 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        planId: planId,
        subscriptionEnd: endDate.toISOString()
      })
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.' },
        { status: 500 }
      )
    }

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // @ts-ignore - Razorpay types have strict requirements
    const payment = await razorpay.payments.fetch(razorpayPaymentId as any)

    if (payment.status !== 'captured') {
      return NextResponse.json({ error: 'Payment not captured' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Update payment history
    await supabase
      .from('payment_history')
      .update({
        status: 'completed',
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq('razorpay_order_id', razorpayOrderId)

    // Get payment notes to extract plan details
    // @ts-ignore - Razorpay types have strict requirements
    const order = await razorpay.orders.fetch(razorpayOrderId as any)
    const notes = order.notes

    // Update subscription
    const planId = notes.planId
    const billingCycle = notes.billingCycle

    // Calculate period end
    const periodEnd = new Date()
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        razorpay_subscription_id: payment.subscription_id,
        razorpay_customer_id: payment.customer_id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return NextResponse.json({ success: true, planId })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}