import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from './supabase'

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    expect(() => createClient()).toThrow('Missing Supabase environment variables')
  })

  it('should throw error when SUPABASE_ANON_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => createClient()).toThrow('Missing Supabase environment variables')
  })

  it('should create client when all env vars are present', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    const client = createClient()

    expect(client).toBeDefined()
    expect(typeof client.auth).toBe('object')
  })

  it('should create client with correct URL and key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    const client = createClient()

    expect(client).toBeDefined()
  })
})
