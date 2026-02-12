import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs, orderBy, limit, DocumentData } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { Workout, Relationship } from '@repo/shared'

export const TEAM_ACTIVITY_KEYS = {
  all: ['teamActivity'] as const,
  feed: (userId: string) => [...TEAM_ACTIVITY_KEYS.all, 'feed', userId] as const,
}

/**
 * Fetches workouts from connected workout buddies (co-trainees).
 *
 * Flow:
 * 1. Query active BUDDY relationships where user is trainee or provider
 * 2. Extract buddy UIDs (the other person in the relationship)
 * 3. Query workouts from those UIDs using Firestore 'in' operator
 * 4. Order by createdAt/date descending, limit 20
 */
export function useTeamActivity() {
  return useQuery({
    queryKey: TEAM_ACTIVITY_KEYS.feed(auth.currentUser?.uid || ''),
    queryFn: async (): Promise<Workout[]> => {
      const user = auth.currentUser
      if (!user) return []

      try {
        // Step 1: Get all active BUDDY relationships
        const relQuery = query(
          collection(db, 'relationships'),
          where('status', '==', 'ACTIVE'),
          where('type', '==', 'BUDDY')
        )

        const relSnapshot = await getDocs(relQuery)
        const buddyIds: Set<string> = new Set()

        // Step 2: Extract buddy IDs
        relSnapshot.forEach(doc => {
          const rel = doc.data() as Relationship
          // If I'm the trainee, the buddy is the provider
          if (rel.traineeId === user.uid) {
            buddyIds.add(rel.providerId)
          }
          // If I'm the provider, the buddy is the trainee
          if (rel.providerId === user.uid) {
            buddyIds.add(rel.traineeId)
          }
        })

        // If no buddies, return empty
        if (buddyIds.size === 0) {
          console.log('useTeamActivity: No buddy connections found')
          return []
        }

        const buddyIdArray = Array.from(buddyIds)
        console.log('Fetching workouts from buddies:', buddyIdArray)

        // Step 3: Query workouts from buddy IDs
        // Note: Firestore 'in' operator has a 10-item limit, and requires a composite index for orderBy + in
        // If this fails, we'll log the index creation link
        const workoutQuery = query(
          collection(db, 'workouts'),
          where('userId', 'in', buddyIdArray),
          orderBy('date', 'desc'),
          limit(20)
        )

        const workoutSnapshot = await getDocs(workoutQuery)
        const workouts: Workout[] = []

        workoutSnapshot.forEach((doc: DocumentData) => {
          const data = doc.data()
          workouts.push({ id: doc.id, ...data } as Workout)
        })

        console.log(`useTeamActivity: Fetched ${workouts.length} buddy workouts`)
        return workouts
      } catch (error: unknown) {
        // If it's a firestore index error, log helpful message
        if (error instanceof Error && error.message.includes('index')) {
          console.error(
            'Firestore index required. Create composite index for: (workouts: userId IN, date DESC)',
            error
          )
          // You can also extract and log the index creation link from the error message if needed
          console.info(
            'Visit Firebase Console -> Firestore Database -> Indexes to create composite index'
          )
        }
        console.error('Error fetching team activity:', error)
        return []
      }
    },
    enabled: !!auth.currentUser,
  })
}
