import { useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { Dumbbell } from 'lucide-react'
import { Card, CardContent } from '@repo/ui'
import type { Workout } from '@repo/shared'

interface MuscleDistributionChartProps {
  workouts: Workout[]
}

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Cardio']

export function MuscleDistributionChart({ workouts }: MuscleDistributionChartProps) {
  const chartData = useMemo(() => {
    // 1. Take last 20 workouts
    const recentWorkouts = workouts.sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 20)

    if (recentWorkouts.length < 3) return []

    // 2. Count frequencies
    const counts: Record<string, number> = {}
    MUSCLE_GROUPS.forEach(g => (counts[g] = 0))

    recentWorkouts.forEach(w => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wAny = w as any
      const muscles: string[] = Array.isArray(w.targetedMuscles)
        ? w.targetedMuscles
        : wAny.muscleGroup
          ? [wAny.muscleGroup]
          : []

      muscles.forEach(m => {
        // Normalize names if needed (e.g. 'Legs' vs 'legs')
        // For now, assume simple matching or mapping
        const normalized = MUSCLE_GROUPS.find(g => g.toLowerCase() === m.toLowerCase()) || 'Other'
        if (counts[normalized] !== undefined) {
          counts[normalized]++
        }
      })
    })

    // 3. Format for Recharts
    return MUSCLE_GROUPS.map(muscle => ({
      subject: muscle,
      A: counts[muscle],
      fullMark: recentWorkouts.length, // Just for reference
    }))
  }, [workouts])

  if (chartData.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="h-[300px] flex flex-col items-center justify-center text-zinc-500 gap-4">
          <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <Dumbbell className="h-8 w-8 text-zinc-600" />
          </div>
          <p className="text-sm">Not enough data for muscle balance analysis.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            <Radar
              name="Muscle Balance"
              dataKey="A"
              stroke="#a3e635" // lime-400
              strokeWidth={2}
              fill="#a3e635"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
