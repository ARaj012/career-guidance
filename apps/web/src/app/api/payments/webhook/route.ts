import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') as string

    // Verify webhook signature
    // @ts-ignore - Razorpay webhook signature verification
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    const receivedSignature = expectedSignature + '|' + body

    if (signature !== receivedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    // Handle payment success
    if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
      const payment = event.payload.payment.entity
      const notes = payment.notes

      const supabase = createClient()

      // Update payment history
      await supabase
        .from('payment_history')
        .update({
          status: 'completed',
          razorpay_payment_id: payment.id,
          invoice_url: payment.invoice_url,
        })
        .eq('razorpay_order_id', payment.order_id)

      // Create or update user subscription
      const planId = notes.planId
      const billingCycle = notes.billingCycle
      const userId = notes.userId

      // Calculate period end based on billing cycle
      const periodEnd = new Date()
      if (billingCycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      // Upsert subscription
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
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

      console.log(`Subscription updated for user ${userId} to plan ${planId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
