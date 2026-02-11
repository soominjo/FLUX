import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui'
import { Target } from 'lucide-react'
import type { Workout } from '@repo/shared'

interface MuscleBalanceChartProps {
  workouts: Workout[]
}

interface MuscleDataPoint {
  muscle: string
  frequency: number
}

/**
 * Reduces workouts from the last 30 days into a frequency count
 * of each targeted muscle group for radar chart display.
 */
function buildMuscleData(workouts: Workout[]): MuscleDataPoint[] {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const counts: Record<string, number> = {}

  workouts.forEach(w => {
    // Parse the workout date
    let workoutDate: Date | null = null
    if (w.date && typeof w.date === 'object' && 'seconds' in w.date) {
      workoutDate = new Date((w.date as { seconds: number }).seconds * 1000)
    } else if (w.date instanceof Date) {
      workoutDate = w.date
    }

    // Filter to last 30 days
    if (!workoutDate || workoutDate < thirtyDaysAgo) return

    w.targetedMuscles?.forEach(muscle => {
      counts[muscle] = (counts[muscle] || 0) + 1
    })
  })

  // Convert to array, ensure at least some standard muscle groups appear
  const standardGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
  const result: MuscleDataPoint[] = []

  // Add all found groups
  const allGroups = new Set([...standardGroups, ...Object.keys(counts)])
  allGroups.forEach(muscle => {
    result.push({ muscle, frequency: counts[muscle] || 0 })
  })

  return result
}

export function MuscleBalanceChart({ workouts }: MuscleBalanceChartProps) {
  const data = buildMuscleData(workouts)
  const maxFreq = Math.max(...data.map(d => d.frequency), 1)
  const hasData = data.some(d => d.frequency > 0)

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          Muscle Balance — 30 Days
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="muscle" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <PolarRadiusAxis
                domain={[0, maxFreq]}
                tick={{ fill: '#a1a1aa', fontSize: 10 }}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#3f3f46',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                }}
              />
              <Radar
                name="Workouts"
                dataKey="frequency"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
            <Target className="h-8 w-8 opacity-30" />
            <p className="text-sm">Log workouts with targeted muscles to see your balance.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
