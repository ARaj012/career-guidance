import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Metadata } from 'next'
import { Calendar, Clock, Tag, ArrowLeft, Share2 } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  
  // Try the slug as-is first
  let { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, author, category, published_at, cover_image, is_published')
    .eq('slug', slug)
    .maybeSingle()

  // If not found, try replacing underscores with hyphens
  if (!post && slug.includes('_')) {
    const altSlug = slug.replace(/_/g, '-')
    const { data: altPost } = await supabase
      .from('blog_posts')
      .select('title, excerpt, author, category, published_at, cover_image, is_published')
      .eq('slug', altSlug)
      .maybeSingle()
    if (altPost) post = altPost
  }

  if (!post || !post.is_published) {
    return {
      title: 'Blog Post Not Found | CareerGuide',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  const publishDate = post.published_at ? new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const description = post.excerpt || post.title
  const categoryLabel = post.category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())

  return {
    title: `${post.title} | CareerGuide Blog`,
    description,
    keywords: `${post.title}, ${categoryLabel}, career guidance, ${post.author}, ${publishDate}, blog`,
    openGraph: {
      type: 'article',
      locale: 'en_IN',
      url: `https://careerguide.com/blog/${slug}`,
      title: post.title,
      description,
      images: post.cover_image ? [{ url: post.cover_image, width: 1200, height: 630, alt: post.title }] : [],
      siteName: 'CareerGuide',
      publishedTime: post.published_at,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.cover_image ? [post.cover_image] : [],
    },
    alternates: {
      canonical: `https://careerguide.com/blog/${slug}`,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!post || !post.is_published) {
    notFound()
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'No date'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

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

  const catColor = getCategoryColor(post.category)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-8 py-12 text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog" className="text-purple-200 hover:text-white text-sm flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          <div className="mt-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${catColor.bg} ${catColor.text}`}>
              {post.category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{post.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-purple-100">
            <span className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(post.published_at)}
            </span>
            <span className="text-sm">By {post.author}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Cover Image */}
        {post.cover_image && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img 
              src={post.cover_image} 
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-500 italic mb-6">{post.excerpt}</p>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string, index: number) => (
                  <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <Link href="/blog" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              ← Back to all articles
            </Link>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
