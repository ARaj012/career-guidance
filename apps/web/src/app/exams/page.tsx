import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function ExamsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: exams } = await supabase
    .from("exams")
    .select(
      `
      *,
      exam_schedules (
        registration_start,
        registration_end,
        exam_date_start,
        result_date,
        year
      ),
      exam_eligibility (
        min_percentage,
        class_required,
        stream_required,
        age_min,
        age_max
      )
    `,
    )
    .order("name");

  const categories = [
    { label: "All", value: "all" },
    { label: "Engineering", value: "engineering" },
    { label: "Medical", value: "medical" },
    { label: "Government", value: "government" },
    { label: "Banking", value: "banking" },
    { label: "Management", value: "management" },
    { label: "Law", value: "law" },
    { label: "Defence", value: "defence" },
    { label: "Research", value: "research" },
  ];

  const getCategoryColor = (name: string) => {
    const n = name.toLowerCase();
    if (
      n.includes("jee") ||
      n.includes("gate") ||
      n.includes("bitsat") ||
      n.includes("cet") ||
      n.includes("eamcet") ||
      n.includes("wbjee") ||
      n.includes("vit") ||
      n.includes("srm") ||
      n.includes("comedk")
    )
      return { bg: "bg-blue-50", text: "text-blue-700", label: "Engineering" };
    if (
      n.includes("neet") ||
      n.includes("aiims") ||
      n.includes("jipmer") ||
      n.includes("pgimer") ||
      n.includes("mbbs")
    )
      return { bg: "bg-red-50", text: "text-red-700", label: "Medical" };
    if (
      n.includes("upsc") ||
      n.includes("ssc") ||
      n.includes("ias") ||
      n.includes("psc") ||
      n.includes("rrb") ||
      n.includes("railway") ||
      n.includes("epfo") ||
      n.includes("fci")
    )
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        label: "Government",
      };
    if (
      n.includes("ibps") ||
      n.includes("sbi") ||
      n.includes("rbi") ||
      n.includes("nabard") ||
      n.includes("lic") ||
      n.includes("bank")
    )
      return { bg: "bg-green-50", text: "text-green-700", label: "Banking" };
    if (
      n.includes("cat") ||
      n.includes("xat") ||
      n.includes("snap") ||
      n.includes("mat") ||
      n.includes("gmat") ||
      n.includes("mba")
    )
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: "Management",
      };
    if (
      n.includes("clat") ||
      n.includes("ailet") ||
      n.includes("lsat") ||
      n.includes("llb") ||
      n.includes("law")
    )
      return { bg: "bg-yellow-50", text: "text-yellow-700", label: "Law" };
    if (
      n.includes("nda") ||
      n.includes("cds") ||
      n.includes("afcat") ||
      n.includes("coast") ||
      n.includes("mns") ||
      n.includes("capf")
    )
      return { bg: "bg-gray-100", text: "text-gray-700", label: "Defence" };
    if (
      n.includes("csir") ||
      n.includes("ugc") ||
      n.includes("gate") ||
      n.includes("jam") ||
      n.includes("jest") ||
      n.includes("tifr") ||
      n.includes("iat") ||
      n.includes("icar") ||
      n.includes("dbt") ||
      n.includes("icmr") ||
      n.includes("isro") ||
      n.includes("barc") ||
      n.includes("drdo") ||
      n.includes("kvpy") ||
      n.includes("ntse")
    )
      return { bg: "bg-teal-50", text: "text-teal-700", label: "Research" };
    if (
      n.includes("ca ") ||
      n.includes("cma") ||
      n.includes("cs ") ||
      n.includes("cfa") ||
      n.includes("frm") ||
      n.includes("sebi") ||
      n.includes("nism")
    )
      return { bg: "bg-indigo-50", text: "text-indigo-700", label: "Finance" };
    if (
      n.includes("nift") ||
      n.includes("nid") ||
      n.includes("uceed") ||
      n.includes("ceed") ||
      n.includes("nata")
    )
      return { bg: "bg-pink-50", text: "text-pink-700", label: "Design" };
    return { bg: "bg-gray-50", text: "text-gray-700", label: "Other" };
  };

  const getModeIcon = (mode: string) => {
    if (mode === "Online") return "💻";
    if (mode === "Offline") return "📝";
    return "💻📝";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "TBA";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
          CareerGuide
        </Link>
        <div className="flex gap-6">
          <Link
            href="/careers"
            className="text-gray-600 hover:text-indigo-600 text-sm"
          >
            Careers
          </Link>
          <Link
            href="/recommend"
            className="text-gray-600 hover:text-indigo-600 text-sm"
          >
            Recommend
          </Link>
          <Link
            href="/colleges"
            className="text-gray-600 hover:text-indigo-600 text-sm"
          >
            Colleges
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-8 py-12 text-white">
        <h1 className="text-4xl font-extrabold mb-2">Entrance Exams</h1>
        <p className="text-indigo-100 text-lg">{exams?.length ?? 0}+ exams with dates, eligibility and official links</p>
        {/* Stats */}
        <div className="flex gap-8 mt-6">
          {[
            { label: "Total Exams", value: `${exams?.length ?? 0}+` },
            {
              label: "National Level",
              value: `${exams?.filter((e) => e.exam_level === "National").length ?? 0}+`,
            },
            {
              label: "State Level",
              value: `${exams?.filter((e) => e.exam_level === "State").length ?? 0}+`,
            },
            {
              label: "International",
              value: `${exams?.filter((e) => e.exam_level === "International").length ?? 0}+`,
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-indigo-200 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Exam Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams?.map((exam) => {
            const cat = getCategoryColor(exam.name);
            const schedule = exam.exam_schedules?.[0];
            const eligibility = exam.exam_eligibility?.[0];

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${cat.bg} ${cat.text}`}
                  >
                    {cat.label}
                  </span>
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {getModeIcon(exam.mode)} {exam.mode}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        exam.exam_level === "National"
                          ? "bg-blue-100 text-blue-700"
                          : exam.exam_level === "State"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {exam.exam_level}
                    </span>
                  </div>
                </div>

                {/* Name & Body — clicking navigates to the exam detail page */}
                <Link href={`/exams/${exam.slug}`} className="group">
                  <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition">
                    {exam.name}
                  </h2>
                </Link>
                <p className="text-xs text-indigo-600 font-medium mb-2">
                  {exam.conducting_body}
                </p>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {exam.description}
                </p>

                {/* Schedule */}
                {schedule && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      📅 {schedule.year ?? ""} Schedule
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Registration</span>
                      <span className="font-medium text-gray-700">
                        {formatDate(schedule.registration_start)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Exam Date</span>
                      <span className="font-medium text-indigo-600">
                        {formatDate(schedule.exam_date_start)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Result</span>
                      <span className="font-medium text-green-600">
                        {formatDate(schedule.result_date)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Eligibility */}
                {eligibility && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                      {eligibility.class_required}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      {eligibility.stream_required}
                    </span>
                    {eligibility.min_percentage && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        Min {eligibility.min_percentage}%
                      </span>
                    )}
                    {eligibility.age_max && (
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">
                        Age: {eligibility.age_min}-{eligibility.age_max}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                  <Link
                    href={`/exams/${exam.slug}`}
                    className="text-xs text-indigo-600 font-medium hover:underline"
                  >
                    View Details →
                  </Link>
                  <a
                    href={exam.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Official Site
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
