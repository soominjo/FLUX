import { useState } from 'react'
import { Button, cn } from '@repo/ui'
import { useDeleteWorkout } from '../../hooks/useWorkouts'
import { EditWorkoutModal } from './EditWorkoutModal'
import { Pencil, Trash2, Loader2, Dumbbell, Activity } from 'lucide-react'
import type { WorkoutExerciseLog } from '@repo/shared'

interface WorkoutHistoryItemProps {
  workout: WorkoutExerciseLog & { id: string }
}

export function WorkoutHistoryItem({ workout }: WorkoutHistoryItemProps) {
  const { mutateAsync: deleteWorkout, isPending: isDeleting } = useDeleteWorkout()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    await deleteWorkout(workout.id)
    setConfirmDelete(false)
  }

  // Format "time ago" from Firestore Timestamp
  const timeAgo = (() => {
    if (
      !workout.performedAt ||
      typeof workout.performedAt !== 'object' ||
      !('seconds' in workout.performedAt)
    )
      return 'Just now'

    const ms = Date.now() - workout.performedAt.seconds * 1000
    const mins = Math.floor(ms / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return new Date(workout.performedAt.seconds * 1000).toLocaleDateString()
  })()

  const isLifting = workout.sets !== undefined && workout.sets > 0
  const isCardio = workout.durationMins !== undefined && workout.durationMins > 0

  const rpeColor =
    workout.rpe >= 8
      ? 'border-red-500/20 text-red-400 bg-red-500/10'
      : workout.rpe >= 5
        ? 'border-orange-500/20 text-orange-400 bg-orange-500/10'
        : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10'

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 transition-colors hover:bg-zinc-900 group">
        {/* Left: Icon + Identity */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={cn(
              'shrink-0 p-2.5 rounded-full',
              isCardio && !isLifting
                ? 'bg-blue-500/15 text-blue-400'
                : 'bg-purple-500/15 text-purple-400'
            )}
          >
            {isCardio && !isLifting ? (
              <Activity className="h-5 w-5" />
            ) : (
              <Dumbbell className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="text-base font-semibold text-white truncate">
              {workout.exerciseName}
            </div>
            <div className="text-sm text-zinc-500">{timeAgo}</div>
          </div>
        </div>

        {/* Right: Data Badges + Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {/* Stats Badge */}
          {isCardio && !isLifting ? (
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
              {workout.durationMins}m{workout.distanceKm ? ` · ${workout.distanceKm}km` : ''}
            </span>
          ) : isLifting ? (
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
              {workout.sets}×{workout.reps} @ {workout.weight ?? 0}kg
            </span>
          ) : null}

          {/* RPE Badge */}
          <span
            className={cn(
              'px-2 py-1 rounded-full border text-xs font-bold whitespace-nowrap',
              rpeColor
            )}
          >
            RPE {workout.rpe}
          </span>

          {/* Edit / Delete (visible on hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded text-zinc-500 hover:text-lime-400 hover:bg-zinc-800 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {confirmDelete ? (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 h-auto"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Yes'}
              </Button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes row — only if present, below the main line */}
      {workout.note && (
        <div className="-mt-1.5 ml-16 mb-1 text-xs text-zinc-500 italic truncate">
          "{workout.note}"
        </div>
      )}

      {editOpen && <EditWorkoutModal workout={workout} onClose={() => setEditOpen(false)} />}
    </>
  )
}
