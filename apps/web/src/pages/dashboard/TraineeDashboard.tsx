import { useAuth } from '../../providers/AuthProvider'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useNutrition } from '../../hooks/useNutrition'
import { useMyProviders } from '../../hooks/useRelationships'
import { calculateStreak } from '../../lib/flux-logic'
import { WorkoutLogger } from '../../components/tracking/WorkoutLogger'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { NutritionLogger } from '../../components/tracking/NutritionLogger'
import { WaterTracker } from '../../components/tracking/WaterTracker'
import { InviteManager } from '../../components/network/InviteManager'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Flame, Zap, Utensils, Users, BarChart3 } from 'lucide-react'
import { NotificationBell } from '../../components/notifications/NotificationBell'
import { StrainRecoveryChart } from '../../components/analytics/StrainRecoveryChart'
import { MuscleBalanceChart } from '../../components/analytics/MuscleBalanceChart'
import { useDailyMetricsRange } from '../../hooks/useDailyMetricsRange'

import { getTodayDateString } from '../../hooks/useDailyMetrics'

export default function TraineeDashboard() {
  const { user, logout } = useAuth()
  const today = getTodayDateString()
  // 1. Fetch ONLY my workouts for the dashboard
  const { data: workouts, isLoading: isLoadingWorkouts } = useWorkouts(user?.uid)
  const { data: nutritionLogs } = useNutrition(today)
  const { data: providers } = useMyProviders()
  const { data: dailyMetrics } = useDailyMetricsRange(14)

  const lastWorkout = workouts && workouts.length > 0 ? workouts[0] : null

  // Logic
  const weeklyStrain = workouts ? workouts.reduce((acc, w) => acc + (w.strainScore || 0), 0) : 0
  const streak = workouts ? calculateStreak(workouts.map(w => w.date)) : 0

  // Calculate Daily Calories
  const totalCalories = nutritionLogs
    ? nutritionLogs.reduce((acc, log) => acc + log.calories, 0)
    : 0
  const calorieTarget = 2500

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
          <WorkoutLogger />
          <NotificationBell />
          <button
            onClick={() => logout()}
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
                  85 <span className="text-sm font-normal text-zinc-500">%</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Ready for high intensity</p>
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
                  <ActivityFeedItem key={workout.id} workout={workout} showUser={false} />
                ))
              )}
            </div>
          </div>

          {/* ── Your Flux Analytics ── */}
          <div className="lg:col-span-2">
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

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Invite / Connectivity */}
          <InviteManager />

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
        </div>
      </div>
    </div>
  )
}
