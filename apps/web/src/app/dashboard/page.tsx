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
    .select('*, careers(*)')
    .eq('user_id', user.id)
    .limit(4)

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navbar */}


      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-8 text-white mb-10">
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: '🎯', label: 'Career Matches', value: '0', color: 'bg-purple-50 text-purple-600' },
            { icon: '📚', label: 'Saved Careers', value: savedCareers?.length || '0', color: 'bg-blue-50 text-blue-600' },
            { icon: '📝', label: 'Saved Exams', value: '0', color: 'bg-green-50 text-green-600' },
            { icon: '🏫', label: 'Saved Colleges', value: '0', color: 'bg-orange-50 text-orange-600' },
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
                  { icon: '🗺️', label: 'View Roadmaps', href: '/roadmaps', color: 'bg-blue-50 text-blue-700' },
                  { icon: '📝', label: 'Browse Exams', href: '/exams', color: 'bg-green-50 text-green-700' },
                  { icon: '🏫', label: 'Find Colleges', href: '/colleges', color: 'bg-orange-50 text-orange-700' },
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
                <span className="text-sm text-gray-500">30% complete</span>
                <span className="text-indigo-600 font-bold text-sm">30%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '30%' }}/>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { label: 'Basic Info', done: true },
                  { label: 'Add Subjects', done: false },
                  { label: 'Career Preferences', done: false },
                  { label: 'Education Details', done: false },
                ].map((item) => (
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