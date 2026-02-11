import { useQuery } from '@tanstack/react-query'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { DailyMetric } from '@repo/shared'

/**
 * Fetches the last N days of daily_metrics for the current user.
 * Returns an array sorted by date ascending (oldest first) for chart display.
 */
export function useDailyMetricsRange(days: number = 14) {
  return useQuery({
    queryKey: ['daily-metrics-range', days],
    queryFn: async (): Promise<DailyMetric[]> => {
      const user = auth.currentUser
      if (!user) return []

      // Calculate the start date string (YYYY-MM-DD)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().split('T')[0]

      const q = query(
        collection(db, 'daily_metrics'),
        where('userId', '==', user.uid),
        where('date', '>=', startDateStr),
        orderBy('date', 'asc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DailyMetric[]
    },
    enabled: !!auth.currentUser,
  })
}
