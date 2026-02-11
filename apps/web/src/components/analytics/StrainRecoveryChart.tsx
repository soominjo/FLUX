import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui'
import { Activity } from 'lucide-react'
import type { Workout, DailyMetric } from '@repo/shared'

interface StrainRecoveryChartProps {
  workouts: Workout[]
  dailyMetrics: DailyMetric[]
}

interface ChartDataPoint {
  date: string
  label: string
  strain: number
  recovery: number | null
}

/**
 * Merges workout strain scores (summed per day) with daily recovery scores
 * into a single time-series dataset for the last 14 days.
 */
function buildChartData(workouts: Workout[], dailyMetrics: DailyMetric[]): ChartDataPoint[] {
  const days = 14
  const dataMap = new Map<string, ChartDataPoint>()

  // Seed the last 14 days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dataMap.set(dateStr, { date: dateStr, label, strain: 0, recovery: null })
  }

  // Sum strain per day from workouts
  workouts.forEach(w => {
    let dateStr: string
    if (w.date && typeof w.date === 'object' && 'seconds' in w.date) {
      dateStr = new Date((w.date as { seconds: number }).seconds * 1000).toISOString().split('T')[0]
    } else if (w.date instanceof Date) {
      dateStr = w.date.toISOString().split('T')[0]
    } else {
      return
    }
    const point = dataMap.get(dateStr)
    if (point) {
      point.strain += w.strainScore || 0
    }
  })

  // Overlay recovery scores
  dailyMetrics.forEach(m => {
    const point = dataMap.get(m.date)
    if (point) {
      point.recovery = m.recoveryScore
    }
  })

  return Array.from(dataMap.values())
}

export function StrainRecoveryChart({ workouts, dailyMetrics }: StrainRecoveryChartProps) {
  const data = buildChartData(workouts, dailyMetrics)

  const hasData = data.some(d => d.strain > 0 || d.recovery !== null)

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-lime-400" />
          Strain vs Recovery — 14 Day Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
              />
              <YAxis
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#3f3f46',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
              <Bar
                dataKey="strain"
                name="Strain"
                fill="#84cc16"
                fillOpacity={0.6}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                type="monotone"
                dataKey="recovery"
                name="Recovery"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#a855f7' }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
            <Activity className="h-8 w-8 opacity-30" />
            <p className="text-sm">Log workouts and recovery data to see your trend chart.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
