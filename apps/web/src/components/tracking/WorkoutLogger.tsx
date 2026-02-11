import { useState } from 'react'
import { useLogWorkout } from '../../hooks/useWorkouts'
import { calculateStrain } from '../../lib/flux-logic'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import { Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@repo/ui'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Cardio']

export function WorkoutLogger() {
  const [isOpen, setIsOpen] = useState(false)
  const { mutateAsync: logWorkout } = useLogWorkout()
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(45)
  const [intensity, setIntensity] = useState(5)
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([])

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Calculate Strain locally
      const strainScore = calculateStrain(duration, intensity)

      await logWorkout({
        title: title || 'Workout',
        durationMinutes: duration,
        perceivedPain: intensity, // Mapping intensity to perceivedPain/intensity field
        strainScore,
        targetedMuscles: selectedMuscles,
        exercises: [], // Empty for now as per V1 requirements
        kudos: [], // Initialize empty kudos array
      })

      // Reset and Close
      setIsOpen(false)
      setTitle('')
      setDuration(45)
      setIntensity(5)
      setSelectedMuscles([])
    } catch (error) {
      console.error('Failed to log workout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
      >
        <Plus className="mr-2 h-4 w-4" /> Log Workout
      </Button>

      {/* Manual Modal Implementation since we don't have Radix Dialog yet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Log Workout</h2>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Workout Title</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Upper Body Power"
                  className="bg-zinc-900 border-zinc-800 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (mins): {duration}</Label>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Intensity (RPE 1-10): {intensity}</Label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={e => setIntensity(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Muscle Groups</Label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map(muscle => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => toggleMuscle(muscle)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium transition-colors border',
                        selectedMuscles.includes(muscle)
                          ? 'bg-lime-400/10 border-lime-400 text-lime-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      )}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Workout'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
