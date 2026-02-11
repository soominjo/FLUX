import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { UserProfile } from '@repo/shared'
import { WORKOUT_KEYS } from './useWorkouts'

export const SOCIAL_KEYS = {
  profile: (uid: string) => ['user', uid] as const,
}

// 1. Fetch User Profile
export function useUserProfile(uid: string) {
  return useQuery({
    queryKey: SOCIAL_KEYS.profile(uid),
    queryFn: async (): Promise<UserProfile | null> => {
      if (!uid) return null
      const docRef = doc(db, 'users', uid)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        return snap.data() as UserProfile
      }
      return null
    },
    enabled: !!uid,
  })
}

// 2. Toggle Kudos
export function useToggleKudos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      workoutId,
      currentKudos,
    }: {
      workoutId: string
      currentKudos: string[]
    }) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      const docRef = doc(db, 'workouts', workoutId)
      const hasLiked = currentKudos.includes(user.uid)

      if (hasLiked) {
        await updateDoc(docRef, {
          kudos: arrayRemove(user.uid),
        })
      } else {
        await updateDoc(docRef, {
          kudos: arrayUnion(user.uid),
        })
      }
    },
    onSuccess: () => {
      // Invalidate workout lists so UI updates
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.all })
    },
  })
}
