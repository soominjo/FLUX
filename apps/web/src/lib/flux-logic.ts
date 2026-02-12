/**
 * FLUX LOGIC LIBRARY
 * Core algorithms for calculating Strain, Recovery, and Readiness.
 */

/**
 * Calculates the Strain Score (0-21) based on workout duration and intensity.
 * @param durationMinutes - Duration of the workout in minutes
 * @param intensity - Perceived intensity (RPE) from 1-10
 * @returns number - Strain Score between 0 and 21
 */
export const calculateStrain = (durationMinutes: number, intensity: number): number => {
  // Base calculation: (Duration * Intensity) / Scale Factor
  // Arbitrary scale factor to map common workouts to a 0-21 scale (similar to Whoop)
  const rawScore = (durationMinutes * intensity) / 40

  // Logarithmic damping to make it harder to reach max score
  // This is a simplified approximation
  const dampenedScore = 21 * (1 - Math.exp(-rawScore / 10))

  return Math.min(Math.max(Number(dampenedScore.toFixed(1)), 0), 21)
}

/**
 * Calculates Recovery % (0-100) based on sleep, resting HR, and perceived energy.
 * @param sleepHours - Hours of sleep
 * @param restingHR - Resting Heart Rate (bpm)
 * @param energyLevel - Perceived energy level (1-10)
 * @returns number - Recovery percentage 0-100
 */
export const calculateRecovery = (
  sleepHours: number,
  restingHR: number,
  energyLevel: number
): number => {
  // 1. Sleep Score (0-40 points)
  // Target: 8 hours = 40 points
  const sleepScore = Math.min((sleepHours / 8) * 40, 40)

  // 2. HR Score (0-40 points)
  // Lower is better. Baseline assumption: 60bpm = 40pts, 80bpm = 20pts
  // Formula: 100 - restingHR (clamped)
  const hrScore = Math.max(Math.min(100 - restingHR, 40), 0)

  // 3. Energy Score (0-20 points)
  // 10 = 20pts
  const energyScore = (energyLevel / 10) * 20

  const totalRecovery = sleepScore + hrScore + energyScore
  return Math.min(Math.max(Math.round(totalRecovery), 0), 100)
}

/**
 * Returns actionable text based on Readiness Score.
 * @param recovery - Recovery Score (0-100)
 * @param strain - Previous Day Strain (0-21)
 * @returns string - Recommendation text
 */
export const getReadinessScore = (recovery: number, strain: number): string => {
  if (recovery >= 80) {
    return 'Prime for Strain. Push yourself today!'
  } else if (recovery >= 50) {
    if (strain > 15) {
      return 'Recovering. Light active recovery recommended.'
    }
    return 'Ready. Maintain output.'
  } else {
    return 'Low Recovery. Focus on rest and sleep.'
  }
}

/**
 * Calculate BMI from weight (kg) and height (cm).
 * Formula: weight / (height_in_meters)^2
 */
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  if (weightKg <= 0 || heightCm <= 0) return 0
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

/**
 * Return the WHO BMI category for a given BMI value.
 */
export const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi <= 0) return { label: '', color: '' }
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' }
  if (bmi < 25) return { label: 'Healthy Weight', color: 'text-emerald-400' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-400' }
  return { label: 'Obese', color: 'text-red-400' }
}

/**
 * Calculates current streak of consecutive days with activity.
 * @param dates - Array of Date objects or date strings/timestamps representing activity.
 * @returns number - Current streak count
 */
export const calculateStreak = (dates: (Date | string | { seconds: number })[]): number => {
  if (!dates || dates.length === 0) return 0

  // Normalize dates to YYYY-MM-DD
  const uniqueDates = new Set(
    dates.map(d => {
      const dateObj =
        typeof d === 'object' && d !== null && 'seconds' in d
          ? new Date(d.seconds * 1000)
          : new Date(d as string | Date)
      return dateObj.toISOString().split('T')[0]
    })
  )

  const sortedDates = Array.from(uniqueDates).sort().reverse() // Newest first

  if (sortedDates.length === 0) return 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // If no activity today or yesterday, streak is 0 (or could be broken)
  // Logic: Streak continues if latest activity is today OR yesterday.
  const latest = sortedDates[0]
  if (latest !== today && latest !== yesterday) {
    return 0
  }

  let streak = 0

  // Iterate backwards to count consecutive days
  for (let i = 0; i < sortedDates.length; i++) {
    // In our sorted unique list, if the streak is unbroken,
    // we expect the date at index i to match our checkDateString.
    // However, since we might skip today if latest is yesterday, we need to be careful.
    // Simpler approach: Check if sortedDates includes the expected date.

    // Better Logic:
    // 1. Start from 'latest' (which is today or yesterday).
    // 2. Count backwards.

    // Actually simpler: iterate through sortedDates.
    // The difference between date[i] and date[i+1] must be 1 day.

    if (i === 0) {
      streak = 1
      continue
    }

    const prevDate = new Date(sortedDates[i - 1])
    const thisDate = new Date(sortedDates[i])

    const diffTime = Math.abs(prevDate.getTime() - thisDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}
