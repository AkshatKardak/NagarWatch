import { describe, it, expect } from 'vitest'
import { getStatusColor, getCategoryLabel, getPriorityColor } from '@/lib/utils'

describe('Civic Helpers and Status Logic', () => {
  it('returns correct status badge colors', () => {
    expect(getStatusColor('pending')).toContain('red')
    expect(getStatusColor('in_progress')).toContain('orange')
    expect(getStatusColor('resolved')).toContain('green')
  })

  it('formats category labels nicely', () => {
    expect(getCategoryLabel('pothole')).toBe('Pothole')
    expect(getCategoryLabel('streetlight')).toBe('Streetlight')
    expect(getCategoryLabel('garbage')).toBe('Garbage Dump')
  })

  it('returns appropriate priority styling', () => {
    expect(getPriorityColor('critical')).toContain('red')
    expect(getPriorityColor('high')).toContain('orange')
  })
})
