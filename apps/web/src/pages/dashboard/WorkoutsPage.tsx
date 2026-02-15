import { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useWorkouts, useExerciseLogs } from '../../hooks/useWorkouts'
// useMyProviders removed — replaced "Your Team" card with "Total Cardio Load"
import { calculateStreak } from '../../lib/flux-logic'
import { LogWorkoutForm } from '../../components/tracking/LogWorkoutForm'
import { WorkoutHistoryItem } from '../../components/tracking/WorkoutHistoryItem'
import { StrainRecoveryChart } from '../../components/analytics/StrainRecoveryChart'
import { MuscleBalanceChart } from '../../components/analytics/MuscleBalanceChart'
import { UpdateBodyMetricsDialog } from '../../components/tracking/UpdateBodyMetricsDialog'
import { useDailyMetricsRange } from '../../hooks/useDailyMetricsRange'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { Flame, Dumbbell, Activity, BarChart3, Scale, Plus, Pencil } from 'lucide-react'
import { NotificationBell } from '../../components/notifications/NotificationBell'

export default function WorkoutsPage() {
  const { user, userProfile } = useAuth()
  const { data: workouts } = useWorkouts(user?.uid)
  const { data: exerciseLogs, isLoading: isLoadingLogs } = useExerciseLogs()
  const { data: dailyMetrics } = useDailyMetricsRange(14)

  const [showLogForm, setShowLogForm] = useState(false)
  const [showMetricsDialog, setShowMetricsDialog] = useState(false)

  const lastWorkout = workouts && workouts.length > 0 ? workouts[0] : null
  const weeklyStrain = workouts ? workouts.reduce((acc, w) => acc + (w.strainScore || 0), 0) : 0
  const streak = workouts ? calculateStreak(workouts.map(w => w.date)) : 0

  // Calculate today's strength and cardio load from exercise logs
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  const todayLogs = (exerciseLogs ?? []).filter(log => {
    // performedAt is a Firestore Timestamp — convert to local YYYY-MM-DD
    const ts = log.performedAt
    if (!ts) return false
    const d =
      typeof ts === 'object' && 'toDate' in ts ? (ts as { toDate: () => Date }).toDate() : null
    if (!d) return false
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` === todayStr
  })

  const strengthLoad = todayLogs
    .filter(l => l.muscleGroup !== 'Cardio' && l.sets && l.reps)
    .reduce((sum, l) => {
      const weight = l.weight ?? 0
      const rpe = l.rpe ?? 5
      return sum + l.sets! * l.reps! * weight * (rpe / 10)
    }, 0)

  const cardioLoad = todayLogs
    .filter(l => {
      const lAny = l as Record<string, unknown>
      const duration = l.durationMins || (lAny.durationMinutes as number) || 0
      return l.muscleGroup === 'Cardio' || duration > 0
    })
    .reduce((sum, l) => {
      const lAny = l as Record<string, unknown>
      const duration = l.durationMins || (lAny.durationMinutes as number) || 0
      const rpe = l.rpe ?? 5
      const multiplier = rpe <= 3 ? 5 : rpe <= 6 ? 8 : rpe <= 9 ? 12 : 15
      return sum + duration * multiplier
    }, 0)

  // BMI display from profile (read-only here, dialog handles edits)
  const heightCm = userProfile?.metrics?.heightCm ?? 0
  const weightKg = userProfile?.metrics?.weightKg ?? 0
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

  return (
    <div className="min-h-screen bg-zinc-950">
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
          <Button
            onClick={() => setShowLogForm(true)}
            className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" /> Log Exercise
          </Button>
          <span className="hidden md:block">
            <NotificationBell />
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  Total Strength Load
                </CardTitle>
                <Dumbbell className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{Math.round(strengthLoad)}</div>
                <p className="text-xs text-zinc-500 mt-1">Daily Volume (kg)</p>
              </CardContent>
            </Card>

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

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  Total Cardio Load
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{Math.round(cardioLoad)}</div>
                <p className="text-xs text-zinc-500 mt-1">Duration × Intensity</p>
              </CardContent>
            </Card>
          </div>

          {/* Exercise Log History */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">My Exercise Log</h2>
            <div className="space-y-3">
              {isLoadingLogs ? (
                <div className="text-zinc-500">Loading your exercises...</div>
              ) : exerciseLogs && exerciseLogs.length > 0 ? (
                exerciseLogs.map(log => <WorkoutHistoryItem key={log.id} workout={log} />)
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                  No exercises logged yet. Hit "Log Exercise" to start!
                </div>
              )}
            </div>
          </div>

          {/* Analytics */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-lime-400" />
              Your Flux Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StrainRecoveryChart workouts={workouts ?? []} dailyMetrics={dailyMetrics ?? []} />
              <MuscleBalanceChart workouts={workouts ?? []} />
            </div>
          </div>
        </div>

        {/* Right Column: Body Composition */}
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Body Composition</span>
                <button
                  onClick={() => setShowMetricsDialog(true)}
                  className="p-1 rounded text-zinc-400 hover:text-lime-400 hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
                  <div className="text-lg font-semibold text-white">{heightCm || '—'}</div>
                  <div className="text-[10px] text-zinc-500 uppercase">Height (cm)</div>
                </div>
                <div className="rounded bg-zinc-950 border border-zinc-800 p-3 text-center">
                  <div className="text-lg font-semibold text-white">{weightKg || '—'}</div>
                  <div className="text-[10px] text-zinc-500 uppercase">Weight (kg)</div>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-center space-y-1">
                <div className={`text-3xl font-bold ${bmiColor}`}>
                  {bmi > 0 ? bmi.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">BMI</div>
                <div className={`text-sm font-semibold ${bmiColor}`}>{bmiCategory}</div>
              </div>

              <Button
                onClick={() => setShowMetricsDialog(true)}
                variant="outline"
                className="w-full border-zinc-800 text-zinc-700 hover:text-white hover:bg-zinc-800"
              >
                <Scale className="mr-2 h-4 w-4" /> Edit Metrics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Exercise Modal */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Log Exercise</h2>
              <button
                onClick={() => setShowLogForm(false)}
                className="text-zinc-400 hover:text-white"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            <LogWorkoutForm onSuccess={() => setShowLogForm(false)} />
          </div>
        </div>
      )}

      {/* Body Metrics Dialog */}
      {showMetricsDialog && <UpdateBodyMetricsDialog onClose={() => setShowMetricsDialog(false)} />}
    </div>
  )
}
