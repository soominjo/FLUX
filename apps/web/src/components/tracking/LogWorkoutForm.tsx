import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkoutExerciseLogInputSchema, MuscleGroupEnum } from '@repo/shared'
import type { WorkoutExerciseLogInput, MuscleGroup } from '@repo/shared'
import { useAddWorkout } from '../../hooks/useWorkouts'
import { Button, Input, Label, cn } from '@repo/ui'
import { Loader2, Flame } from 'lucide-react'

const MUSCLE_GROUPS = MuscleGroupEnum.options
const ENDURANCE_GROUPS: MuscleGroup[] = ['Legs', 'Cardio']

export function LogWorkoutForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutateAsync: addWorkout, isPending } = useAddWorkout()
  const [rpeValue, setRpeValue] = useState(7)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkoutExerciseLogInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(WorkoutExerciseLogInputSchema) as any,
    defaultValues: {
      exerciseName: '',
      muscleGroup: 'Chest',
      sets: 3,
      reps: 10,
      weight: 0,
      durationMins: 30,
      distanceKm: 0,
      rpe: 7,
      note: '',
    },
  })

  const selectedGroup = watch('muscleGroup')
  const isEndurance = ENDURANCE_GROUPS.includes(selectedGroup)

  const onSubmit = async (data: WorkoutExerciseLogInput) => {
    // 1. Calculate strainScore based on exercise type
    let strainScore = 0
    if (isEndurance) {
      // Cardio: Duration * RPE
      strainScore = (data.durationMins || 0) * rpeValue
    } else {
      // Strength: (Sets * Reps * Weight) / 30 * (RPE / 5)
      const volume = (data.sets || 0) * (data.reps || 0) * (data.weight || 1)
      strainScore = Math.round((volume / 30) * (rpeValue / 5))
    }

    // 2. Strip irrelevant fields to keep the Firestore doc clean
    const payload: Record<string, unknown> = {
      exerciseName: data.exerciseName,
      muscleGroup: data.muscleGroup,
      rpe: rpeValue,
      strainScore,
      note: data.note || '',
    }

    if (isEndurance) {
      payload.durationMins = data.durationMins
      payload.distanceKm = data.distanceKm
    } else {
      payload.sets = data.sets
      payload.reps = data.reps
      payload.weight = data.weight
    }

    await addWorkout(payload as WorkoutExerciseLogInput)
    reset()
    setRpeValue(7)
    setValue('rpe', 7)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* 1. Primary Focus (muscleGroup) */}
      <div className="space-y-2">
        <Label className="text-xs text-zinc-400 uppercase tracking-wider">Primary Focus</Label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {MUSCLE_GROUPS.map(g => {
            const active = selectedGroup === g
            const endurance = ENDURANCE_GROUPS.includes(g)
            return (
              <button
                key={g}
                type="button"
                onClick={() => setValue('muscleGroup', g)}
                className={cn(
                  'py-2 px-1 rounded-md text-xs font-medium transition-all border',
                  active
                    ? endurance
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                      : 'bg-lime-500/15 border-lime-500/40 text-lime-400'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                )}
              >
                {g}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Exercise Name */}
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">Exercise Name</Label>
        <Input
          {...register('exerciseName')}
          placeholder={isEndurance ? 'e.g. 5K Run, Hill Sprint' : 'e.g. Bench Press, Pull-ups'}
          className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
        />
        {errors.exerciseName && (
          <p className="text-xs text-red-400">{errors.exerciseName.message}</p>
        )}
      </div>

      {/* 3. Dynamic Sub-Inputs */}
      {isEndurance ? (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Duration (mins)</Label>
            <Input
              type="number"
              {...register('durationMins')}
              className="bg-zinc-950 border-zinc-800 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Distance (km)</Label>
            <Input
              type="number"
              step="0.1"
              {...register('distanceKm')}
              className="bg-zinc-950 border-zinc-800 text-white"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Sets</Label>
            <Input
              type="number"
              {...register('sets')}
              className="bg-zinc-950 border-zinc-800 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Reps</Label>
            <Input
              type="number"
              {...register('reps')}
              className="bg-zinc-950 border-zinc-800 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Weight (kg)</Label>
            <Input
              type="number"
              step="0.5"
              {...register('weight')}
              className="bg-zinc-950 border-zinc-800 text-white"
            />
          </div>
        </div>
      )}

      {/* 4. RPE Slider */}
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
        <div className="flex justify-between text-[10px] text-zinc-600 px-0.5">
          <span>Easy</span>
          <span>Moderate</span>
          <span>Hard</span>
          <span>Max</span>
        </div>
      </div>

      {/* 5. Note */}
      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">Note (optional)</Label>
        <Input
          {...register('note')}
          placeholder="How did it feel?"
          className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Log Workout'}
      </Button>
    </form>
  )
}
