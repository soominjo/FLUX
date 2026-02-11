import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { DailyMetric } from '@repo/shared'

export const METRICS_KEYS = {
  all: ['daily_metrics'] as const,
  byDate: (date: string) => [...METRICS_KEYS.all, date] as const,
}

// Ensure formatted date YYYY-MM-DD
export function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

export function useDailyMetrics(dateString: string = getTodayDateString()) {
  return useQuery({
    queryKey: METRICS_KEYS.byDate(dateString),
    queryFn: async (): Promise<DailyMetric | null> => {
      const user = auth.currentUser
      if (!user) return null

      // Doc ID format: {uid}_{date}
      const docId = `${user.uid}_${dateString}`
      const docRef = doc(db, 'daily_metrics', docId)
      const snap = await getDoc(docRef)

      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as DailyMetric
      }
      return null
    },
    enabled: !!auth.currentUser,
  })
}

export function useUpdateWater() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ date, waterIntake }: { date: string; waterIntake: number }) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      const docId = `${user.uid}_${date}`
      const docRef = doc(db, 'daily_metrics', docId)

      // Use setDoc with merge: true to create if not exists
      await setDoc(
        docRef,
        {
          userId: user.uid,
          date,
          waterIntake,
          viewers: [user.uid], // Ensure security rules work
          // If creating new, these might be missing, handled by defaults in types or separate logic?
          // For now, partial updates are fine for existing docs, but new docs need required fields?
          // Simplification: We merge. If other fields are missing, they are undefined.
          // Warning: Schema validation might strictly require them if we validate on write.
          // But here we are just writing.
        },
        { merge: true }
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: METRICS_KEYS.byDate(variables.date) })
    },
  })
}
