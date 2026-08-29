import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Calendar, DollarSign, GraduationCap, MapPin, ExternalLink, FileText, User, CheckCircle2 } from 'lucide-react'

export default async function ScholarshipDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: scholarship } = await supabase
    .from('scholarships')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!scholarship) {
    notFound()
  }

  const formatAmount = (scholarship: any) => {
    if (scholarship.amount_type === 'full_tuition') return 'Full Tuition'
    if (scholarship.amount_type === 'partial_tuition') return 'Partial Tuition'
    if (scholarship.amount_type === 'stipend') return 'Stipend'
    
    if (scholarship.amount_min && scholarship.amount_max) {
      return `₹${(scholarship.amount_min / 100000).toFixed(1)}L - ₹${(scholarship.amount_max / 100000).toFixed(1)}L`
    }
    if (scholarship.amount_min) return `₹${(scholarship.amount_min / 100000).toFixed(1)}L+`
    if (scholarship.amount_max) return `Up to ₹${(scholarship.amount_max / 100000).toFixed(1)}L`
    return 'Amount not specified'
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'No deadline'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      merit: { bg: 'bg-blue-50', text: 'text-blue-700' },
      need_based: { bg: 'bg-green-50', text: 'text-green-700' },
      sports: { bg: 'bg-orange-50', text: 'text-orange-700' },
      arts: { bg: 'bg-purple-50', text: 'text-purple-700' },
      minority: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
      women: { bg: 'bg-pink-50', text: 'text-pink-700' },
      general: { bg: 'bg-gray-50', text: 'text-gray-700' },
    }
    return colors[category] || { bg: 'bg-gray-50', text: 'text-gray-700' }
  }

  const catColor = getCategoryColor(scholarship.category)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <Link href="/scholarships" className="text-emerald-200 hover:text-white text-sm">
            ← Back to Scholarships
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{scholarship.name}</h1>
          <p className="text-emerald-100 mt-3 text-lg max-w-2xl">{scholarship.description}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${catColor.bg} ${catColor.text}`}>
              {scholarship.category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </span>
            <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              {scholarship.level.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </span>
            {scholarship.state && (
              <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">
                <MapPin className="w-4 h-4 inline mr-1" />
                {scholarship.state}, {scholarship.country}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Key Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scholarship Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Amount</p>
              <p className="font-bold text-emerald-700 text-lg mt-1">{formatAmount(scholarship)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Provider</p>
              <p className="font-bold text-blue-700 text-lg mt-1">{scholarship.provider}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Application Deadline</p>
              <p className="font-bold text-purple-700 text-lg mt-1">{formatDate(scholarship.application_deadline)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Education Level</p>
              <p className="font-bold text-orange-700 text-lg mt-1 capitalize">{scholarship.level.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Eligibility */}
        {scholarship.eligibility_criteria && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              Eligibility Criteria
            </h2>
            <div className="prose prose-sm text-gray-600">
              <p>{scholarship.eligibility_criteria}</p>
            </div>
          </div>
        )}

        {/* Required Documents */}
        {scholarship.required_documents && scholarship.required_documents.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              Required Documents
            </h2>
            <ul className="space-y-2">
              {scholarship.required_documents.map((doc: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Field of Study */}
        {scholarship.field_of_study && scholarship.field_of_study.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Field of Study</h2>
            <div className="flex flex-wrap gap-2">
              {scholarship.field_of_study.map((field: string, index: number) => (
                <span key={index} className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        {scholarship.application_url && (
          <div className="bg-emerald-600 rounded-2xl p-8 text-center mb-8">
            <h3 className="text-white text-xl font-semibold mb-2">Ready to Apply?</h3>
            <p className="text-emerald-100 mb-4">Make sure you have all required documents before applying</p>
            <a
              href={scholarship.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-emerald-600 font-medium px-8 py-3 rounded-lg hover:bg-emerald-50 transition"
            >
              Apply Now <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Back to Scholarships */}
        <div className="text-center">
          <Link href="/scholarships" className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
            ← Back to all scholarships
          </Link>
        </div>
      </div>
    </div>
  )
}
