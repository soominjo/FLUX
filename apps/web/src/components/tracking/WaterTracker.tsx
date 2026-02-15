import { motion } from 'framer-motion'

import { cn } from '@repo/ui'
import { useDailyMetrics, useUpdateWater, getTodayDateString } from '../../hooks/useDailyMetrics'

interface WaterTrackerProps {
  date?: Date
  readOnly?: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
const formatDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function WaterTracker({ date, readOnly = false }: WaterTrackerProps) {
  // Use the provided date or default to today
  const dateStr = date ? formatDateStr(date) : getTodayDateString()
  const { data: metrics } = useDailyMetrics(dateStr)
  const { mutate: updateWater } = useUpdateWater()

  const glasses = metrics?.waterIntake || 0
  const TOTAL_GLASSES = 8

  const handleDrink = (index: number) => {
    if (readOnly) return

    let newCount = index + 1
    if (newCount === glasses) {
      newCount = index // Toggle off the top one
    }

    updateWater({ date: dateStr, waterIntake: newCount })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm text-zinc-400 mb-2">
        <span>Water Intake</span>
        <span>
          {glasses} / {TOTAL_GLASSES}
        </span>
      </div>
      <div className="flex justify-between gap-1">
        {Array.from({ length: TOTAL_GLASSES }).map((_, i) => (
          <motion.button
            key={i}
            whileTap={readOnly ? undefined : { scale: 0.9 }}
            onClick={() => handleDrink(i)}
            disabled={readOnly}
            className={cn(
              'h-8 w-6 rounded-sm border transition-colors relative overflow-hidden',
              i < glasses ? 'border-blue-500 bg-blue-500/20' : 'border-zinc-800 bg-zinc-900',
              readOnly && 'cursor-default opacity-70'
            )}
          >
            {i < glasses && (
              <motion.div
                layoutId={`water-${i}`}
                className="absolute inset-0 bg-blue-500"
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            )}
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-zinc-500 text-center mt-2">
        {readOnly ? 'Hydration (read-only)' : 'Stay hydrated!'}
      </p>
    </div>
  )
}
