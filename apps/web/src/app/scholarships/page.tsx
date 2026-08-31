"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  GraduationCap,
  MapPin,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";

interface Scholarship {
  id: string;
  name: string;
  slug: string;
  description: string;
  provider: string;
  amount_min: number | null;
  amount_max: number | null;
  amount_type: string;
  eligibility_criteria: string;
  application_deadline: string | null;
  application_url: string | null;
  category: string;
  level: string;
  field_of_study: string[];
  country: string;
  state: string;
  is_active: boolean;
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedAmountType, setSelectedAmountType] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchScholarships() {
      const { data } = await supabase
        .from("scholarships")
        .select("*")
        .eq("is_active", true)
        .order("application_deadline", { ascending: true, nullsFirst: false });

      setScholarships((data as Scholarship[]) || []);
      setLoading(false);
    }
    fetchScholarships();
  }, [supabase]);

  const categories = [
    { label: "All Categories", value: "all" },
    { label: "Merit-based", value: "merit" },
    { label: "Need-based", value: "need_based" },
    { label: "Sports", value: "sports" },
    { label: "Arts", value: "arts" },
    { label: "Minority", value: "minority" },
    { label: "Women", value: "women" },
    { label: "General", value: "general" },
  ];

  const levels = [
    { label: "All Levels", value: "all" },
    { label: "School", value: "school" },
    { label: "Undergraduate", value: "undergraduate" },
    { label: "Postgraduate", value: "postgraduate" },
    { label: "PhD", value: "phd" },
  ];

  const amountTypes = [
    { label: "All Types", value: "all" },
    { label: "Fixed Amount", value: "fixed" },
    { label: "Range", value: "range" },
    { label: "Full Tuition", value: "full_tuition" },
    { label: "Partial Tuition", value: "partial_tuition" },
    { label: "Stipend", value: "stipend" },
  ];

  const states = [
    { label: "All States", value: "all" },
    ...Array.from(new Set(scholarships.map((s) => s.state)))
      .sort()
      .map((state) => ({ label: state, value: state })),
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      merit: { bg: "bg-blue-50", text: "text-blue-700" },
      need_based: { bg: "bg-green-50", text: "text-green-700" },
      sports: { bg: "bg-orange-50", text: "text-orange-700" },
      arts: { bg: "bg-purple-50", text: "text-purple-700" },
      minority: { bg: "bg-yellow-50", text: "text-yellow-700" },
      women: { bg: "bg-pink-50", text: "text-pink-700" },
      government: { bg: "bg-emerald-50", text: "text-emerald-700" },
      general: { bg: "bg-gray-50", text: "text-gray-700" },
    };
    return colors[category] || { bg: "bg-gray-50", text: "text-gray-700" };
  };

  const formatAmount = (scholarship: Scholarship) => {
    if (scholarship.amount_type === "full_tuition") return "Full Tuition";
    if (scholarship.amount_type === "partial_tuition") return "Partial Tuition";
    if (scholarship.amount_type === "stipend") return "Stipend";

    if (scholarship.amount_min && scholarship.amount_max) {
      return `₹${(scholarship.amount_min / 100000).toFixed(1)}L - ₹${(scholarship.amount_max / 100000).toFixed(1)}L`;
    }
    if (scholarship.amount_min)
      return `₹${(scholarship.amount_min / 100000).toFixed(1)}L+`;
    if (scholarship.amount_max)
      return `Up to ₹${(scholarship.amount_max / 100000).toFixed(1)}L`;
    return "Amount not specified";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "No deadline";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isDeadlineSoon = (date: string | null) => {
    if (!date) return false;
    const deadline = new Date(date);
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilDeadline <= 30 && daysUntilDeadline > 0;
  };

  const filteredScholarships = scholarships.filter((scholarship) => {
    const matchesSearch =
      searchTerm === "" ||
      scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.eligibility_criteria
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || scholarship.category === selectedCategory;
    const matchesLevel =
      selectedLevel === "all" || scholarship.level === selectedLevel;
    const matchesAmountType =
      selectedAmountType === "all" ||
      scholarship.amount_type === selectedAmountType;
    const matchesState =
      selectedState === "all" || scholarship.state === selectedState;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesAmountType &&
      matchesState
    );
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSelectedAmountType("all");
    setSelectedState("all");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedCategory !== "all" ||
    selectedLevel !== "all" ||
    selectedAmountType !== "all" ||
    selectedState !== "all";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

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
            href="/colleges"
            className="text-gray-600 hover:text-indigo-600 text-sm"
          >
            Colleges
          </Link>
          <Link
            href="/exams"
            className="text-gray-600 hover:text-indigo-600 text-sm"
          >
            Exams
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-12 text-white">
        <h1 className="text-4xl font-extrabold mb-2">
          Scholarships & Financial Aid
        </h1>
        <p className="text-emerald-100 text-lg">
          {scholarships.length}+ scholarships to help fund your education
        </p>
        {/* Stats */}
        <div className="flex gap-8 mt-6">
          {[
            { label: "Total Scholarships", value: `${scholarships.length}+` },
            {
              label: "Merit-based",
              value: `${scholarships.filter((s) => s.category === "merit").length}+`,
            },
            {
              label: "Need-based",
              value: `${scholarships.filter((s) => s.category === "need_based").length}+`,
            },
            {
              label: "Active Applications",
              value: "Apply Now",
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-emerald-200 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search scholarships by name, provider, or eligibility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <Filter className="w-5 h-5" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
              >
                <X className="w-5 h-5" />
                Clear Filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Type
                </label>
                <select
                  value={selectedAmountType}
                  onChange={(e) => setSelectedAmountType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {amountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {states.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredScholarships.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {scholarships.length}
            </span>{" "}
            scholarships
          </p>
        </div>

        {/* Scholarship Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScholarships.map((scholarship) => {
            const catColor = getCategoryColor(scholarship.category);
            const deadlineSoon = isDeadlineSoon(
              scholarship.application_deadline,
            );

            return (
              <div
                key={scholarship.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${catColor.bg} ${catColor.text}`}
                  >
                    {scholarship.category
                      .replace("_", " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                  {deadlineSoon && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                      Deadline Soon
                    </span>
                  )}
                </div>

                {/* Name & Provider */}
                <Link
                  href={`/scholarships/${scholarship.slug}`}
                  className="group"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition">
                    {scholarship.name}
                  </h2>
                </Link>
                <p className="text-xs text-emerald-600 font-medium mb-2">
                  {scholarship.provider}
                </p>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {scholarship.description}
                </p>

                {/* Amount */}
                <div className="bg-emerald-50 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">
                      {formatAmount(scholarship)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span className="capitalize">
                      {scholarship.level
                        .replace("_", " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </div>
                  {scholarship.state && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {scholarship.state}, {scholarship.country}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span
                      className={deadlineSoon ? "text-red-600 font-medium" : ""}
                    >
                      {formatDate(scholarship.application_deadline)}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                  <Link
                    href={`/scholarships/${scholarship.slug}`}
                    className="text-xs text-emerald-600 font-medium hover:underline"
                  >
                    View Details →
                  </Link>
                  {scholarship.application_url && (
                    <a
                      href={scholarship.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-1"
                    >
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredScholarships.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No scholarships found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="text-emerald-600 font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
