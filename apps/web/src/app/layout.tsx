import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import AppChrome from '@/components/AppChrome'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CareerGuide — Find Your Perfect Career Path with AI',
  description: 'Discover careers, explore colleges, find entrance exams and get personalised career recommendations based on your interests and skills. India\'s smartest career guidance platform.',
  keywords: 'career guidance, career counseling, career options, colleges, entrance exams, scholarships, AI career recommendations, Indian students',
  authors: [{ name: 'CareerGuide' }],
  creator: 'CareerGuide',
  publisher: 'CareerGuide',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://careerguide.com',
    title: 'CareerGuide — AI-Powered Career Guidance for Indian Students',
    description: 'Discover your perfect career path with AI. Explore 80+ careers, 500+ colleges, and 50+ entrance exams.',
    siteName: 'CareerGuide',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareerGuide — AI-Powered Career Guidance',
    description: 'Discover your perfect career path with AI.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  )
}
