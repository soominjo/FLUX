import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { ClinicalNote } from '@repo/shared'

export function useClinicalNotes(traineeId: string | undefined, physioId?: string) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['clinical-notes', traineeId, physioId],
    queryFn: async () => {
      if (!traineeId) return []

      const collectionPath = `users/${traineeId}/clinical_notes`
      console.log(
        '[useClinicalNotes] READING FROM PATH:',
        collectionPath,
        '| physioId filter:',
        physioId ?? 'NONE'
      )

      // Build query on the trainee's sub-collection
      let q = query(
        collection(db, 'users', traineeId, 'clinical_notes'),
        orderBy('timestamp', 'desc')
      )

      // Filter by specific physio if provided
      if (physioId) {
        q = query(
          collection(db, 'users', traineeId, 'clinical_notes'),
          where('physioId', '==', physioId),
          orderBy('timestamp', 'desc')
        )
      }

      try {
        const snapshot = await getDocs(q)
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ClinicalNote[]
        console.log('[useClinicalNotes] FETCHED', results.length, 'notes from', collectionPath)
        return results
      } catch (err) {
        console.error('[useClinicalNotes] FIRESTORE READ ERROR:', err)
        alert(
          '[Clinical Notes] Firestore read error: ' +
            (err instanceof Error ? err.message : String(err))
        )
        throw err
      }
    },
    enabled: !!traineeId,
  })

  // Log query error from React Query
  if (error) {
    console.error('[useClinicalNotes] React Query error:', error)
  }

  // Add Note Mutation — requires explicit patientId parameter
  const addNoteMutation = useMutation({
    mutationFn: async ({
      content,
      physioId: pId,
      patientId,
    }: {
      content: string
      physioId: string
      patientId: string
    }) => {
      const writePath = `users/${patientId}/clinical_notes`
      console.log('SAVING NOTE TO PATH:', writePath)

      try {
        // 1. Add Note to the PATIENT's sub-collection (not the physio's)
        await addDoc(collection(db, 'users', patientId, 'clinical_notes'), {
          content,
          physioId: pId,
          patientId,
          timestamp: serverTimestamp(),
        })

        // 2. Trigger Notification for the patient
        await addDoc(collection(db, 'notifications'), {
          userId: patientId,
          title: 'New Clinical Note',
          body: 'Your Physio has added a new recovery note.',
          read: false,
          createdAt: serverTimestamp(),
        })

        console.log('[useClinicalNotes] Note saved + notification sent for patient:', patientId)
      } catch (err) {
        console.error('[useClinicalNotes] FIRESTORE WRITE ERROR:', err)
        alert(
          '[Clinical Notes] Failed to save note: ' +
            (err instanceof Error ? err.message : String(err))
        )
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', traineeId, physioId] })
    },
  })

  return {
    data: data ?? [],
    isLoading,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
  }
}
