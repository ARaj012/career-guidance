import Link from 'next/link'
import { Compass, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo, matching Navbar branding */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">
            <span className="text-gray-900">Career</span>
            <span className="text-indigo-600">Guide</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
          <p className="text-sm font-medium text-indigo-600 mb-2">Off the map</p>
          <h1 className="text-6xl font-bold text-gray-900 mb-3">404</h1>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            This path doesn&apos;t lead anywhere yet
          </h2>
          <p className="text-gray-500 mb-8">
            The page you&apos;re looking for may have moved, or the link might be off. Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-200 transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              Browse Careers
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Every wrong turn is still part of finding the right path.
        </p>
      </div>
    </div>
  )
}
