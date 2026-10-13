'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RefreshCw, CheckCircle, AlertCircle, Calendar, TrendingUp } from 'lucide-react'

interface AutomationStatus {
  exam: string
  lastUpdate: string
  status: 'active' | 'idle' | 'error'
  changes: string[]
}

export default function AutomationPage() {
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus[]>([
    {
      exam: 'GATE',
      lastUpdate: '2026-10-13',
      status: 'idle',
      changes: []
    }
  ])
  const [isRunning, setIsRunning] = useState(false)
  const supabase = createClient()

  const runAutomation = async (exam: string, action: string) => {
    setIsRunning(true)
    
    try {
      const response = await fetch('/api/automation/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAutomationStatus(prev => prev.map(item => 
          item.exam === exam 
            ? { 
                ...item, 
                lastUpdate: new Date().toISOString().split('T')[0],
                status: 'active',
                changes: data.changes
              }
            : item
        ))
      }
    } catch (error) {
      console.error('Automation error:', error)
      setAutomationStatus(prev => prev.map(item => 
        item.exam === exam 
          ? { ...item, status: 'error', changes: [] }
          : item
      ))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Automation</h1>
          <p className="text-gray-600">
            Automated system to keep exam and college data up-to-date
          </p>
        </div>

        {/* Automation Status Cards */}
        <div className="grid gap-6 mb-8">
          {automationStatus.map((status) => (
            <div key={status.exam} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    status.status === 'active' ? 'bg-green-100' : 
                    status.status === 'error' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {status.status === 'active' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : status.status === 'error' ? (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <RefreshCw className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{status.exam}</h3>
                    <p className="text-sm text-gray-500">
                      Last updated: {status.lastUpdate}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  status.status === 'active' ? 'bg-green-100 text-green-700' :
                  status.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {status.status}
                </div>
              </div>

              {/* Automation Actions */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => runAutomation(status.exam, 'exam-dates')}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Update Dates</span>
                </button>
                <button
                  onClick={() => runAutomation(status.exam, 'cutoffs')}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition disabled:opacity-50"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Update Cutoffs</span>
                </button>
                <button
                  onClick={() => runAutomation(status.exam, 'all')}
                  disabled={isRunning}
                  className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">Update All</span>
                </button>
              </div>

              {/* Changes Display */}
              {status.changes.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-semibold mb-1">Recent Changes:</p>
                  <ul className="text-sm text-blue-700">
                    {status.changes.map((change, index) => (
                      <li key={index}>• {change}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Scheduler Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Schedule</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900">Weekly Check</p>
                  <p className="text-sm text-gray-500">Automatically checks for updates every Sunday</p>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                Active
              </span>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-900 font-semibold mb-1">Note:</p>
              <p className="text-sm text-yellow-700">
                This is a demonstration system. In production, you'll need to:
                1. Set up a cron job or similar scheduler
                2. Install Cheerio for actual HTML parsing
                3. Configure the scraper for each specific website
                4. Add error handling and retry logic
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
