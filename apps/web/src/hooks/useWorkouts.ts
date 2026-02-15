import { useState, useEffect } from 'react'
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
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { Workout, WorkoutExerciseLog, WorkoutExerciseLogInput } from '@repo/shared'

// Keys for React Query
export const WORKOUT_KEYS = {
  all: ['workouts'] as const,
  list: () => [...WORKOUT_KEYS.all, 'list'] as const,
  exerciseLogs: () => [...WORKOUT_KEYS.all, 'exercise-logs'] as const,
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

      let q

      if (userId && userId !== currentUser.uid) {
        // Admin / cross-user view: query by userId only (Firestore rules enforce isAdmin)
        q = query(
          collection(db, 'workouts'),
          where('userId', '==', userId),
          orderBy('date', 'desc'),
          limit(20)
        )
      } else if (userId) {
        // Own data with viewers filter
        q = query(
          collection(db, 'workouts'),
          where('userId', '==', userId),
          where('viewers', 'array-contains', currentUser.uid),
          orderBy('date', 'desc'),
          limit(20)
        )
      } else {
        // Feed: all workouts I can see
        q = query(
          collection(db, 'workouts'),
          where('viewers', 'array-contains', currentUser.uid),
          orderBy('date', 'desc'),
          limit(20)
        )
      }

      const querySnapshot = await getDocs(q)
      const workouts: Workout[] = []

      querySnapshot.forEach(doc => {
        const data = doc.data()
        workouts.push({ id: doc.id, ...data } as Workout)
      })

      console.log('FETCHED TEAM ACTIVITY:', workouts.length)
      return workouts
    },
    enabled: !!auth.currentUser, // Only run if logged in
  })
}

// Fetch Workouts in a date range (for aggregated views)
export function useWorkoutsRange(startDate: Date, endDate: Date, userId?: string) {
  return useQuery({
    queryKey: [
      ...WORKOUT_KEYS.all,
      'range',
      startDate.toISOString(),
      endDate.toISOString(),
      userId ?? 'self',
    ],
    queryFn: async (): Promise<Workout[]> => {
      const currentUser = auth.currentUser
      if (!currentUser) return []

      const targetUserId = userId || currentUser.uid
      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', targetUserId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Workout)
    },
    enabled: !!auth.currentUser,
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

// --- Exercise Log CRUD ---

// Fetch exercise logs for current user
export function useExerciseLogs() {
  const [logs, setLogs] = useState<(WorkoutExerciseLog & { id: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const user = auth.currentUser

  useEffect(() => {
    if (!user) {
      setLogs([])
      setIsLoading(false)
      return
    }

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.uid),
      orderBy('performedAt', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as (WorkoutExerciseLog & { id: string })[]

        console.log('FETCHED PERSONAL WORKOUTS:', data)
        setLogs(data)
        setIsLoading(false)
      },
      error => {
        console.error('Error fetching exercise logs:', error)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  return { data: logs, isLoading }
}

// Add a single exercise log
export function useAddWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: WorkoutExerciseLogInput) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      // 1. Fetch active providers so the document is visible on their dashboards
      const relQuery = query(
        collection(db, 'relationships'),
        where('traineeId', '==', user.uid),
        where('status', '==', 'ACTIVE')
      )
      const relSnapshot = await getDocs(relQuery)
      const providerIds = relSnapshot.docs.map(d => d.data().providerId as string)

      // 2. Build the document with injected server-side fields
      const newDoc = {
        ...input,
        userId: user.uid,
        viewers: [user.uid, ...providerIds], // Trainee + all active providers
        performedAt: serverTimestamp(),
        date: serverTimestamp(), // useWorkouts queries orderBy('date') — must exist for visibility
      }

      const docRef = await addDoc(collection(db, 'workouts'), newDoc)
      return { id: docRef.id, ...newDoc }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.all })
    },
  })
}

// Update an existing exercise log
export function useUpdateWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WorkoutExerciseLogInput> }) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      await updateDoc(doc(db, 'workouts', id), data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.all })
    },
  })
}

// Delete an exercise log (optimistic)
export function useDeleteWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      await deleteDoc(doc(db, 'workouts', id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.all })
    },
  })
}
