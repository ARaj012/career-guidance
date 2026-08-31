# 🚀 Vercel Deployment Guide

## Pre-Deployment Checklist

### ✅ Database Setup
- [x] Supabase project created
- [x] Database schema applied (run `supabase/freemium-schema.sql`)
- [x] RLS policies configured (run `supabase/fix-rls-policies.sql`)
- [x] Environment variables ready

### ✅ Application Status
- [x] Next.js build successful
- [x] All routes working
- [x] Mock payment system functional
- [x] Authentication working
- [x] Database operations aligned

## Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Admin Configuration
ADMIN_EMAILS=admin@example.com

# AI Configuration (Optional)
GROQ_API_KEY=your_groq_api_key

# Razorpay Payment (Optional - for real payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Configure Environment Variables
Add all the environment variables listed above in Vercel

### 4. Deploy
Click "Deploy" and wait for the build to complete

## Post-Deployment Tasks

### 1. Update Google OAuth Redirect URLs
- Go to Google Cloud Console
- Add your Vercel domain to authorized redirect URIs:
  - `https://your-domain.vercel.app/auth/callback`

### 2. Configure Razorpay Webhooks (if using real payments)
- Go to Razorpay Dashboard
- Add webhook URL: `https://your-domain.vercel.app/api/payments/webhook`

### 3. Test Critical Flows
- [ ] User authentication
- [ ] Admin panel access
- [ ] Student features
- [ ] Mock payment flow
- [ ] Database operations

## Deployment Verification

### Check these endpoints:
- `https://your-domain.vercel.app/` - Home page
- `https://your-domain.vercel.app/login` - Login page
- `https://your-domain.vercel.app/pricing` - Pricing page
- `https://your-domain.vercel.app/subscription` - Subscription page
- `https://your-domain.vercel.app/admin` - Admin panel

### Test Authentication:
1. Try logging in with Google OAuth
2. Check if user profile loads correctly
3. Verify admin access with configured email

### Test Payment Flow:
1. Go to pricing page
2. Try mock payment (if Razorpay not configured)
3. Verify subscription status updates
4. Check subscription management page

## Troubleshooting

### Build Failures
- Check environment variables are set correctly
- Verify `apps/web/package.json` has correct scripts
- Ensure Node.js version is compatible (18+)

### Runtime Errors
- Check Vercel logs for specific errors
- Verify database schema is applied
- Check RLS policies are working

### Authentication Issues
- Verify Google OAuth redirect URLs
- Check Supabase auth configuration
- Ensure environment variables are correct

### Database Issues
- Run schema migrations in Supabase
- Check RLS policies
- Verify table names match code

## Performance Optimization

### Vercel Configuration
Add `vercel.json` in project root:
```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

### Environment-Specific Settings
- **Development**: Local development with mock payments
- **Production**: Real payments (when configured)
- **Staging**: Test environment for pre-production

## Security Considerations

### Required Security Measures:
- [x] RLS policies on all tables
- [x] Admin email validation
- [x] Secure API key storage
- [x] HTTPS only (Vercel provides this)
- [x] Rate limiting on sensitive endpoints

### Optional Security Enhancements:
- Add rate limiting to API routes
- Implement request validation
- Add CORS configuration
- Set up error monitoring (Sentry)

## Monitoring and Maintenance

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Set up error tracking
- Monitor API response times

### Database Monitoring
- Monitor Supabase database performance
- Check query execution times
- Monitor storage usage

### User Activity
- Track user signups
- Monitor payment conversions
- Analyze feature usage

## Rollback Plan

If deployment fails:
1. Revert to previous commit
2. Redeploy from Vercel dashboard
3. Check environment variables
4. Verify database schema

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Deployment](https://supabase.com/docs/guides/platform/deployment-guide)

## Success Criteria

Deployment is successful when:
- ✅ All pages load without errors
- ✅ Authentication works correctly
- ✅ Admin panel is accessible
- ✅ Student features function properly
- ✅ Mock payment flow works
- ✅ Database operations are successful
- ✅ No console errors on critical pages

---

**Ready for deployment!** 🚀