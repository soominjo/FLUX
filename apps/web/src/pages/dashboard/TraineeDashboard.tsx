import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../providers/AuthProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useNutrition } from '../../hooks/useNutrition'
import { useMyProviders } from '../../hooks/useRelationships'
import { calculateStreak } from '../../lib/flux-logic'
import { NewWorkoutLogger } from '../../components/tracking/NewWorkoutLogger'
import { WorkoutHistoryItem } from '../../components/tracking/WorkoutHistoryItem'
import { NutritionLogger } from '../../components/tracking/NutritionLogger'
import { WaterTracker } from '../../components/tracking/WaterTracker'
import { InviteManager } from '../../components/network/InviteManager'
import { BuddyRequests } from '../../components/team/BuddyRequests'
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button } from '@repo/ui'
import { Flame, Zap, Utensils, Users, BarChart3, Scale } from 'lucide-react'
import { NotificationBell } from '../../components/notifications/NotificationBell'
import { StrainRecoveryChart } from '../../components/analytics/StrainRecoveryChart'
import { MuscleBalanceChart } from '../../components/analytics/MuscleBalanceChart'
import { useDailyMetricsRange } from '../../hooks/useDailyMetricsRange'
import { FluxBar } from '../../components/dashboard/FluxBar'
import { useFluxSync } from '../../hooks/useFluxSync'
import { calculateMacros } from '../../lib/energyUtils'
import type { Gender, ActivityLevel, Goal } from '../../lib/energyUtils'

import { getTodayDateString } from '../../hooks/useDailyMetrics'

export default function TraineeDashboard() {
  const { user, logout, userProfile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const today = getTodayDateString()
  // 1. Fetch ONLY my workouts for the dashboard
  const { data: workouts, isLoading: isLoadingWorkouts } = useWorkouts(user?.uid)
  const { data: nutritionLogs } = useNutrition(today)
  const { data: providers } = useMyProviders()
  const { data: dailyMetrics } = useDailyMetricsRange(14)
  const { flux } = useFluxSync()

  const lastWorkout = workouts && workouts.length > 0 ? workouts[0] : null

  // Logic
  const weeklyStrain = workouts ? workouts.reduce((acc, w) => acc + (w.strainScore || 0), 0) : 0
  const streak = workouts ? calculateStreak(workouts.map(w => w.date as Date)) : 0

  // Daily Readiness: based on yesterday's total strain
  const yesterdayStrain = (() => {
    if (!workouts) return 0
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]
    return workouts.reduce((acc, w) => {
      let dateStr: string | null = null
      if (w.date && typeof w.date === 'object' && 'seconds' in w.date) {
        dateStr = new Date((w.date as { seconds: number }).seconds * 1000)
          .toISOString()
          .split('T')[0]
      } else if (w.date instanceof Date) {
        dateStr = w.date.toISOString().split('T')[0]
      }
      return dateStr === yStr ? acc + (w.strainScore || 0) : acc
    }, 0)
  })()
  const readiness = Math.min(100, Math.max(0, Math.round(100 - yesterdayStrain / 2)))

  // Calculate Daily Calories
  const totalCalories = nutritionLogs
    ? nutritionLogs.reduce((acc, log) => acc + log.calories, 0)
    : 0
  const calorieTarget = flux?.dailyTarget ?? 2500

  // --- Body Composition / BMI ---
  const [heightCm, setHeightCm] = useState<number>(userProfile?.metrics?.heightCm ?? 0)
  const [weightKg, setWeightKg] = useState<number>(userProfile?.metrics?.weightKg ?? 0)
  const [isSavingMetrics, setIsSavingMetrics] = useState(false)
  const [metricsSaved, setMetricsSaved] = useState(false)

  useEffect(() => {
    if (userProfile?.metrics) {
      setHeightCm(userProfile.metrics.heightCm ?? 0)
      setWeightKg(userProfile.metrics.weightKg ?? 0)
    }
  }, [userProfile])

  // Backfill nutritionTargets for profiles created before calculateMacros existed
  useEffect(() => {
    if (!user || !userProfile?.metrics) return
    const profile = userProfile as Record<string, unknown>
    if (profile.nutritionTargets) return // already set

    const { heightCm: h, weightKg: w, age } = userProfile.metrics
    if (!h || !w || !age) return

    const gender: Gender = (profile.gender as Gender) ?? 'male'
    const activity: ActivityLevel = (profile.activityLevel as ActivityLevel) ?? 'moderate'
    const goal: Goal = (profile.goal as Goal) ?? 'maintain'

    const targets = calculateMacros(w, h, age, gender, activity, goal)
    updateDoc(doc(db, 'users', user.uid), { nutritionTargets: targets }).catch(console.error)
  }, [user, userProfile])

  const bmi = heightCm > 0 && weightKg > 0 ? weightKg / Math.pow(heightCm / 100, 2) : 0
  const bmiCategory =
    bmi === 0
      ? '—'
      : bmi < 18.5
        ? 'Underweight'
        : bmi < 25
          ? 'Healthy'
          : bmi < 30
            ? 'Overweight'
            : 'Obese'
  const bmiColor =
    bmi === 0
      ? 'text-zinc-500'
      : bmi < 18.5
        ? 'text-blue-400'
        : bmi < 25
          ? 'text-emerald-400'
          : bmi < 30
            ? 'text-amber-400'
            : 'text-red-400'

  const saveBodyMetrics = async () => {
    if (!user) return
    setIsSavingMetrics(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'metrics.heightCm': heightCm,
        'metrics.weightKg': weightKg,
        'metrics.bmi': Math.round(bmi * 10) / 10,
      })
      setMetricsSaved(true)
      setTimeout(() => setMetricsSaved(false), 2000)
    } finally {
      setIsSavingMetrics(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-lime-400">{user?.displayName?.split(' ')[0]}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-zinc-400">Your personal performance hub.</p>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 rounded-full border border-orange-500/20 text-orange-500 text-xs font-bold animate-pulse">
                <Flame className="h-3 w-3 fill-orange-500" />
                {streak} Day Streak!
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NewWorkoutLogger />
          <NotificationBell />
          <button
            onClick={async () => {
              await logout()
              queryClient.clear()
              navigate('/login', { replace: true })
            }}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-300 underline"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Readiness Card (Mock) */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Daily Readiness</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {readiness} <span className="text-sm font-normal text-zinc-500">%</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {readiness >= 70
                    ? 'Ready for high intensity'
                    : readiness >= 40
                      ? 'Moderate effort recommended'
                      : 'Consider a rest day'}
                </p>
              </CardContent>
            </Card>

            {/* Total Strain Card */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Total Strain</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{weeklyStrain}</div>
                <p className="text-xs text-zinc-500 mt-1">
                  Last: {lastWorkout ? lastWorkout.strainScore : 0}
                </p>
              </CardContent>
            </Card>

            {/* Team Summary Card */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Your Team</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {providers ? providers.length : 0}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Active Connections</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Workout List */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">My Recent Activity</h2>
            <div className="space-y-4">
              {isLoadingWorkouts ? (
                <div className="text-zinc-500">Loading your workouts...</div>
              ) : workouts?.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                  No workouts logged yet. Start training!
                </div>
              ) : (
                workouts?.map(workout => (
                  <WorkoutHistoryItem
                    key={workout.id}
                    workout={workout as Record<string, unknown>}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Incoming Buddy Requests */}
          <BuddyRequests />

          {/* Invite / Connectivity */}
          <InviteManager />

          {/* Body Composition Card */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Body Composition</span>
                <Scale className="h-4 w-4 text-lime-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Height (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="175"
                    value={heightCm || ''}
                    onChange={e => setHeightCm(Number(e.target.value))}
                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Weight (kg)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="70"
                    value={weightKg || ''}
                    onChange={e => setWeightKg(Number(e.target.value))}
                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* BMI Display */}
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-center space-y-1">
                <div className={`text-3xl font-bold ${bmiColor}`}>
                  {bmi > 0 ? bmi.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">BMI</div>
                <div className={`text-sm font-semibold ${bmiColor}`}>{bmiCategory}</div>
              </div>

              <Button
                onClick={saveBodyMetrics}
                disabled={isSavingMetrics || (heightCm === 0 && weightKg === 0)}
                className="w-full bg-lime-500 hover:bg-lime-600 text-black font-semibold"
              >
                {isSavingMetrics ? 'Saving...' : metricsSaved ? '✓ Saved' : 'Save Metrics'}
              </Button>
            </CardContent>
          </Card>

          {/* Energy Flux — dynamic Input↔Output balance */}
          <FluxBar />

          {/* Nutrition Card */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Nutrition</span>
                <Utensils className="h-4 w-4 text-lime-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-white">{totalCalories}</div>
                <div className="text-sm text-zinc-500">/ {calorieTarget} kcal</div>
              </div>

              <NutritionLogger />

              {/* Recent Logs Mini List */}
              <div className="space-y-2 mt-4">
                {nutritionLogs?.slice(0, 3).map(log => (
                  <div
                    key={log.id}
                    className="flex justify-between text-sm p-2 bg-zinc-950 rounded border border-zinc-800"
                  >
                    <span className="text-zinc-300">{log.name}</span>
                    <span className="text-zinc-500">{log.calories} kcal</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Water Tracker Card */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white text-base">Hydration</CardTitle>
            </CardHeader>
            <CardContent>
              <WaterTracker />
            </CardContent>
          </Card>

          {/* ── Your Flux Analytics (bottom of sidebar) ── */}
          <div>
            <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-lime-400" />
              Your Flux Analytics
            </h2>
            <div className="flex flex-col gap-6">
              <StrainRecoveryChart workouts={workouts ?? []} dailyMetrics={dailyMetrics ?? []} />
              <MuscleBalanceChart workouts={workouts ?? []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
