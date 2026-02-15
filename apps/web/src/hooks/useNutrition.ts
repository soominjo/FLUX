import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { Nutrition } from '@repo/shared'

export const NUTRITION_KEYS = {
  all: ['nutrition'] as const,
  byDate: (date: string) => [...NUTRITION_KEYS.all, 'date', date] as const,
  byRange: (start: string, end: string) => [...NUTRITION_KEYS.all, 'range', start, end] as const,
}

// Fetch Nutrition by date (YYYY-MM-DD), optionally for a specific user (admin view)
export function useNutrition(dateString: string, userId?: string) {
  return useQuery({
    queryKey: userId
      ? [...NUTRITION_KEYS.byDate(dateString), 'user', userId]
      : NUTRITION_KEYS.byDate(dateString),
    queryFn: async (): Promise<Nutrition[]> => {
      const user = auth.currentUser
      if (!user) return []

      let q
      if (userId && userId !== user.uid) {
        // Admin / cross-user view: query by userId directly (Firestore rules enforce isAdmin)
        q = query(
          collection(db, 'nutrition'),
          where('userId', '==', userId),
          where('date', '==', dateString)
        )
      } else {
        q = query(
          collection(db, 'nutrition'),
          where('viewers', 'array-contains', user.uid),
          where('date', '==', dateString)
        )
      }

      const querySnapshot = await getDocs(q)
      const logs: Nutrition[] = []

      querySnapshot.forEach(doc => {
        const data = doc.data()
        logs.push({ id: doc.id, ...data } as Nutrition)
      })

      return logs
    },
    enabled: !!auth.currentUser,
  })
}

// Fetch Nutrition for a date range (YYYY-MM-DD to YYYY-MM-DD), optionally for a specific user.
// Fetches all logs for the user then filters client-side to avoid Firestore composite-index issues.
export function useNutritionRange(startDate: string, endDate: string, userId?: string) {
  return useQuery({
    queryKey: userId
      ? [...NUTRITION_KEYS.byRange(startDate, endDate), 'user', userId]
      : NUTRITION_KEYS.byRange(startDate, endDate),
    queryFn: async (): Promise<Nutrition[]> => {
      const user = auth.currentUser
      if (!user) return []

      const targetUserId = userId || user.uid

      // Single filter by userId — no composite index required
      const q = query(collection(db, 'nutrition'), where('userId', '==', targetUserId))

      try {
        const snapshot = await getDocs(q)
        const allLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Nutrition)

        // Client-side date filter (string comparison works for YYYY-MM-DD format)
        const filtered = allLogs.filter(log => log.date >= startDate && log.date <= endDate)

        // Sort by createdAt desc so newest meals appear first
        return filtered.sort((a, b) => {
          const aTime = (a as Record<string, unknown>).createdAt
          const bTime = (b as Record<string, unknown>).createdAt
          if (!aTime || !bTime) return 0
          const aMs =
            typeof aTime === 'object' && 'toMillis' in (aTime as object)
              ? (aTime as { toMillis: () => number }).toMillis()
              : 0
          const bMs =
            typeof bTime === 'object' && 'toMillis' in (bTime as object)
              ? (bTime as { toMillis: () => number }).toMillis()
              : 0
          return bMs - aMs
        })
      } catch (err) {
        console.error('[useNutritionRange] Firestore query failed:', err)
        return []
      }
    },
    enabled: !!auth.currentUser,
  })
}

export function useLogNutrition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      date,
      ...nutritionData
    }: Omit<Nutrition, 'id' | 'userId' | 'viewers' | 'date'> & { date?: string }) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      // If a target date is provided (e.g. logging on "Yesterday"), use it.
      // Otherwise default to the current *local* date (avoids UTC shift at night).
      const now = new Date()
      const dateString =
        date ??
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      // 1. Fetch active providers to share data with
      const q = query(
        collection(db, 'relationships'),
        where('traineeId', '==', user.uid),
        where('status', '==', 'ACTIVE')
      )
      const relSnapshot = await getDocs(q)
      const providerIds = relSnapshot.docs.map(doc => doc.data().providerId)

      const newLog = {
        ...nutritionData,
        userId: user.uid,
        viewers: [user.uid, ...providerIds],
        date: dateString, // Storing as string "2023-10-26"
        createdAt: serverTimestamp(), // Keep a creation timestamp for ordering if needed
      }

      await addDoc(collection(db, 'nutrition'), newLog)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NUTRITION_KEYS.all })
    },
  })
}

// Update a nutrition log
export function useUpdateNutrition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Nutrition, 'id' | 'userId' | 'viewers'>>
    }) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      await updateDoc(doc(db, 'nutrition', id), data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NUTRITION_KEYS.all })
    },
  })
}

// Delete a nutrition log
export function useDeleteNutrition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      await deleteDoc(doc(db, 'nutrition', id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NUTRITION_KEYS.all })
    },
  })
}
