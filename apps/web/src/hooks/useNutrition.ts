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
}

// Fetch Nutrition by date (YYYY-MM-DD)
export function useNutrition(dateString: string) {
  return useQuery({
    queryKey: NUTRITION_KEYS.byDate(dateString),
    queryFn: async (): Promise<Nutrition[]> => {
      const user = auth.currentUser
      if (!user) return []

      const q = query(
        collection(db, 'nutrition'),
        where('viewers', 'array-contains', user.uid),
        // Match exact string "YYYY-MM-DD"
        where('date', '==', dateString)
        // For simple string dates, simple ordering by name or creation time if we had it
        // If we want order, we might need a secondary timestamp field, but for now date string grouping is key.
        // Let's just order by name or rely on default insertion order if 'createdAt' isn't explicitly there yet.
        // Actually, let's just remove orderBy for now or add acreatedAt if we change the schema.
        // For now, removing orderBy to avoid index requirements on a hybrid field if not needed.
      )

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

export function useLogNutrition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (nutritionData: Omit<Nutrition, 'id' | 'userId' | 'viewers' | 'date'>) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      // Use local date string for simplicity in V1 to match the query "YYYY-MM-DD"
      // In a real app, handle timezones carefully.
      const dateString = new Date().toISOString().split('T')[0]

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
