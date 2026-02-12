import { useState } from 'react'
import { Card, CardContent, Button, cn } from '@repo/ui'
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

  const formattedDate =
    workout.performedAt &&
    typeof workout.performedAt === 'object' &&
    'seconds' in workout.performedAt
      ? new Date(workout.performedAt.seconds * 1000).toLocaleDateString()
      : 'Just now'

  // 1. Check if we have Lifting Data (Sets/Reps)
  const isLifting = workout.sets !== undefined && workout.sets > 0

  // 2. Check if we have Cardio Data (Distance/Duration)
  const isCardio = workout.durationMins !== undefined && workout.durationMins > 0

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Exercise info & Stats */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div
                className={cn(
                  'mt-0.5 rounded-lg p-2 shrink-0',
                  isCardio ? 'bg-cyan-500/10' : 'bg-zinc-800'
                )}
              >
                {isCardio ? (
                  <Activity className="h-5 w-5 text-cyan-400" />
                ) : (
                  <Dumbbell className="h-5 w-5 text-lime-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white truncate">{workout.exerciseName}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{formattedDate}</p>
                  </div>

                  {/* Actions (Top Right) */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => setEditOpen(true)}
                      className="p-1.5 rounded text-zinc-500 hover:text-lime-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {confirmDelete ? (
                      <Button
                        variant="ghost"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 h-auto"
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                      </Button>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* CONDITIONALLY RENDER THE STATS */}
                <div className="mt-2 text-sm">
                  {isLifting ? (
                    <span className="block font-medium text-lime-400">
                      🏋️ {workout.sets} x {workout.reps} @ {workout.weight}kg
                    </span>
                  ) : isCardio ? (
                    <span className="block font-medium text-cyan-400">
                      🏃 {workout.distanceKm || 0}km in {workout.durationMins}m
                    </span>
                  ) : (
                    <span className="text-zinc-500 italic">No stats recorded</span>
                  )}
                </div>

                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded border text-[10px] font-bold',
                      workout.rpe >= 8
                        ? 'border-red-500/20 text-red-500 bg-red-500/10'
                        : workout.rpe >= 5
                          ? 'border-orange-500/20 text-orange-500 bg-orange-500/10'
                          : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10'
                    )}
                  >
                    RPE {workout.rpe}
                  </span>
                  {workout.note && (
                    <span className="italic truncate border-l border-zinc-700 pl-2">
                      "{workout.note}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editOpen && <EditWorkoutModal workout={workout} onClose={() => setEditOpen(false)} />}
    </>
  )
}
