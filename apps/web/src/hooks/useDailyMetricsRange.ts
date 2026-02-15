import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { DailyMetric } from '@repo/shared'

/**
 * Fetches the last N days of daily_metrics for the current user.
 * Uses client-side filtering to avoid Firestore composite-index requirements.
 * Returns an array sorted by date ascending (oldest first) for chart display.
 */
export function useDailyMetricsRange(days: number = 14, userId?: string) {
  return useQuery({
    queryKey: userId
      ? ['daily-metrics-range', days, 'user', userId]
      : ['daily-metrics-range', days],
    queryFn: async (): Promise<DailyMetric[]> => {
      const user = auth.currentUser
      if (!user) return []

      const targetUserId = userId || user.uid

      // Calculate the start date string (YYYY-MM-DD) using local time
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const pad = (n: number) => String(n).padStart(2, '0')
      const startDateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`

      // Single filter by userId — no composite index required
      const q = query(collection(db, 'daily_metrics'), where('userId', '==', targetUserId))

      try {
        const snapshot = await getDocs(q)
        const allMetrics = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as DailyMetric[]

        // Client-side date filter and sort ascending
        return allMetrics
          .filter(m => m.date >= startDateStr)
          .sort((a, b) => (a.date > b.date ? 1 : -1))
      } catch (err) {
        console.error('[useDailyMetricsRange] Firestore query failed:', err)
        return []
      }
    },
    enabled: !!auth.currentUser,
  })
}
