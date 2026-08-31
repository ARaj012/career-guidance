# 🚀 Razorpay Payment Integration Guide

## Step-by-Step Implementation

### 1. Set Up Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a free account
3. Navigate to Settings → API Keys
4. Generate API Key ID and Key Secret
5. Note down both keys for configuration

### 2. Install Razorpay Package
```bash
cd apps/web
npm install razorpay
```

### 3. Add Environment Variables
Add to `apps/web/.env.local`:
```env
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Important**: The application is now designed to work even without Razorpay credentials. If the environment variables are not set, the payment endpoints will return appropriate error messages indicating that the payment system is not configured. This allows the rest of the application to function normally while payment features are gracefully disabled.

### 4. Configure Webhook in Razorpay
1. In Razorpay Dashboard, go to Settings → Webhooks
2. Add new webhook:
   - Webhook URL: `https://your-domain.com/api/payments/webhook`
   - Secret: Use the same as `RAZORPAY_WEBHOOK_SECRET`
   - Events to capture: `payment.captured`, `payment.authorized`, `payment.failed`

### 5. API Endpoints Created

#### `/api/payments/create-order`
- Creates Razorpay order for subscription
- Validates plan details
- Stores order in payment_history
- Returns order details for checkout
- **Graceful Degradation**: Returns error if Razorpay keys are not configured

#### `/api/payments/verify`
- Verifies payment signature
- Updates payment status
- Activates user subscription
- Handles subscription upsert
- **Graceful Degradation**: Returns error if Razorpay keys are not configured

#### `/api/payments/webhook`
- Handles Razorpay webhook notifications
- Verifies webhook signature
- Updates payment and subscription status
- Provides automatic subscription management
- **Graceful Degradation**: Returns error if webhook secret is not configured

### 6. Payment Flow
1. User selects plan on `/pricing` page
2. Frontend calls `/api/payments/create-order`
3. Razorpay checkout opens
4. User completes payment
5. Frontend calls `/api/payments/verify`
6. Subscription is activated
7. Webhook provides backup verification

### 7. Frontend Integration
- Added Razorpay checkout script to layout
- Integrated payment flow in pricing page
- Auto-redirects to subscription page after payment
- Shows success/error messages

### 8. Testing Payment Flow
1. Test mode is available in Razorpay
2. Use test card numbers for development
3. Verify order creation in Razorpay dashboard
4. Test webhook delivery locally (use ngrok for local testing)

### 9. Security Features
- Signature verification for all payment operations
- Webhook signature validation
- Server-side payment verification
- Secure API key storage
- Idempotent subscription upserts

### 10. Error Handling
- Invalid signature detection
- Payment failure handling
- Plan validation
- User authentication checks
- Database transaction safety

## 🎯 Next Steps

### Development Testing
1. Install Razorpay package: `npm install razorpay`
2. Add environment variables
3. Test with Razorpay test mode
4. Use ngrok for local webhook testing

### Production Deployment
1. Set production API keys
2. Configure production webhook URL
3. Enable SSL for your domain
4. Test payment flow in production
5. Set up webhook retry policy

### Monitoring
- Monitor payment success rate
- Track webhook delivery failures
- Monitor subscription cancellations
- Set up alerts for payment failures

## 🔧 Troubleshooting

### Common Issues
- **Signature mismatch**: Check API keys match
- **Webhook failures**: Verify webhook URL is accessible
- **Payment verification fails**: Check webhook secret
- **Subscription not activated**: Check database logs
- **Payment system not configured**: This is expected if Razorpay environment variables are not set. The rest of the application will work normally, but payment features will be disabled until keys are added.

### Debug Mode
Enable console logging in payment endpoints for debugging during development.

## 📝 API Response Format

### Create Order Response
```json
{
  "orderId": "order_123",
  "amount": 29900,
  "currency": "INR",
  "keyId": "rzp_test_123"
}
```

### Verify Response
```json
{
  "success": true,
  "planId": "premium"
}
```

The payment integration is now complete and ready for Razorpay setup!