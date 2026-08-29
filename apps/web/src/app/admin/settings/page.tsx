'use client'

import { useEffect, useState } from 'react'
import { Settings, Database, Shield, Users, Clock } from 'lucide-react'

export default function AdminSettingsPage() {
  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real application, you might fetch this from an API
    // For now, we'll show a placeholder
    setAdminEmails(['admin@example.com']) // Placeholder
    setLoading(false)
  }, [])

  const settings = [
    {
      category: 'Authentication',
      icon: Shield,
      items: [
        {
          label: 'Admin Email List',
          value: adminEmails.join(', ') || 'Not configured',
          description: 'Email addresses that have admin access (configured via ADMIN_EMAILS environment variable)',
          type: 'environment'
        },
        {
          label: 'Auth Provider',
          value: 'Google OAuth',
          description: 'Users sign in using Google OAuth',
          type: 'readonly'
        }
      ]
    },
    {
      category: 'Database',
      icon: Database,
      items: [
        {
          label: 'Database Provider',
          value: 'Supabase',
          description: 'PostgreSQL database hosted on Supabase',
          type: 'readonly'
        },
        {
          label: 'Connection Type',
          value: 'Service Role',
          description: 'Admin operations use service role key for full access',
          type: 'readonly'
        }
      ]
    },
    {
      category: 'Data Management',
      icon: Clock,
      items: [
        {
          label: 'Data Freshness Tracking',
          value: 'Enabled',
          description: 'Automatic tracking of exam schedules, placement data, and cutoffs for staleness',
          type: 'readonly'
        },
        {
          label: 'Audit Logging',
          value: 'Enabled',
          description: 'All admin actions are logged to admin_audit_logs table',
          type: 'readonly'
        },
        {
          label: 'Notification System',
          value: 'Enabled',
          description: 'Automatic notifications for stale data and system events',
          type: 'readonly'
        }
      ]
    },
    {
      category: 'User Management',
      icon: Users,
      items: [
        {
          label: 'Account Activation',
          value: 'Enabled',
          description: 'Admins can activate/deactivate user accounts',
          type: 'readonly'
        },
        {
          label: 'Profile Modification',
          value: 'Read-only',
          description: 'Admins can view but not modify student profile data',
          type: 'readonly'
        }
      ]
    }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        System configuration and settings. Most settings are configured via environment variables.
      </p>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          Loading settings…
        </div>
      ) : (
        <div className="space-y-6">
          {settings.map((section) => (
            <div key={section.category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                <section.icon className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">{section.category}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {section.items.map((item) => (
                  <div key={item.label} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      </div>
                      <div className="ml-4">
                        {item.type === 'environment' ? (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
                            Environment Variable
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                            {item.value}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.type === 'environment' && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <p className="text-xs text-amber-800">
                          <strong>Current value:</strong> {item.value}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          To modify this setting, update the ADMIN_EMAILS environment variable in your .env.local file and restart the server.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Information Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">About Admin Settings</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Most administrative settings are configured through environment variables to ensure security and consistency. 
                  Admin email access is controlled via the ADMIN_EMAILS variable, and sensitive database operations use the SUPABASE_SERVICE_ROLE_KEY.
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  To modify environment variables, edit the <code className="bg-blue-100 px-1 rounded">apps/web/.env.local</code> file and restart your development server.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}