import { useTeamActivity } from '../../hooks/useTeamActivity'
import { useUserProfile } from '../../hooks/useSocial'
import { Card, CardContent } from '@repo/ui'
import { Clock, Zap, Flame, Users } from 'lucide-react'
import type { Workout } from '@repo/shared'

// Simple date formatter (relative time)
function formatRelativeTime(date: unknown): string {
  try {
    if (!date) return 'Recently'

    let dateObj: Date
    if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === 'object' && (date as Record<string, unknown>).toDate) {
      dateObj = (date as { toDate: () => Date }).toDate()
    } else if (typeof date === 'object' && 'seconds' in (date as Record<string, unknown>)) {
      dateObj = new Date((date as { seconds: number }).seconds * 1000)
    } else {
      return 'Recently'
    }

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return dateObj.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}

// Get readable workout type name
function getWorkoutType(workout: Workout): string {
  const title = (workout.title || '').toLowerCase()

  if (title.includes('run')) return 'Run'
  if (title.includes('cardio')) return 'Cardio'
  if (title.includes('yoga')) return 'Yoga'
  if (title.includes('lift') || title.includes('strength')) return 'Lift'
  return 'Workout'
}

interface ActivityCardProps {
  workout: Workout
}

function ActivityCard({ workout }: ActivityCardProps) {
  const { data: profile } = useUserProfile(workout.userId)

  const workoutType = getWorkoutType(workout)
  const duration =
    (workout as unknown as { durationMinutes?: number }).durationMinutes ||
    (workout as unknown as { durationMins?: number }).durationMins ||
    0
  const strain = workout.strainScore || 0

  // Estimate calories (rough approximate)
  const estimatedCalories = Math.round(duration * 7)

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden hover:bg-zinc-900 transition-colors">
      <CardContent className="p-4">
        {/* Header: Avatar + Name + Action + Timestamp */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile?.displayName || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-zinc-400">
                  {(profile?.displayName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                {profile?.displayName || 'Unknown User'}
              </div>
              <div className="text-xs text-zinc-500">completed a {workoutType.toLowerCase()}</div>
            </div>
          </div>
          <div className="text-xs text-zinc-400 flex-shrink-0 ml-2 whitespace-nowrap">
            {formatRelativeTime(workout.date)}
          </div>
        </div>

        {/* Body: Stats Grid */}
        <div className="bg-zinc-950/40 rounded-lg p-3 grid grid-cols-3 gap-3">
          {/* Duration */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-sm font-semibold text-white">{duration}m</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Duration</div>
          </div>

          {/* Calories */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-sm font-semibold text-white">{estimatedCalories}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">kcal</div>
          </div>

          {/* Strain */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-sm font-semibold text-white">{strain}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Strain</div>
          </div>
        </div>

        {/* Optional: Targeted muscles */}
        {workout.targetedMuscles && workout.targetedMuscles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {workout.targetedMuscles.slice(0, 3).map(muscle => (
              <span
                key={muscle}
                className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 uppercase tracking-wider"
              >
                {muscle}
              </span>
            ))}
            {workout.targetedMuscles.length > 3 && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 uppercase tracking-wider">
                +{workout.targetedMuscles.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TeamActivityFeed() {
  const { data: workouts, isLoading } = useTeamActivity()

  if (isLoading) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <div className="animate-spin h-8 w-8 border-4 border-lime-400 border-t-transparent rounded-full mx-auto mb-4" />
        Loading team activity...
      </div>
    )
  }

  if (!workouts || workouts.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No buddy activity yet</h3>
          <p className="text-zinc-500 max-w-sm mx-auto">
            Connect with workout buddies to see their activity here!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {workouts.map(workout => (
        <ActivityCard key={workout.id} workout={workout} />
      ))}
    </div>
  )
}
