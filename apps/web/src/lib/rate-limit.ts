// apps/web/src/lib/rate-limit.ts
//
// Simple in-memory rate limiter for the public chat endpoint. Tracks
// request timestamps per IP address across two windows:
//   - a short "burst" window, to stop rapid-fire spam
//   - a "daily" window, to protect the shared Groq free-tier quota from
//     one visitor using up everyone else's allowance
//
// LIMITATION — read before deploying: this state lives in server memory,
// so it resets whenever the server restarts, and it is NOT shared across
// multiple server instances. That's fine for a single traditional Node
// server (e.g. one long-running `next start` process), but if you deploy
// to a serverless platform (Vercel, etc.) where each request can hit a
// different instance, this won't reliably enforce limits at scale. If
// this chatbot gets real traffic, swap this for a shared store like
// Upstash Redis (`@upstash/ratelimit`) instead — same interface, just
// backed by a database instead of a Map.

type Store = Map<string, number[]>

const burstStore: Store = new Map()
const dailyStore: Store = new Map()

const BURST_MAX = 8 // requests
const BURST_WINDOW_MS = 60_000 // per 1 minute

const DAILY_MAX = 50 // requests
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000 // per 24 hours

function checkWindow(
  store: Store,
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= max) {
    const oldest = timestamps[0]
    const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000)
    store.set(key, timestamps)
    return { allowed: false, retryAfterSeconds }
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return { allowed: true, retryAfterSeconds: 0 }
}

export function checkRateLimit(ip: string): {
  allowed: boolean
  retryAfterSeconds: number
  reason?: 'burst' | 'daily'
} {
  const burst = checkWindow(burstStore, ip, BURST_MAX, BURST_WINDOW_MS)
  if (!burst.allowed) {
    return { allowed: false, retryAfterSeconds: burst.retryAfterSeconds, reason: 'burst' }
  }

  const daily = checkWindow(dailyStore, ip, DAILY_MAX, DAILY_WINDOW_MS)
  if (!daily.allowed) {
    return { allowed: false, retryAfterSeconds: daily.retryAfterSeconds, reason: 'daily' }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

// Extracts the best-effort client IP from standard proxy headers.
// Works behind Vercel, most reverse proxies, and localhost dev.
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
