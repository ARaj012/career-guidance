import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    })

    it('should handle undefined and null', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2')
    })

    it('should handle empty strings', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2')
    })

    it('should handle Tailwind conflict resolution', () => {
      expect(cn('px-4', 'px-8')).toBe('px-8')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('should handle objects with boolean values', () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3')
    })
  })
})
