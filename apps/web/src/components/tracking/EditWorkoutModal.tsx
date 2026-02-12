import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkoutExerciseLogInputSchema, MuscleGroupEnum } from '@repo/shared'
import type { WorkoutExerciseLogInput, WorkoutExerciseLog, MuscleGroup } from '@repo/shared'
import { useUpdateWorkout } from '../../hooks/useWorkouts'
import { useAuth } from '../../providers/AuthProvider'
import { calculateCaloriesBurned } from '../../lib/energyUtils'
import { Button, Input, Label, cn } from '@repo/ui'
import { X, Loader2, Flame } from 'lucide-react'

const MUSCLE_GROUPS = MuscleGroupEnum.options
const ENDURANCE_GROUPS: MuscleGroup[] = ['Legs', 'Cardio']

interface EditWorkoutModalProps {
  workout: WorkoutExerciseLog & { id: string }
  onClose: () => void
}

export function EditWorkoutModal({ workout, onClose }: EditWorkoutModalProps) {
  const { mutateAsync: updateWorkout, isPending } = useUpdateWorkout()
  const { userProfile } = useAuth()
  const [rpeValue, setRpeValue] = useState(workout.rpe)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkoutExerciseLogInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(WorkoutExerciseLogInputSchema) as any,
    defaultValues: {
      exerciseName: workout.exerciseName,
      muscleGroup: workout.muscleGroup,
      sets: workout.sets ?? 3,
      reps: workout.reps ?? 10,
      weight: workout.weight ?? 0,
      durationMins: workout.durationMins ?? 30,
      distanceKm: workout.distanceKm ?? 0,
      rpe: workout.rpe,
      note: workout.note ?? '',
    },
  })

  const selectedGroup = watch('muscleGroup')
  const isEndurance = ENDURANCE_GROUPS.includes(selectedGroup)

  const onSubmit = async (data: WorkoutExerciseLogInput) => {
    // 1. Force strict numeric types (HTML inputs return strings)
    const duration = Number(data.durationMins) || 0
    const sets = Number(data.sets) || 0
    const reps = Number(data.reps) || 0
    const weightInput = Number(data.weight) || 0
    const distance = Number(data.distanceKm) || 0

    // 2. Recalculate strain (mirrors LogWorkoutForm logic exactly)
    let strainScore = 0
    if (isEndurance) {
      strainScore = duration * rpeValue
    } else {
      const volume = sets * reps * (weightInput || 1)
      strainScore = Math.round((volume / 30) * (rpeValue / 5))
    }

    // 3. Recalculate calories burned (MET-based, same as useFluxSync)
    const userWeight = Number(userProfile?.metrics?.weightKg) || 70
    const effectiveDuration = isEndurance ? duration : sets * 3
    const calories = calculateCaloriesBurned(
      data.muscleGroup,
      effectiveDuration,
      userWeight,
      distance || undefined
    )

    // 4. Build payload with all type-specific fields + recalculated metrics
    const payload: Record<string, unknown> = {
      exerciseName: data.exerciseName,
      muscleGroup: data.muscleGroup,
      rpe: rpeValue,
      strainScore,
      calories,
      note: data.note || '',
    }

    if (isEndurance) {
      payload.durationMins = duration
      payload.distanceKm = distance
    } else {
      payload.sets = sets
      payload.reps = reps
      payload.weight = weightInput
    }

    console.log('[EditWorkout] Updating with:', {
      strainScore,
      calories,
      duration: effectiveDuration,
    })

    await updateWorkout({ id: workout.id, data: payload as Partial<WorkoutExerciseLogInput> })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Edit Exercise</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Exercise Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Exercise Name</Label>
            <Input
              {...register('exerciseName')}
              className="bg-zinc-900 border-zinc-800 text-white"
            />
            {errors.exerciseName && (
              <p className="text-xs text-red-400">{errors.exerciseName.message}</p>
            )}
          </div>

          {/* Muscle Group */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Primary Focus</Label>
            <select
              {...register('muscleGroup')}
              className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
            >
              {MUSCLE_GROUPS.map(g => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic fields */}
          {isEndurance ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Duration (mins)</Label>
                <Input
                  type="number"
                  {...register('durationMins')}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Distance (km)</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...register('distanceKm')}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Sets</Label>
                <Input
                  type="number"
                  {...register('sets')}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Reps</Label>
                <Input
                  type="number"
                  {...register('reps')}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  {...register('weight')}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>
          )}

          {/* RPE Slider */}
          <div className="space-y-3 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400 flex items-center gap-2">
                <Flame className="h-3 w-3 text-orange-500" />
                Intensity / RPE
              </Label>
              <span
                className={cn(
                  'text-sm font-bold',
                  rpeValue <= 3
                    ? 'text-emerald-400'
                    : rpeValue <= 6
                      ? 'text-yellow-400'
                      : rpeValue <= 8
                        ? 'text-orange-400'
                        : 'text-red-400'
                )}
              >
                {rpeValue} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={rpeValue}
              onChange={e => {
                const val = parseInt(e.target.value)
                setRpeValue(val)
                setValue('rpe', val)
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Note</Label>
            <Input {...register('note')} className="bg-zinc-900 border-zinc-800 text-white" />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
