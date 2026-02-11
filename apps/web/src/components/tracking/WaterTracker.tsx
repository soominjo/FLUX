import { motion } from 'framer-motion'

import { cn } from '@repo/ui'
import { useDailyMetrics, useUpdateWater, getTodayDateString } from '../../hooks/useDailyMetrics'

export function WaterTracker() {
  const today = getTodayDateString()
  const { data: metrics } = useDailyMetrics(today)
  const { mutate: updateWater } = useUpdateWater()

  const glasses = metrics?.waterIntake || 0
  const TOTAL_GLASSES = 8

  const handleDrink = (index: number) => {
    // Optimistic / logic:
    // If clicking a glass index that is less than current count, we are unchecking.
    // E.g. Glasses = 3. Click index 2 (3rd glass). Logic: maybe set to 3 (unchange) or 2?
    // User logic request: "Clicking one fills it up"
    // Let's assume clicking index `i` sets count to `i + 1`.
    // If we click the *current* max glass, we toggle it off -> `i`?

    let newCount = index + 1
    if (newCount === glasses) {
      newCount = index // Toggle off the top one
    }

    updateWater({ date: today, waterIntake: newCount })
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
            whileTap={{ scale: 0.9 }}
            onClick={() => handleDrink(i)}
            className={cn(
              'h-8 w-6 rounded-sm border transition-colors relative overflow-hidden',
              i < glasses ? 'border-blue-500 bg-blue-500/20' : 'border-zinc-800 bg-zinc-900'
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
      <p className="text-xs text-zinc-500 text-center mt-2">Stay hydrated!</p>
    </div>
  )
}
