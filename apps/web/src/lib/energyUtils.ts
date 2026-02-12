// ─── Mifflin-St Jeor BMR & TDEE Calculator ────────────────────────────
// The "brain" behind FLUX: links calorie needs to activity output.

export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'
export type Goal = 'lose' | 'maintain' | 'gain'

export interface MacroTargets {
  calories: number
  protein: number
  fat: number
  carbs: number
}

/** Basal Metabolic Rate via Mifflin-St Jeor */
export const calculateBMR = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number => {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
}

const GOAL_OFFSETS: Record<string, number> = {
  lose: -500,
  gain: 500,
  maintain: 0,
}

/** Daily calorie target = BMR × activity multiplier ± goal offset */
export const calculateTarget = (bmr: number, activityLevel: string, goal: Goal): number => {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.moderate
  const offset = GOAL_OFFSETS[goal] ?? 0
  return Math.round(bmr * multiplier + offset)
}

// ─── MET-based Calorie Burn Calculator ─────────────────────────────────

export const MET_VALUES = {
  walking_slow: 2.5, // < 4 km/h
  walking_normal: 3.5, // 4-5 km/h
  walking_brisk: 4.5, // 5-6 km/h
  jogging: 7.0, // 6-8 km/h
  running: 8.0, // > 8 km/h
  running_fast: 10.0, // > 10 km/h
  lifting_light: 3.0,
  lifting_moderate: 4.5,
  lifting_heavy: 6.0,
  yoga: 2.5,
  hiit: 8.0,
  cycling: 6.0,
}

/**
 * Calculates calories burned using the MET formula:
 *   Calories = MET × Weight(kg) × Duration(hours)
 *
 * Speed-first MET selection:
 *   - If distance is available → derive speed → pick MET from speed tiers
 *   - Otherwise → fall back to activity type keyword matching
 */
export const calculateCaloriesBurned = (
  activityType: string,
  durationMins: number,
  weightKg: number,
  distanceKm?: number
): number => {
  const durationHours = durationMins / 60
  let met = 4.5

  // 1. Speed-first MET selection (always takes priority when distance is available)
  if (distanceKm && distanceKm > 0) {
    const speed = distanceKm / durationHours
    if (speed < 3.5) met = 2.5
    else if (speed < 5.5) met = 3.5
    else if (speed < 7.0) met = 4.5
    else if (speed < 10.0) met = 8.0
    else met = 10.0
  }
  // 2. Fallback: activity type keyword matching
  else {
    const type = activityType.toLowerCase()
    if (type.includes('walk')) met = 3.5
    else if (type.includes('run')) met = 8.0
    else if (type.includes('yoga')) met = 2.5
    else if (type.includes('lift') || type.includes('weight')) met = 4.0
    else if (type.includes('hiit')) met = 8.0
  }

  return Math.round(met * weightKg * durationHours)
}

/** Infer activity level from weekly workout count */
export const inferActivityLevel = (workoutsPerWeek: number): string => {
  if (workoutsPerWeek <= 0) return 'sedentary'
  if (workoutsPerWeek <= 2) return 'light'
  if (workoutsPerWeek <= 4) return 'moderate'
  if (workoutsPerWeek <= 6) return 'active'
  return 'athlete'
}

// ─── All-in-one Macro Calculator (Protein Priority) ────────────────────

/**
 * Computes calorie target + goal-aware macro split in one call.
 *
 * Protein priority:
 *   lose  → 2.2 g/kg  (protect muscle during deficit)
 *   gain  → 2.0 g/kg  (support hypertrophy)
 *   maintain → 1.6 g/kg
 *
 * Fat: 0.9 g/kg (fixed)
 * Carbs: remaining calories ÷ 4
 */
export const calculateMacros = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activity: ActivityLevel,
  goal: Goal
): MacroTargets => {
  // 1. BMR (Mifflin-St Jeor)
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age
  bmr += gender === 'male' ? 5 : -161

  // 2. TDEE
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activity] ?? ACTIVITY_MULTIPLIERS.sedentary)

  // 3. Goal adjustment
  let targetCalories = tdee
  if (goal === 'lose') targetCalories -= 500
  if (goal === 'gain') targetCalories += 500

  // 4. Protein priority macro split
  let proteinMultiplier = 2.0
  if (goal === 'lose') proteinMultiplier = 2.2
  if (goal === 'maintain') proteinMultiplier = 1.6

  const proteinGrams = Math.round(weightKg * proteinMultiplier)
  const fatGrams = Math.round(weightKg * 0.9)

  const proteinCals = proteinGrams * 4
  const fatCals = fatGrams * 9
  const remainingCals = targetCalories - (proteinCals + fatCals)
  const carbGrams = Math.max(0, Math.round(remainingCals / 4))

  return {
    calories: Math.round(targetCalories),
    protein: proteinGrams,
    fat: fatGrams,
    carbs: carbGrams,
  }
}

// ─── Flux Recommendation Engine ────────────────────────────────────────

export interface FluxState {
  /** Daily calorie target based on BMR + activity + goal */
  dailyTarget: number
  /** Total calories consumed today */
  caloriesIn: number
  /** Estimated calories burned from today's workouts */
  caloriesOut: number
  /** Net balance: consumed − (target + burned).  Negative = deficit, positive = surplus */
  balance: number
  /** 0-100 score of how well input matches output */
  balancePercent: number
  /** Human-readable recommendation */
  recommendation: string
  /** 'deficit' | 'surplus' | 'balanced' */
  zone: 'deficit' | 'surplus' | 'balanced'
}

export const computeFluxState = (
  dailyTarget: number,
  caloriesIn: number,
  caloriesOut: number
): FluxState => {
  // Adjusted need: base target + extra from workouts
  const adjustedTarget = dailyTarget + caloriesOut
  const balance = caloriesIn - adjustedTarget
  // Balance percent: how close consumed is to adjusted target (clamped 0-100)
  const balancePercent =
    adjustedTarget > 0
      ? Math.min(100, Math.max(0, Math.round((caloriesIn / adjustedTarget) * 100)))
      : 0

  const deficit = balance < -200
  const surplus = balance > 200

  let zone: FluxState['zone'] = 'balanced'
  let recommendation: string

  if (deficit) {
    zone = 'deficit'
    const gap = Math.abs(Math.round(balance))
    recommendation =
      caloriesOut > 0
        ? `You burned ${caloriesOut} cal working out. Eat ~${gap} more calories to refuel properly.`
        : `You're ${gap} calories under your target. Fuel up to stay on track!`
  } else if (surplus) {
    zone = 'surplus'
    const excess = Math.round(balance)
    // Suggest a moderate workout duration to offset (assume ~7 cal/min moderate)
    const suggestedMinutes = Math.round(excess / 7)
    recommendation = `You're ${excess} cal over your target. A ${suggestedMinutes}-min moderate workout could balance it out.`
  } else {
    recommendation = `Great balance! You're right on track with your nutrition and activity.`
  }

  return {
    dailyTarget,
    caloriesIn,
    caloriesOut,
    balance,
    balancePercent,
    recommendation,
    zone,
  }
}

// ─── STRAIN (TRIMP) & RECOVERY CALCULATIONS ─────────────────────────────

/**
 * Calculates Strain based on Bannister's TRIMP formula.
 * Normalized to a 0-21 scale (similar to Whoop/Oura).
 */
export const calculateStrain = (
  durationMins: number,
  avgHr?: number,
  age: number = 25,
  gender: Gender = 'male',
  restingHr: number = 60
): number => {
  // 1. Calculate HR Max (Tanaka Formula: 208 - 0.7 * age)
  const maxHr = 208 - 0.7 * age
  const hrr = maxHr - restingHr

  // 2. Determine Intensity (0.0 to 1.0)
  let intensity = 0.55 // Default for moderate activity
  if (avgHr && avgHr > restingHr) {
    intensity = (avgHr - restingHr) / hrr
  }

  // 3. Gender-specific constants for Bannister TRIMP
  const constant = gender === 'male' ? 0.64 : 0.86
  const expFactor = gender === 'male' ? 1.92 : 1.67

  // 4. TRIMP = mins * intensity * constant * e^(factor * intensity)
  const rawTrimp = durationMins * intensity * constant * Math.exp(expFactor * intensity)

  return Math.round(rawTrimp)
}

/**
 * Calculates Recovery Score (0-100%) based on HRV and Resting Heart Rate comparison to baseline.
 * - Score > 66%: High (Green)
 * - Score 33-66%: Medium (Yellow)
 * - Score < 33%: Low (Red)
 */
export const calculateRecovery = (
  currentHrv: number,
  baselineHrv: number, // 30-day average
  currentRhr: number,
  baselineRhr: number // 30-day average
): number => {
  if (!baselineHrv || !baselineRhr) return 50 // Default if no baseline

  let score = 50

  // HRV Factor (Higher is better)
  // If current is 100ms and baseline is 80ms -> +25% diff -> Add points
  const hrvDiffPercent = ((currentHrv - baselineHrv) / baselineHrv) * 100
  // Weight: 0.5 point per 1% difference
  score += hrvDiffPercent * 0.5

  // RHR Factor (Lower is better)
  // If current is 50bpm and baseline is 60bpm -> -16% diff -> Add points (inverted)
  const rhrDiffPercent = ((currentRhr - baselineRhr) / baselineRhr) * 100
  // Weight: Subtracting difference (negative diff adds to score)
  // e.g. -10% RHR -> score -= (-10 * 1.0) -> score += 10
  score -= rhrDiffPercent * 1.0 // RHR often stronger indicator of acute recovery

  // Cap between 1 and 100
  return Math.min(100, Math.max(1, Math.round(score)))
}
