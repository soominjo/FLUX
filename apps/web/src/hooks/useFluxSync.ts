import { useMemo } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { useWorkouts } from './useWorkouts'
import { useNutrition } from './useNutrition'
import { getTodayDateString } from './useDailyMetrics'
import {
  calculateBMR,
  calculateTarget,
  calculateCaloriesBurned,
  inferActivityLevel,
  computeFluxState,
  type FluxState,
} from '../lib/energyUtils'

export interface FluxSyncResult {
  flux: FluxState | null
  isLoading: boolean
  /** True when profile metrics are incomplete (no height/weight/age) */
  missingMetrics: boolean
}

/**
 * The core FLUX hook — bridges Nutrition (Input) and Fitness (Output)
 * into a single reactive energy-balance state.
 */
export function useFluxSync(): FluxSyncResult {
  const { user, userProfile } = useAuth()
  const today = getTodayDateString()
  const { data: workouts, isLoading: loadingWorkouts } = useWorkouts(user?.uid)
  const { data: nutritionLogs, isLoading: loadingNutrition } = useNutrition(today)

  const flux = useMemo(() => {
    const metrics = userProfile?.metrics
    if (!metrics?.heightCm || !metrics?.weightKg || !metrics?.age) return null

    // 1. BMR  (default to 'male' when gender not set — user can update profile later)
    const gender = (userProfile as Record<string, unknown>)?.gender === 'female' ? 'female' : 'male'
    const bmr = calculateBMR(metrics.weightKg, metrics.heightCm, metrics.age, gender)

    // 2. Activity level: use profile setting, or infer from recent workout count
    let activityLevel: string =
      ((userProfile as Record<string, unknown>)?.activityLevel as string | undefined) ?? ''
    if (!activityLevel) {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const recentWorkouts = (workouts ?? []).filter(w => {
        if (!w.date) return false
        const ts =
          typeof w.date === 'object' && 'seconds' in w.date
            ? (w.date as { seconds: number }).seconds * 1000
            : w.date instanceof Date
              ? w.date.getTime()
              : 0
        return ts >= oneWeekAgo
      })
      activityLevel = inferActivityLevel(recentWorkouts.length)
    }

    // 3. Goal from profile, default to maintain
    const goal: 'lose' | 'gain' | 'maintain' =
      ((userProfile as Record<string, unknown>)?.goal as
        | 'lose'
        | 'gain'
        | 'maintain'
        | undefined) ?? 'maintain'
    const dailyTarget = calculateTarget(bmr, activityLevel, goal)

    // 4. Calories consumed today
    const caloriesIn = (nutritionLogs ?? []).reduce((sum, log) => sum + log.calories, 0)

    // 5. Calories burned from today's workouts
    const todayStr = today
    const todaysWorkouts = (workouts ?? []).filter(w => {
      if (!w.date) return false
      let dateStr: string | null = null
      if (typeof w.date === 'object' && 'seconds' in w.date) {
        dateStr = new Date((w.date as { seconds: number }).seconds * 1000)
          .toISOString()
          .split('T')[0]
      } else if (w.date instanceof Date) {
        dateStr = w.date.toISOString().split('T')[0]
      }
      return dateStr === todayStr
    })
    const caloriesOut = todaysWorkouts.reduce((sum, w) => {
      const wAny = w as Record<string, unknown>
      // Derive activity type from whichever field exists
      const activityType =
        (wAny.exerciseName as string) ||
        (wAny.title as string) ||
        (wAny.muscleGroup as string) ||
        'workout'
      // Duration: Workout uses durationMinutes, ExerciseLog uses durationMins
      const duration = (wAny.durationMinutes as number) ?? (wAny.durationMins as number) ?? 30
      const distanceKm = (wAny.distanceKm as number) || undefined

      return (
        sum + calculateCaloriesBurned(activityType, duration, metrics.weightKg || 75, distanceKm)
      )
    }, 0)

    // 6. Compute the unified Flux state
    return computeFluxState(dailyTarget, caloriesIn, caloriesOut)
  }, [userProfile, workouts, nutritionLogs, today])

  const missingMetrics =
    !userProfile?.metrics?.heightCm || !userProfile?.metrics?.weightKg || !userProfile?.metrics?.age

  return {
    flux,
    isLoading: loadingWorkouts || loadingNutrition,
    missingMetrics,
  }
}
