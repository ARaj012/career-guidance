# Career Guidance Platform - Development Guide

## Project Overview
A comprehensive student-focused career guidance platform with AI recommendations, admin panel, and content management system.

## Technology Stack
- **Frontend**: Next.js 16.2.3 (App Router, Turbopack), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI Integration**: Custom recommendation system based on user profiles

## Project Structure
- `apps/web/` - Main Next.js application
- `supabase/` - Database schemas and SQL files
- `apps/web/src/app/` - Next.js app router pages
- `apps/web/src/components/` - React components
- `apps/web/src/lib/` - Utility functions and configurations

## Build and Development Commands

### Development
```bash
cd apps/web
npm run dev
```

### Production Build
```bash
cd apps/web
npm run build
```

### Start Production Server
```bash
cd apps/web
npm start
```

## Key Features

### Student Panel Features
- **AI Career Recommendations**: `/recommend` - Personalized career matching based on profile
- **Career Explorer**: `/careers` - Browse 80+ career paths with detailed information
- **College Finder**: `/colleges` - Search and compare colleges
- **Exam Tracker**: `/exams` - Track entrance exams with dates and syllabus
- **Scholarships**: `/scholarships` - Find financial aid opportunities
- **Blog**: `/blog` - Career tips, industry news, and success stories
- **Dashboard**: `/dashboard` - Personal student dashboard with saved items
- **Profile Management**: `/profile` - Student profile completion and settings
- **Interactive Roadmaps**: `/exams/[slug]/roadmap` - Step-by-step career guidance
- **Save/Bookmark**: Save careers, colleges, and exams for later reference

### Admin Panel Features
- **Dashboard**: `/admin` - Overview with stats, system health, and activity logs
- **Content Management**: CRUD for Careers, Colleges, Exams, Skills, Subjects, Roadmaps
- **Scholarship Management**: `/admin/scholarships` - Manage scholarship listings
- **Blog Management**: `/admin/blog` - Create and manage blog posts
- **User Management**: `/admin/students` - View and manage student accounts
- **Data Alerts**: `/admin/alerts` - Monitor stale data
- **Audit Logs**: `/admin/audit` - Track all admin actions
- **Notifications**: `/admin/notifications` - Manage system notifications
- **Settings**: `/admin/settings` - System configuration

## Database Setup

### Required Tables
- `careers` - Career information
- `colleges` - College data
- `exams` - Exam information
- `skills` - Skills database
- `subjects` - Academic subjects
- `roadmaps` - Career path roadmaps
- `scholarships` - Scholarship listings
- `blog_posts` - Blog content
- `user_profiles` - Student profiles
- `user_accounts` - User account management
- `user_saved_careers` - Saved careers
- `user_saved_colleges` - Saved colleges
- `user_saved_exams` - Saved exams
- `admin_audit_logs` - Admin activity logging
- `admin_notifications` - System notifications

### Important RLS Policies
Run these SQL commands in Supabase SQL Editor to enable proper access:

```sql
-- Blog posts RLS
create policy "Public can read published blog posts"
  on public.blog_posts for select
  using (is_published = true);

create policy "Service role can manage blog posts"
  on public.blog_posts for all
  using (auth.role() = 'service_role');

-- Scholarships RLS
create policy "Public can read active scholarships"
  on public.scholarships for select
  using (is_active = true);

create policy "Service role can manage scholarships"
  on public.scholarships for all
  using (auth.role() = 'service_role');
```

## Environment Variables

Required in `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAILS=admin@example.com
```

## Authentication Flow
1. Students sign up via Google OAuth (`/login`)
2. Auth callback creates user account in `user_accounts` table
3. Admin access controlled by `ADMIN_EMAILS` environment variable
4. Admin authorization uses `requireAdmin()` middleware

## Recent Fixes Applied
1. **Student Account Sync**: Fixed auth callback to create user accounts automatically
2. **Blog Navigation**: Fixed routing for blog admin pages (blog vs blog_posts)
3. **Data Visibility**: Added RLS policies for blog posts and scholarships
4. **Array Field Handling**: Fixed comma-separated string to array conversion
5. **Navigation Updates**: Added Scholarships and Blog to main navigation

## Testing Checklist
- [ ] Student signup and profile completion
- [ ] AI recommendation system
- [ ] Save/bookmark functionality
- [ ] Admin panel CRUD operations
- [ ] Blog post visibility in student panel
- [ ] Scholarship visibility in student panel
- [ ] RLS policies working correctly
- [ ] Admin user management
- [ ] Audit logging functionality

## Known Issues Resolved
- ✅ Student accounts not showing in admin panel
- ✅ Blog navigation routing issues
- ✅ Scholarships not visible to students
- ✅ Blog posts not visible to students
- ✅ Hydration errors in admin panel

## Deployment Notes
- Ensure all environment variables are set in production
- Run database migrations for new tables
- Verify RLS policies are applied
- Test admin email access control
- Verify AI recommendation system connectivity
