import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: careers } = await supabase
    .from('careers')
    .select('*')
    .eq('is_trending', true)
    .limit(6)

  const { data: savedCareers } = await supabase
    .from('user_saved_careers')
    .select('id, created_at, careers(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const { count: savedCollegesCount } = await supabase
    .from('user_saved_colleges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: savedExamsCount } = await supabase
    .from('user_saved_exams')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: scholarshipCount } = await supabase
    .from('scholarships')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: blogCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  // Get user subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan_id, status')
    .eq('user_id', user.id)
    .single()

  // Profile completion
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const sections = [
    { label: 'Basic Info', done: true },
    { label: 'Education', done: !!profile?.class_level },
    { label: 'Stream', done: !!profile?.stream },
    { label: 'Board', done: !!profile?.board },
    { label: 'State', done: !!profile?.state },
    { label: 'Subjects', done: (profile?.subjects?.length || 0) > 0 },
    { label: 'Target Exams', done: (profile?.target_exams?.length || 0) > 0 },
    { label: 'Career Goal', done: !!profile?.career_goal },
  ]
  const completedCount = sections.filter(s => s.done).length
  const completionPct = Math.round((completedCount / sections.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}


      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-8 text-white mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Student'}! 👋
              </h2>
              <p className="text-indigo-100 mb-6">
                Ready to explore your career path today?
              </p>
              <div className="flex gap-4">
                <a href="/recommend" className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition">
                  Get Career Recommendations
                </a>
                <a href="/careers" className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-400 transition border border-indigo-400">
                  Browse All Careers
                </a>
              </div>
            </div>
            {subscription && (
              <div className="hidden md:block text-right">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium capitalize">{subscription.plan_id} Plan</span>
                  {subscription.plan_id === 'free' && (
                    <a href="/pricing" className="text-xs bg-white text-indigo-600 px-3 py-1 rounded-full font-medium hover:bg-indigo-50 transition">
                      Upgrade
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
          {[
            { icon: '🎯', label: 'Career Matches', value: '0', color: 'bg-purple-50 text-purple-600' },
            { icon: '📚', label: 'Saved Careers', value: savedCareers?.length || 0, color: 'bg-blue-50 text-blue-600' },
            { icon: '📝', label: 'Saved Exams', value: savedExamsCount || 0, color: 'bg-green-50 text-green-600' },
            { icon: '🏫', label: 'Saved Colleges', value: savedCollegesCount || 0, color: 'bg-orange-50 text-orange-600' },
            { icon: '💰', label: 'Scholarships', value: scholarshipCount || 0, color: 'bg-emerald-50 text-emerald-600' },
            { icon: '📰', label: 'Blog Posts', value: blogCount || 0, color: 'bg-teal-50 text-teal-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Trending Careers */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Trending Careers</h3>
              <a href="/careers" className="text-indigo-600 text-sm hover:underline">View all</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careers?.map((career) => (
                <div key={career.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-medium px-2 py-1 rounded-full">
                      {career.category}
                    </span>
                    <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-1 rounded-full">
                      Trending
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mt-2">{career.title}</h4>
                  <p className="text-green-600 text-sm font-semibold mt-1">
                    Rs.{(career.avg_salary_min/100000).toFixed(0)}L - Rs.{(career.avg_salary_max/100000).toFixed(0)}L/yr
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Demand</span>
                    <span className="text-indigo-600 font-bold text-sm">{career.demand_score}/10</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="bg-indigo-500 h-1.5 rounded-full" 
                      style={{ width: `${(career.demand_score/10)*100}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { icon: '🎯', label: 'Get Recommendations', href: '/recommend', color: 'bg-purple-50 text-purple-700' },
                  { icon: '❤️', label: 'Saved Careers', href: '/saved/careers', color: 'bg-pink-50 text-pink-700' },
                  { icon: '🏫', label: 'Saved Colleges', href: '/saved/colleges', color: 'bg-blue-50 text-blue-700' },
                  { icon: '📝', label: 'Saved Exams', href: '/saved/exams', color: 'bg-green-50 text-green-700' },
                  { icon: '📊', label: 'Recommendation History', href: '/recommendation-history', color: 'bg-indigo-50 text-indigo-700' },
                  { icon: '💰', label: 'Scholarships', href: '/scholarships', color: 'bg-emerald-50 text-emerald-700' },
                  { icon: '🗺️', label: 'View Roadmaps', href: '/roadmaps', color: 'bg-orange-50 text-orange-700' },
                  { icon: '📖', label: 'Career Blog', href: '/blog', color: 'bg-rose-50 text-rose-700' },
                ].map((action) => (
                  <a key={action.label} href={action.href}
                    className={`flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition ${action.color}`}>
                    <span>{action.icon}</span>
                    <span className="font-medium text-sm">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Profile Completion</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{completedCount}/{sections.length} complete</span>
                <span className="text-indigo-600 font-bold text-sm">{completionPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${completionPct}%` }}/>
              </div>
              <div className="mt-4 space-y-2">
                {sections.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <span>{item.done ? '✅' : '⬜'}</span>
                    <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-700'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <a href="/profile" className="block mt-4 text-center bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                Complete Profile
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}