import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getClientIp } from './rate-limit'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear the stores before each test
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within burst limit', () => {
      const result = checkRateLimit('127.0.0.1')

      expect(result.allowed).toBe(true)
      expect(result.retryAfterSeconds).toBe(0)
    })

    it('should block requests exceeding burst limit', () => {
      // Make 8 requests (burst limit)
      for (let i = 0; i < 8; i++) {
        checkRateLimit('127.0.0.1')
      }

      // 9th request should be blocked
      const result = checkRateLimit('127.0.0.1')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('burst')
      expect(result.retryAfterSeconds).toBeGreaterThan(0)
    })

    it('should allow requests from different IPs independently', () => {
      // Make 8 requests from IP1
      for (let i = 0; i < 8; i++) {
        checkRateLimit('192.168.1.1')
      }

      // IP2 should still be allowed
      const result = checkRateLimit('192.168.1.2')

      expect(result.allowed).toBe(true)
    })

    it('should reset burst limit after window expires', () => {
      // Make 8 requests
      for (let i = 0; i < 8; i++) {
        checkRateLimit('127.0.0.1')
      }

      // Should be blocked
      let result = checkRateLimit('127.0.0.1')
      expect(result.allowed).toBe(false)

      // Advance time past the burst window (60 seconds)
      vi.advanceTimersByTime(61000)

      // Should be allowed again
      result = checkRateLimit('127.0.0.1')
      expect(result.allowed).toBe(true)
    })

    it('should enforce daily limit', () => {
      // Make 8 requests (burst limit first)
      for (let i = 0; i < 8; i++) {
        checkRateLimit('127.0.0.1')
      }

      // Then make 42 more to reach daily limit (50 total)
      for (let i = 0; i < 42; i++) {
        // Advance time past burst window to allow more requests
        vi.advanceTimersByTime(61000)
        checkRateLimit('127.0.0.1')
      }

      // 51st request should be blocked by daily limit
      const result = checkRateLimit('127.0.0.1')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('daily')
    })
  })

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1')

      const ip = getClientIp(headers)

      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const headers = new Headers()
      headers.set('x-real-ip', '192.168.1.1')

      const ip = getClientIp(headers)

      expect(ip).toBe('192.168.1.1')
    })

    it('should return unknown when no headers present', () => {
      const headers = new Headers()

      const ip = getClientIp(headers)

      expect(ip).toBe('unknown')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.1')
      headers.set('x-real-ip', '10.0.0.1')

      const ip = getClientIp(headers)

      expect(ip).toBe('192.168.1.1')
    })
  })
})
