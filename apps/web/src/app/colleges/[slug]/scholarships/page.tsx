import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  GraduationCap,
  Landmark,
  Wallet,
  CalendarClock,
  ExternalLink,
  IndianRupee,
} from "lucide-react";

export default async function CollegeScholarshipsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Get college details
  const { data: college, error: collegeError } = await supabase
    .from("colleges")
    .select("*")
    .eq("slug", slug)
    .single();

  if (collegeError || !college) {
    notFound();
  }

  // Get scholarships for this college
  const { data: scholarshipsRaw } = await supabase
    .from("college_scholarships_detail")
    .select("*")
    .eq("college_id", college.id)
    .order("amount_max", { ascending: false, nullsFirst: false });

  const scholarships: any[] = scholarshipsRaw ?? [];

  // Get user profile for personalization
  let userProfile: any = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("state, stream, current_education, class_level")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      userProfile = {
        state: profile.state,
        stream: profile.stream,
        current_education: profile.current_education,
        class_level: profile.class_level,
      };
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link
            href={`/colleges/${slug}`}
            className="text-emerald-200 hover:text-white text-sm inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to College
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Scholarships for {college.name}
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base">
                {college.city}, {college.state}
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl">
              <Award className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {scholarships.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Total Scholarships</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {scholarships.length > 0
                    ? `₹${Math.max(...scholarships.map((s: any) => s.amount_max || 0)).toLocaleString('en-IN')}`
                    : 'N/A'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Max Amount</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {new Set(scholarships.map((s: any) => s.level)).size}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Education Levels</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scholarship List */}
        {scholarships.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Available Scholarships</h3>
            <div className="space-y-4">
              {scholarships.map((scholarship: any) => (
                <div
                  key={scholarship.link_id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{scholarship.scholarship_name}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">{scholarship.provider}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {scholarship.level && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{scholarship.level}</span>
                        )}
                        {scholarship.category && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{scholarship.category}</span>
                        )}
                        {scholarship.application_deadline && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" />
                            {new Date(scholarship.application_deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {scholarship.amount_max && (
                        <p className="text-lg sm:text-xl font-bold text-emerald-600">
                          ₹{scholarship.amount_max.toLocaleString('en-IN')}
                        </p>
                      )}
                      {scholarship.application_url && (
                        <a
                          href={scholarship.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 mt-1"
                        >
                          Apply Now <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {scholarship.eligibility_criteria && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-3">{scholarship.eligibility_criteria}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Scholarships Available
            </h3>
            <p className="text-gray-500 mb-6">
              There are currently no scholarships listed for {college.name}.
            </p>
            <Link
              href="/scholarships"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition"
            >
              Browse All Scholarships
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Additional Resources */}
        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            Additional Resources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/scholarships"
              className="flex items-center gap-3 bg-white rounded-xl p-4 hover:shadow-md transition border border-gray-200"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">All Scholarships</p>
                <p className="text-xs text-gray-500">Browse scholarships across all colleges</p>
              </div>
            </Link>
            {college.official_url && (
              <a
                href={college.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white rounded-xl p-4 hover:shadow-md transition border border-gray-200"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Official Website</p>
                  <p className="text-xs text-gray-500">Visit college official website</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}