import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { calculateStrain, calculateRecovery, calculateBMI, calculateStreak } from './flux-logic'

// ============================================================================
// Property-Based Tests (fast-check)
// ============================================================================

describe('calculateStrain — property-based', () => {
  it('always returns a value between 0 and 21 for any non-negative inputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 600, noNaN: true }), // durationMinutes
        fc.float({ min: 0, max: 10, noNaN: true }), // intensity
        (duration, intensity) => {
          const result = calculateStrain(duration, intensity)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(21)
        }
      ),
      { numRuns: 500 }
    )
  })

  it('is monotonically non-decreasing as duration increases (fixed intensity)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 300, noNaN: true }), // d1
        fc.float({ min: 0, max: 300, noNaN: true }), // delta (d2 = d1 + delta)
        fc.float({ min: Math.fround(0.1), max: 10, noNaN: true }), // intensity > 0
        (d1, delta, intensity) => {
          const d2 = d1 + Math.abs(delta)
          expect(calculateStrain(d2, intensity)).toBeGreaterThanOrEqual(
            calculateStrain(d1, intensity)
          )
        }
      ),
      { numRuns: 300 }
    )
  })

  it('is monotonically non-decreasing as intensity increases (fixed duration)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: 300, noNaN: true }), // duration > 0
        fc.float({ min: 0, max: 5, noNaN: true }), // i1
        fc.float({ min: 0, max: 5, noNaN: true }), // delta
        (duration, i1, delta) => {
          const i2 = i1 + Math.abs(delta)
          expect(calculateStrain(duration, i2)).toBeGreaterThanOrEqual(
            calculateStrain(duration, i1)
          )
        }
      ),
      { numRuns: 300 }
    )
  })

  it('returns 0 when duration is 0', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 10, noNaN: true }), intensity => {
        expect(calculateStrain(0, intensity)).toBe(0)
      })
    )
  })

  it('returns 0 when intensity is 0', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 600, noNaN: true }), duration => {
        expect(calculateStrain(duration, 0)).toBe(0)
      })
    )
  })

  it('asymptotically approaches 21 for extreme inputs', () => {
    const result = calculateStrain(1000, 10)
    expect(result).toBeGreaterThan(20)
    expect(result).toBeLessThanOrEqual(21)
  })
})

describe('calculateRecovery — property-based', () => {
  it('always returns a value between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 24, noNaN: true }), // sleepHours
        fc.float({ min: 40, max: 120, noNaN: true }), // restingHR
        fc.float({ min: 1, max: 10, noNaN: true }), // energyLevel
        (sleep, hr, energy) => {
          const result = calculateRecovery(sleep, hr, energy)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(100)
        }
      ),
      { numRuns: 500 }
    )
  })

  it('increases with more sleep (fixed HR and energy)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 8, noNaN: true }), // s1
        fc.float({ min: 0, max: 8, noNaN: true }), // delta
        fc.float({ min: 50, max: 90, noNaN: true }), // restingHR
        fc.float({ min: 1, max: 10, noNaN: true }), // energyLevel
        (s1, delta, hr, energy) => {
          const s2 = s1 + Math.abs(delta)
          expect(calculateRecovery(s2, hr, energy)).toBeGreaterThanOrEqual(
            calculateRecovery(s1, hr, energy)
          )
        }
      ),
      { numRuns: 300 }
    )
  })

  it('decreases with higher resting HR (fixed sleep and energy)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 4, max: 10, noNaN: true }), // sleepHours
        fc.float({ min: 50, max: 90, noNaN: true }), // hr1
        fc.float({ min: 0, max: 30, noNaN: true }), // delta
        fc.float({ min: 1, max: 10, noNaN: true }), // energyLevel
        (sleep, hr1, delta, energy) => {
          const hr2 = hr1 + Math.abs(delta)
          expect(calculateRecovery(sleep, hr2, energy)).toBeLessThanOrEqual(
            calculateRecovery(sleep, hr1, energy)
          )
        }
      ),
      { numRuns: 300 }
    )
  })
})

describe('calculateBMI — property-based', () => {
  it('returns 0 for non-positive inputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -100, max: 0, noNaN: true }),
        fc.float({ min: 50, max: 250, noNaN: true }),
        (weight, height) => {
          expect(calculateBMI(weight, height)).toBe(0)
        }
      )
    )
  })

  it('returns a positive value for positive inputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 30, max: 300, noNaN: true }), // weightKg
        fc.float({ min: 100, max: 250, noNaN: true }), // heightCm
        (weight, height) => {
          const bmi = calculateBMI(weight, height)
          expect(bmi).toBeGreaterThan(0)
        }
      ),
      { numRuns: 300 }
    )
  })

  it('increases linearly with weight (fixed height)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 30, max: 150, noNaN: true }), // w1
        fc.float({ min: Math.fround(0.1), max: 100, noNaN: true }), // delta
        fc.float({ min: 140, max: 210, noNaN: true }), // heightCm
        (w1, delta, height) => {
          const w2 = w1 + Math.abs(delta)
          expect(calculateBMI(w2, height)).toBeGreaterThanOrEqual(calculateBMI(w1, height))
        }
      ),
      { numRuns: 300 }
    )
  })
})

// ============================================================================
// Deterministic Edge-Case Tests
// ============================================================================

describe('calculateStrain — edge cases', () => {
  it('30 min at intensity 5 produces moderate strain', () => {
    const result = calculateStrain(30, 5)
    expect(result).toBeGreaterThan(3)
    expect(result).toBeLessThan(15)
  })

  it('120 min at intensity 9 produces high strain', () => {
    const result = calculateStrain(120, 9)
    expect(result).toBeGreaterThan(15)
  })
})

describe('calculateStreak — deterministic', () => {
  it('returns 0 for empty array', () => {
    expect(calculateStreak([])).toBe(0)
  })

  it('returns 1 for a single date matching today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(calculateStreak([today])).toBe(1)
  })

  it('counts consecutive days correctly', () => {
    const dates = [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() - 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    ]
    expect(calculateStreak(dates)).toBe(3)
  })

  it('handles Firestore timestamp objects', () => {
    const now = Math.floor(Date.now() / 1000)
    const result = calculateStreak([{ seconds: now }, { seconds: now - 86400 }])
    expect(result).toBe(2)
  })
})
