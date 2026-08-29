'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, Filter, CheckCircle2, XCircle, Calendar, Crown, Sparkles, Star, TrendingUp } from 'lucide-react'

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  user_email: string
  user_name: string
}

interface Plan {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // Load subscriptions with user info
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          user_accounts (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
      
      const formattedSubs = (subData || []).map((sub: any) => ({
        ...sub,
        user_email: sub.user_accounts?.email,
        user_name: sub.user_accounts?.full_name
      }))
      
      setSubscriptions(formattedSubs)

      // Load plans
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id, name, price_monthly, price_yearly')
        .eq('is_active', true)
        .order('display_order')
      
      setPlans(planData || [])
      setLoading(false)
    }
    loadData()
  }, [supabase])

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return Sparkles
      case 'premium': return Crown
      case 'pro': return Star
      default: return Sparkles
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'text-gray-600 bg-gray-100'
      case 'premium': return 'text-indigo-600 bg-indigo-100'
      case 'pro': return 'text-amber-600 bg-amber-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      case 'expired': return 'text-gray-600 bg-gray-50'
      case 'past_due': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchTerm || 
      sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    const matchesPlan = planFilter === 'all' || sub.plan_id === planFilter
    
    return matchesSearch && matchesStatus && matchesPlan
  })

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    premium: subscriptions.filter(s => s.plan_id === 'premium' && s.status === 'active').length,
    pro: subscriptions.filter(s => s.plan_id === 'pro' && s.status === 'active').length,
    monthlyRevenue: subscriptions
      .filter(s => s.status === 'active' && s.billing_cycle === 'monthly')
      .reduce((sum, s) => {
        const plan = plans.find(p => p.id === s.plan_id)
        return sum + (plan?.price_monthly || 0)
      }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Management</h1>
      <p className="text-sm text-gray-500 mb-6">Monitor and manage user subscriptions</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.premium + stats.pro}</p>
              <p className="text-xs text-gray-500">Paid Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 font-bold">₹</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">₹{stats.monthlyRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Monthly Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="past_due">Past Due</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No subscriptions found
                </td>
              </tr>
            ) : filteredSubscriptions.map((sub) => {
              const PlanIcon = getPlanIcon(sub.plan_id)
              const planColor = getPlanColor(sub.plan_id)
              const statusColor = getStatusColor(sub.status)
              
              return (
                <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{sub.user_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{sub.user_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${planColor}`}>
                        <PlanIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900 capitalize">{sub.plan_id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${statusColor}`}>
                      {sub.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {sub.status}
                    </span>
                    {sub.cancel_at_period_end && (
                      <span className="block text-xs text-amber-600 mt-1">Cancelling soon</span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{sub.billing_cycle}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(sub.current_period_end).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
