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
  Sparkles,
  Info,
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

  const collegeScholarships: any[] = scholarshipsRaw ?? [];

  // Get user profile for personalization
  let userProfile: any = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("state, stream, current_education, class_level, class10_state, class12_state, belonging_state")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      userProfile = {
        state: profile.state,
        stream: profile.stream,
        current_education: profile.current_education,
        class_level: profile.class_level,
        class10_state: profile.class10_state,
        class12_state: profile.class12_state,
        belonging_state: profile.belonging_state,
      };
    }
  }

  // Get state-specific scholarships for the user's state (if logged in)
  let stateScholarships: any[] = [];
  if (userProfile?.belonging_state) {
    const { data: stateScholarshipsRaw } = await supabase
      .from("scholarships")
      .select("*")
      .eq("scholarship_state", userProfile.belonging_state)
      .eq("is_active", true)
      .order("amount_max", { ascending: false, nullsFirst: false });
    
    stateScholarships = stateScholarshipsRaw ?? [];
  }

  // Normalize state names for better matching
  const normalizeStateName = (state: string | null | undefined): string => {
    if (!state) return '';
    return state
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace('state', '')
      .trim();
  };

  // Check if a scholarship is available to everyone (national/universal)
  const isUniversalScholarship = (scholarship: any): boolean => {
    const state = scholarship.scholarship_state?.toLowerCase().trim();
    return !state || 
           state === 'all states' || 
           state === 'all india' || 
           state === 'national' ||
           state === 'pan india' ||
           state === 'all' ||
           state === 'everywhere';
  };

  // Categorize college scholarships
  const categorizedCollegeScholarships = {
    stateSpecific: [] as any[],
    national: [] as any[],
    fieldSpecific: [] as any[],
  };

  collegeScholarships.forEach((scholarship: any) => {
    // Check if this is a universal/national scholarship
    if (isUniversalScholarship(scholarship)) {
      // Universal scholarship - categorize based on match_type or put in national
      if (scholarship.match_type === 'field_specific') {
        categorizedCollegeScholarships.fieldSpecific.push(scholarship);
      } else {
        categorizedCollegeScholarships.national.push(scholarship);
      }
      return; // Skip the state-specific logic
    }

    // For state-specific scholarships, check eligibility
    const scholarshipState = normalizeStateName(scholarship.scholarship_state);

    // Normalize student states for comparison
    const studentStates = [
      userProfile?.belonging_state,
      userProfile?.class10_state,
      userProfile?.class12_state,
      userProfile?.state,
    ]
      .filter(Boolean)
      .map(normalizeStateName)
      .filter((s) => s.length > 0);

    // State-specific scholarship
    const isEligible = studentStates.some((studentState) => {
      // Direct match
      if (studentState === scholarshipState) return true;
      // Partial match (e.g., "bihar" matches "bihar state")
      if (studentState.includes(scholarshipState) || scholarshipState.includes(studentState)) return true;
      return false;
    });

    if (isEligible) {
      categorizedCollegeScholarships.stateSpecific.push(scholarship);
    } else {
      // State-specific but doesn't match student's state
      categorizedCollegeScholarships.stateSpecific.push({ ...scholarship, notEligible: true });
    }
  });

  // Calculate total eligible scholarships (college + state)
  const totalEligible = 
    categorizedCollegeScholarships.stateSpecific.filter((s: any) => !s.notEligible).length +
    categorizedCollegeScholarships.national.length +
    categorizedCollegeScholarships.fieldSpecific.length +
    stateScholarships.length;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <Link
            href={`/colleges/${slug}`}
            className="text-emerald-200 hover:text-white text-xs sm:text-sm inline-flex items-center gap-1 mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back to College
          </Link>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 break-words">
                Scholarships for {college.name}
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm md:text-base">
                {college.city}, {college.state}
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur rounded-2xl shrink-0">
              <Award className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {collegeScholarships.length + stateScholarships.length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Total Scholarships</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {totalEligible}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Eligible</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {collegeScholarships.length > 0
                    ? `₹${Math.max(...collegeScholarships.map((s: any) => s.amount_max || 0)).toLocaleString('en-IN')}`
                    : 'N/A'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Max Amount</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {new Set([...collegeScholarships, ...stateScholarships].map((s: any) => s.level)).size}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Education Levels</p>
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Info className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-blue-900 text-xs sm:text-sm mb-1">How Eligibility is Determined</h4>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                <li>• <strong>College-Specific:</strong> Scholarships specifically linked to this college</li>
                <li>• <strong>State-Specific:</strong> Scholarships matching your domicile state</li>
                <li>• <strong>National/Universal:</strong> Available to all students (e.g., "All States", "All India")</li>
                <li>• <strong>Field-Specific:</strong> Based on your field of study and education level</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scholarship List */}
        {collegeScholarships.length > 0 || stateScholarships.length > 0 ? (
          <div className="space-y-6 overflow-x-hidden">
            {/* State-Specific Scholarships */}
            {categorizedCollegeScholarships.stateSpecific.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 overflow-hidden">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  <span>State-Specific Scholarships</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-500">
                    ({categorizedCollegeScholarships.stateSpecific.filter((s: any) => !s.notEligible).length} eligible out of {categorizedCollegeScholarships.stateSpecific.length})
                  </span>
                </h3>
                <div className="space-y-4">
                  {categorizedCollegeScholarships.stateSpecific.map((scholarship: any) => (
                    <div
                      key={scholarship.link_id}
                      className={`border rounded-xl p-3 sm:p-4 hover:shadow-md transition ${
                        scholarship.notEligible
                          ? 'border-gray-200 bg-gray-50 opacity-75'
                          : 'border-emerald-200 bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                              {scholarship.scholarship_name}
                            </h4>
                            {scholarship.notEligible && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full self-start">
                                Not Eligible
                              </span>
                            )}
                            {!scholarship.notEligible && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full self-start flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Eligible
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">{scholarship.provider}</p>
                          {scholarship.scholarship_state && (
                            <p className="text-xs text-gray-500 mt-1">
                              State: <span className="font-medium">{scholarship.scholarship_state}</span>
                            </p>
                          )}
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
                        <div className="text-right sm:text-left">
                          {scholarship.amount_max && (
                            <p className="text-lg sm:text-xl font-bold text-emerald-600">
                              ₹{scholarship.amount_max.toLocaleString('en-IN')}
                            </p>
                          )}
                          {scholarship.application_url && !scholarship.notEligible && (
                            <a
                              href={scholarship.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 mt-1"
                            >
                              Apply Now <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {scholarship.application_url && scholarship.notEligible && (
                            <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-400 mt-1">
                              Not Eligible
                            </span>
                          )}
                        </div>
                      </div>
                      {scholarship.eligibility_criteria && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-3 break-words">{scholarship.eligibility_criteria}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* State-Specific Scholarships for Your Domicile */}
            {stateScholarships.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200 p-4 sm:p-6 overflow-hidden">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <span>Scholarships for {userProfile?.belonging_state}</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-500">
                    ({stateScholarships.length} schemes available)
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  These are government schemes specifically for {userProfile?.belonging_state} residents that you may be eligible for.
                </p>
                <div className="space-y-4">
                  {stateScholarships.map((scholarship: any) => (
                    <div
                      key={scholarship.id}
                      className="border border-orange-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition bg-white"
                    >
                      <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                              {scholarship.name}
                            </h4>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full self-start flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Eligible
                            </span>
                          </div>
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
                        <div className="text-right sm:text-left">
                          {scholarship.amount_max && (
                            <p className="text-lg sm:text-xl font-bold text-orange-600">
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
                        <p className="text-xs sm:text-sm text-gray-600 mt-3 break-words">{scholarship.eligibility_criteria}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* National Scholarships */}
            {categorizedCollegeScholarships.national.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 overflow-hidden">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span>National Scholarships</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-500">
                    ({categorizedCollegeScholarships.national.length} available)
                  </span>
                </h3>
                <div className="space-y-4">
                  {categorizedCollegeScholarships.national.map((scholarship: any) => (
                    <div
                      key={scholarship.link_id}
                      className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition"
                    >
                      <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{scholarship.scholarship_name}</h4>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full self-start flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Eligible
                            </span>
                          </div>
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
                        <div className="text-right sm:text-left">
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
                        <p className="text-xs sm:text-sm text-gray-600 mt-3 break-words">{scholarship.eligibility_criteria}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Field-Specific Scholarships */}
            {categorizedCollegeScholarships.fieldSpecific.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 overflow-hidden">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span>Field-Specific Scholarships</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-500">
                    ({categorizedCollegeScholarships.fieldSpecific.length} available)
                  </span>
                </h3>
                <div className="space-y-4">
                  {categorizedCollegeScholarships.fieldSpecific.map((scholarship: any) => (
                    <div
                      key={scholarship.link_id}
                      className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition"
                    >
                      <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{scholarship.scholarship_name}</h4>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full self-start flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Eligible
                            </span>
                          </div>
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
                        <div className="text-right sm:text-left">
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
                        <p className="text-xs sm:text-sm text-gray-600 mt-3 break-words">{scholarship.eligibility_criteria}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center">
            <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No Scholarships Available
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6">
              There are currently no scholarships listed for {college.name}.
            </p>
            {!userProfile?.belonging_state && (
              <p className="text-sm text-gray-500 mb-4">
                <Link href="/profile" className="text-indigo-600 hover:underline">
                  Update your profile
                </Link>
                {' '}to see state-specific scholarships for your domicile.
              </p>
            )}
            <Link
              href="/scholarships"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-emerald-700 transition text-sm sm:text-base"
            >
              Browse All Scholarships
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        )}

        {/* Additional Resources */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
            <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
            Additional Resources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href="/scholarships"
              className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-3 sm:p-4 hover:shadow-md transition border border-gray-200"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">All Scholarships</p>
                <p className="text-xs text-gray-500">Browse scholarships across all colleges</p>
              </div>
            </Link>
            {college.official_url && (
              <a
                href={college.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-3 sm:p-4 hover:shadow-md transition border border-gray-200"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Official Website</p>
                  <p className="text-xs text-gray-500">Visit college official website</p>
                </div>
              </a>
            )}
            {userProfile?.belonging_state && (
              <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Your State: {userProfile.belonging_state}</p>
                  <p className="text-xs text-gray-500">State-specific schemes shown above</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}