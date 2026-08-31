# 🧪 Mock Payment System - Testing Guide

## Overview
The Career Guidance Platform now includes a **mock payment system** that allows you to test the entire payment flow UI/UX without requiring real Razorpay credentials or PAN registration.

## How It Works

### Automatic Mock Mode
The system automatically detects if Razorpay credentials are missing:
- **No Razorpay Keys**: Automatically activates mock mode
- **With Razorpay Keys**: Uses real Razorpay integration

### Mock Payment Flow
1. User selects a plan on `/pricing` page
2. System creates a mock order with fake order ID
3. User sees a mock payment confirmation dialog
4. System simulates successful payment verification
5. Subscription is activated in the database
6. User is redirected to `/subscription` page

## Testing the Mock Payment System

### Step 1: Start Development Server
```bash
cd apps/web
npm run dev
```

### Step 2: Navigate to Pricing Page
Go to `http://localhost:3000/pricing`

### Step 3: Select a Plan
Click "Upgrade Now" on any paid plan (Basic, Pro, or Enterprise)

### Step 4: Mock Payment Dialog
You'll see a confirmation dialog showing:
- 🧪 MOCK PAYMENT MODE indicator
- Plan details and amount
- Confirmation prompt

### Step 5: Confirm Mock Payment
Click "OK" to simulate successful payment

### Step 6: Verify Subscription
- You'll be redirected to `/subscription` page
- Your subscription will show as "Active"
- You can see your current plan details

## What Gets Tested

### ✅ UI/UX Flow
- Plan selection interface
- Billing cycle toggle (monthly/yearly)
- Payment button states
- Success/error messages
- Redirect behavior

### ✅ Database Operations
- Order creation in `payment_history` table
- Payment status updates
- Subscription creation in `subscriptions` table
- User subscription management

### ✅ API Endpoints
- `/api/payments/create-order` - Mock order creation
- `/api/payments/verify` - Mock payment verification
- `/api/payments/webhook` - Mock webhook handling

## Mock vs Real Mode

### Mock Mode (Current)
- **No credentials required**
- **No real payments processed**
- **Instant payment simulation**
- **Perfect for UI/UX testing**
- **Database operations are real**

### Real Mode (Future)
- **Requires Razorpay credentials**
- **Real payment processing**
- **Actual Razorpay checkout**
- **Webhook integration**
- **Production-ready**

## Database Schema Used

### Tables Involved
- `payment_history` - Stores mock payment records
- `subscriptions` - Stores user subscription status
- `subscription_plans` - Plan configuration

### Mock Data Examples
- **Order IDs**: `order_mock_1234567890`
- **Payment IDs**: `pay_mock_1234567890`
- **Amounts**: Real plan amounts (₹299, ₹999, ₹2499)
- **Status**: `created` → `completed`

## Switching to Real Payments

When you're ready to enable real payments:

1. **Complete Razorpay KYC** (provide PAN when required)
2. **Add Environment Variables** to `apps/web/.env.local`:
   ```env
   RAZORPAY_KEY_ID=your_real_key_id
   RAZORPAY_KEY_SECRET=your_real_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```
3. **Restart Development Server**
4. **Test with Real Razorpay** (test mode first)

## Console Logging

Mock mode includes console logging for debugging:
- `🧪 MOCK MODE: Creating order for plan: basic billing: monthly`
- `🧪 MOCK MODE: Verifying payment for order: order_mock_123`
- `🧪 MOCK MODE: Webhook received (simulated)`

## Limitations

### Mock Mode Limitations
- No real payment processing
- No webhook delivery
- No Razorpay dashboard integration
- No real payment methods testing

### What Still Works
- Complete UI/UX testing
- Database operations
- Subscription management
- Plan comparison
- Usage tracking

## Testing Checklist

### Mock Payment Testing
- [x] Plan selection (Basic, Pro, Enterprise)
- [x] Monthly/yearly billing toggle
- [x] Mock payment confirmation dialog
- [x] Success message display
- [x] Redirect to subscription page
- [x] Subscription status update
- [x] Plan change functionality
- [x] Subscription cancellation
- [x] Database record creation

### UI/UX Testing
- [x] Responsive design
- [x] Loading states
- [x] Error handling
- [x] User feedback messages
- [x] Navigation flow

## Next Steps

### For Development
- Continue testing with mock mode
- Refine UI/UX based on testing
- Test edge cases and error scenarios

### For Production
- Complete Razorpay KYC process
- Add real credentials
- Test with Razorpay test mode
- Configure webhooks
- Test live payments

## Troubleshooting

### Mock Payment Not Working
- Check browser console for errors
- Verify database tables exist
- Ensure development server is running
- Check user authentication status

### Database Issues
- Run `supabase/freemium-schema.sql` if tables missing
- Check RLS policies on payment tables
- Verify user has proper permissions

### Build Errors
- Ensure all API endpoints are updated
- Check TypeScript compilation
- Verify environment variables format

## Conclusion

The mock payment system provides a complete testing environment without requiring real payment credentials. You can test the entire payment flow, UI/UX, and database operations before committing to real payment integration.

**Your application is now ready for comprehensive payment flow testing!** 🚀