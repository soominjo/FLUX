import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { ClinicalNote } from '@repo/shared'
import { useAuth } from '../providers/AuthProvider'

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

  // Update Note Mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({
      noteId,
      content,
      patientId,
    }: {
      noteId: string
      content: string
      patientId: string
    }) => {
      await updateDoc(doc(db, `users/${patientId}/clinical_notes`, noteId), { content })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', traineeId, physioId] })
    },
  })

  // Delete Note Mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async ({ noteId, patientId }: { noteId: string; patientId: string }) => {
      await deleteDoc(doc(db, `users/${patientId}/clinical_notes`, noteId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', traineeId, physioId] })
    },
  })

  // Bulk Delete All Notes Mutation — deletes ALL notes for a patient in a single batch transaction
  const bulkDeleteNotesMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!patientId) throw new Error('Patient ID is required for bulk delete')

      try {
        // Query all clinical notes for this patient
        const q = query(collection(db, `users/${patientId}/clinical_notes`))
        const snapshot = await getDocs(q)

        // If no notes found, return early
        if (snapshot.empty) {
          console.log('[useClinicalNotes] No notes found for patient:', patientId)
          return { deletedCount: 0 }
        }

        // Batch delete all notes in a single transaction
        const batch = writeBatch(db)
        snapshot.docs.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref)
        })

        await batch.commit()
        console.log(
          '[useClinicalNotes] Successfully bulk deleted',
          snapshot.docs.length,
          'notes for patient:',
          patientId
        )

        return { deletedCount: snapshot.docs.length }
      } catch (err) {
        console.error('[useClinicalNotes] BULK DELETE ERROR:', err)
        alert(
          '[Clinical Notes] Failed to delete notes: ' +
            (err instanceof Error ? err.message : String(err))
        )
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', traineeId, physioId] })
    },
  })

  // Wrapper functions with simpler signatures for easier consumption
  const updateNote = async (noteId: string, content: string, patientId: string) => {
    await updateNoteMutation.mutateAsync({ noteId, content, patientId })
  }

  const deleteNote = async (noteId: string, patientId: string) => {
    await deleteNoteMutation.mutateAsync({ noteId, patientId })
  }

  return {
    data: data ?? [],
    isLoading,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
    updateNote,
    updateNoteMutation,
    deleteNote,
    deleteNoteMutation,
    bulkDeleteNotes: bulkDeleteNotesMutation.mutateAsync,
    isBulkDeleting: bulkDeleteNotesMutation.isPending,
  }
}

export function useWorkoutNotes(workoutId: string | undefined, patientId: string | undefined) {
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!workoutId || !patientId) {
      setNotes([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const q = query(
      collection(db, `users/${patientId}/clinical_notes`),
      where('workoutId', '==', workoutId),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const fetchedNotes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ClinicalNote[]
        setNotes(fetchedNotes)
        setIsLoading(false)
      },
      error => {
        console.error('Error fetching workout notes:', error)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [workoutId, patientId])

  const addNote = async (content: string) => {
    if (!user || !workoutId || !patientId) {
      console.error('[useClinicalNotes] Cannot add note: Missing user, workoutId, or patientId', {
        user,
        workoutId,
        patientId,
      })
      return
    }

    console.log('[useClinicalNotes] ADDING NOTE:', {
      content,
      physioId: user.uid,
      patientId,
      workoutId,
    })

    await addDoc(collection(db, `users/${patientId}/clinical_notes`), {
      content,
      physioId: user.uid, // Explicitly set using auth user
      patientId,
      workoutId,
      timestamp: serverTimestamp(),
    })
  }

  const deleteNote = async (noteId: string) => {
    if (!user || !patientId) return
    await deleteDoc(doc(db, `users/${patientId}/clinical_notes`, noteId))
  }

  const updateNote = async (noteId: string, content: string) => {
    if (!user || !patientId) return
    await updateDoc(doc(db, `users/${patientId}/clinical_notes`, noteId), {
      content,
      updatedAt: serverTimestamp(),
    })
  }

  return { notes, isLoading, addNote, deleteNote, updateNote }
}
