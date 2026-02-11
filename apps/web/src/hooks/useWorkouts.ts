import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { Workout } from '@repo/shared'

// Keys for React Query
export const WORKOUT_KEYS = {
  all: ['workouts'] as const,
  list: () => [...WORKOUT_KEYS.all, 'list'] as const,
}

// Fetch Workouts Hook
export function useWorkouts(userId?: string) {
  return useQuery({
    queryKey: userId ? [...WORKOUT_KEYS.all, 'user', userId] : WORKOUT_KEYS.list(),
    queryFn: async (): Promise<Workout[]> => {
      const currentUser = auth.currentUser
      if (!currentUser) return []

      // If userId is provided, we fetch *that* user's workouts (Security: works if we are in viewers)
      // If no userId, we fetch the current user's feed (or just their own workouts? Defaulting to "My Feed" logic implies reading anything I have access to?)
      // Original logic was: where('viewers', 'array-contains', user.uid) -> This actually fetches ALL workouts I can see!
      // So if I pass userId, I should add an EXTRA filter: where('userId', '==', targetUserId).

      let q = query(
        collection(db, 'workouts'),
        where('viewers', 'array-contains', currentUser.uid),
        orderBy('date', 'desc'),
        limit(20)
      )

      if (userId) {
        q = query(
          collection(db, 'workouts'),
          where('userId', '==', userId),
          where('viewers', 'array-contains', currentUser.uid), // Still enforce I am a viewer
          orderBy('date', 'desc'),
          limit(20)
        )
      }

      const querySnapshot = await getDocs(q)
      const workouts: Workout[] = []

      querySnapshot.forEach(doc => {
        // We know the data shape matches, but use 'as' for TS happiness
        const data = doc.data()
        // Convert Firestore Timestamp to Date/String if needed or keep as is.
        // For UI, we often want JS Dates.
        // Zod schema says date: z.date().or(z.any())
        workouts.push({ id: doc.id, ...data } as Workout)
      })

      return workouts
    },
    enabled: !!auth.currentUser, // Only run if logged in
  })
}

// Log Workout Mutation Hook
export function useLogWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workoutData: Omit<Workout, 'id' | 'userId' | 'viewers' | 'date'>) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      // 1. Fetch my active providers (trainers/physios) to share data with
      // We could use the useMyProviders hook logic here, but hooks can't be called inside async functions.
      // So we execute a direct Firestore query.
      const q = query(
        collection(db, 'relationships'),
        where('traineeId', '==', user.uid),
        where('status', '==', 'ACTIVE')
      )
      const relSnapshot = await getDocs(q)
      const providerIds = relSnapshot.docs.map(doc => doc.data().providerId)

      // 2. Create the workout with the viewers array
      const newWorkout = {
        ...workoutData,
        userId: user.uid,
        viewers: [user.uid, ...providerIds], // Security: Trainee + Providers
        kudos: [], // Default empty kudos
        date: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'workouts'), newWorkout)
      return { id: docRef.id, ...newWorkout }
    },
    onSuccess: () => {
      // Invalidate query to refetch list
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.list() })
    },
  })
}
