import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security Proxy
 * 
 * This proxy adds:
 * - Security headers (HSTS, XSS protection, etc.)
 * - CORS configuration for API routes
 * - Handles preflight OPTIONS requests
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
    ]
    
    const origin = request.headers.get('origin')
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }

    // CSRF protection for mutation methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const referer = request.headers.get('referer')
      const host = request.headers.get('host')
      
      if (!referer || !host) {
        return new NextResponse('Missing required headers', { status: 400 })
      }
      
      const refererUrl = new URL(referer)
      if (refererUrl.host !== host) {
        return new NextResponse('Invalid referer', { status: 403 })
      }
    }
  }

  return response
}

export const config = {
  matcher: '/:path*',
}
