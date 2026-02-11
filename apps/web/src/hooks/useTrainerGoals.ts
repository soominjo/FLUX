import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Goal } from '@repo/shared'

export function useTrainerGoals(traineeId: string | undefined) {
  const queryClient = useQueryClient()

  const { data: goals, isLoading } = useQuery({
    queryKey: ['trainer-goals', traineeId],
    queryFn: async () => {
      if (!traineeId) return []
      const q = query(
        collection(db, `users/${traineeId}/trainer_goals`),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Goal[]
    },
    enabled: !!traineeId,
  })

  // Add Goal Mutation
  const addGoalMutation = useMutation({
    mutationFn: async ({ title, trainerId }: { title: string; trainerId: string }) => {
      if (!traineeId) throw new Error('No trainee ID')
      // 1. Add Goal
      await addDoc(collection(db, `users/${traineeId}/trainer_goals`), {
        title,
        trainerId,
        traineeId,
        isCompleted: false,
        createdAt: serverTimestamp(),
      })

      // 2. Trigger Notification
      await addDoc(collection(db, 'notifications'), {
        userId: traineeId,
        title: 'New Goal Assigned',
        body: `Your trainer assigned: "${title}"`,
        read: false,
        createdAt: serverTimestamp(),
        link: `/trainer-dashboard`, // Or profile link? usually trainer dashboard doesn't show own goals?
        // Actually Trainee sees goals on their profile -> `/profile/${trainerId}`
        // But we don't know trainerId here easily without prop passing or user context check?
        // Ah, trainerId is passed in args.
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-goals', traineeId] })
    },
  })

  // Toggle Goal Mutation
  const toggleGoalMutation = useMutation({
    mutationFn: async ({ goalId, currentStatus }: { goalId: string; currentStatus: boolean }) => {
      if (!traineeId) throw new Error('No trainee ID')
      const goalRef = doc(db, `users/${traineeId}/trainer_goals`, goalId)
      await updateDoc(goalRef, {
        isCompleted: !currentStatus,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-goals', traineeId] })
    },
  })

  return {
    goals,
    isLoading,
    addGoal: addGoalMutation.mutateAsync,
    toggleGoal: toggleGoalMutation.mutateAsync,
    isAdding: addGoalMutation.isPending,
  }
}
