import Link from 'next/link'

export default function NotAdminPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin access only</h1>
        <p className="text-gray-500 mb-6">
          This Google account is not on the admin list. Use a student dashboard instead, or sign in with an email from{' '}
          <code className="text-sm bg-gray-100 px-1 rounded">ADMIN_EMAILS</code>.
        </p>
        <Link href="/dashboard" className="text-indigo-600 hover:underline">Back to dashboard</Link>
      </div>
    </div>
  )
}
