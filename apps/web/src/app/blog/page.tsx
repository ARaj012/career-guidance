'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Calendar, Clock, Tag, Search, FileText } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  category: string
  cover_image: string | null
  tags: string[]
  published_at: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      setPosts(data as BlogPost[] || [])
      setLoading(false)
    }
    fetchPosts()
  }, [supabase])

  const categories = [
    { label: 'All Topics', value: 'all' },
    { label: 'Career Tips', value: 'career_tips' },
    { label: 'Exam Prep', value: 'exam_prep' },
    { label: 'Industry News', value: 'industry_news' },
    { label: 'Success Stories', value: 'success_stories' },
    { label: 'Study Tips', value: 'study_tips' },
  ]

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      career_tips: { bg: 'bg-blue-50', text: 'text-blue-700' },
      exam_prep: { bg: 'bg-green-50', text: 'text-green-700' },
      industry_news: { bg: 'bg-purple-50', text: 'text-purple-700' },
      success_stories: { bg: 'bg-orange-50', text: 'text-orange-700' },
      study_tips: { bg: 'bg-teal-50', text: 'text-teal-700' },
    }
    return colors[category] || { bg: 'bg-gray-50', text: 'text-gray-700' }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'No date'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-12 text-white">
        <h1 className="text-4xl font-extrabold mb-2">Career Guide Blog</h1>
        <p className="text-purple-100 text-lg">Expert tips, industry insights, and success stories to guide your career journey</p>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    selectedCategory === cat.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const catColor = getCategoryColor(post.category)
            return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
                  {post.cover_image && (
                    <div className="h-48 bg-gradient-to-br from-purple-100 to-indigo-100">
                      <img 
                        src={post.cover_image} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${catColor.bg} ${catColor.text}`}>
                        {post.category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.published_at as string | null)}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">By {post.author}</span>
                      <span className="text-xs text-purple-600 font-medium">Read more →</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">Check back later for new content</p>
          </div>
        )}
      </div>
    </main>
  )
}
