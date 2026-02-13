import { useState, useEffect } from 'react'
import { Activity, FileText, Plus, ArrowLeft, Trash2, Pencil, Save, X } from 'lucide-react'
import { Card, CardContent, Button } from '@repo/ui'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useAuth } from '../../providers/AuthProvider'
import { useUserProfile } from '../../hooks/useSocial'
import { useClinicalNotes } from '../../hooks/useClinicalNotes'
import { PatientWorkoutCard } from './PatientWorkoutCard'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { ClinicalNote } from '@repo/shared'

interface PhysioPatientViewProps {
  patientId: string
  onBack?: () => void
}

export function PhysioPatientView({ patientId, onBack }: PhysioPatientViewProps) {
  const { user } = useAuth()
  const { data: workouts, isLoading: isLoadingWorkouts } = useWorkouts(patientId)
  const { data: patientProfile, isLoading: isLoadingProfile } = useUserProfile(patientId)
  const { bulkDeleteNotes, isBulkDeleting, updateNote, deleteNote } = useClinicalNotes(patientId)

  // Clinical Notes State
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isUpdatingNote, setIsUpdatingNote] = useState(false)

  // Note Context (Global or specific workout)
  const [linkedWorkoutId, setLinkedWorkoutId] = useState<string | null>(null)

  // Fetch Clinical Notes (Real-time)
  useEffect(() => {
    if (!patientId) return

    const q = query(
      collection(db, `users/${patientId}/clinical_notes`),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, snapshot => {
      const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ClinicalNote)
      setNotes(fetchedNotes)
    })

    return () => unsubscribe()
  }, [patientId])

  const handleSaveNote = async () => {
    if (!newNote.trim() || !user) return

    setIsSavingNote(true)
    try {
      const noteData: Record<string, unknown> = {
        physioId: user.uid,
        patientId: patientId,
        content: newNote,
        timestamp: serverTimestamp(),
      }

      if (linkedWorkoutId) {
        ;(noteData as Record<string, unknown>).workoutId = linkedWorkoutId
      }

      await addDoc(collection(db, `users/${patientId}/clinical_notes`), noteData)

      // Notify patient
      await addDoc(collection(db, 'notifications'), {
        userId: patientId,
        title: 'New Clinical Note',
        body: 'Your Physio has added a new recovery note.',
        read: false,
        createdAt: serverTimestamp(),
      })

      setNewNote('')
      setNoteModalOpen(false)
      setLinkedWorkoutId(null)
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsSavingNote(false)
    }
  }

  const openNoteModal = (workoutId?: string) => {
    setLinkedWorkoutId(workoutId || null)
    setNoteModalOpen(true)
  }

  const handleBulkDelete = async () => {
    if (!notes.length) return
    try {
      const result = await bulkDeleteNotes(patientId)
      console.log(`Deleted ${result.deletedCount} clinical notes`)
      setShowBulkDeleteConfirm(false)
      // Notes will be automatically updated by the Firestore listener
    } catch (error) {
      console.error('Error deleting notes:', error)
      alert('Failed to delete clinical notes. Please try again.')
    }
  }

  const handleEditNote = (note: ClinicalNote) => {
    setEditingNoteId(note.id!)
    setEditContent(note.content)
  }

  const handleSaveEditNote = async (noteId: string) => {
    if (!editContent.trim()) return
    setIsUpdatingNote(true)
    try {
      await updateNote(noteId, editContent, patientId)
      setEditingNoteId(null)
      setEditContent('')
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note. Please try again.')
    } finally {
      setIsUpdatingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (
      !window.confirm('Are you sure you want to delete this note? This action cannot be undone.')
    ) {
      return
    }
    try {
      await deleteNote(noteId, patientId)
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note. Please try again.')
    }
  }

  if (isLoadingProfile)
    return <div className="p-8 text-center text-zinc-500">Loading patient details...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Patient Stats Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">{patientProfile?.displayName}</h2>
            <p className="text-zinc-400 text-sm">Patient ID: {patientId.slice(0, 8)}...</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
            <div className="text-xs text-zinc-500 uppercase">Height</div>
            <div className="font-mono font-bold text-white">
              {patientProfile?.metrics?.heightCm ? `${patientProfile.metrics.heightCm}cm` : '--'}
            </div>
          </div>
          <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
            <div className="text-xs text-zinc-500 uppercase">Weight</div>
            <div className="font-mono font-bold text-white">
              {patientProfile?.metrics?.weightKg ? `${patientProfile.metrics.weightKg}kg` : '--'}
            </div>
          </div>
          <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
            <div className="text-xs text-zinc-500 uppercase">BMI</div>
            <div className="font-mono font-bold text-lime-400">
              {patientProfile?.metrics?.bmi || '--'}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-zinc-800 w-full" />

      {/* 2. Clinical Notes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Clinical Notes
          </h3>
          <div className="flex gap-2">
            {notes.length > 0 && (
              <Button
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isBulkDeleting}
                className="bg-red-900/40 hover:bg-red-900 text-red-300 font-semibold h-8 text-xs border border-red-800"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {isBulkDeleting ? 'Deleting...' : 'Clear All'}
              </Button>
            )}
            <Button
              onClick={() => openNoteModal()}
              className="bg-lime-500 hover:bg-lime-600 text-black font-semibold h-8 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add New Note
            </Button>
          </div>
        </div>

        {/* Recent Notes List (Scrollable - Fixed Overflow) */}
        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 border border-zinc-900 rounded-lg bg-zinc-900/30 p-2">
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map(note => {
                const isAuthor = user?.uid === note.physioId
                return (
                  <Card
                    key={note.id}
                    className="bg-zinc-900 border-zinc-800 group hover:border-zinc-700 transition-colors relative"
                  >
                    <CardContent className="p-3">
                      {editingNoteId === note.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-300 text-sm focus:ring-1 focus:ring-lime-400 outline-none resize-none min-h-[80px]"
                            placeholder="Edit your note..."
                            autoFocus
                            disabled={isUpdatingNote}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingNoteId(null)
                                setEditContent('')
                              }}
                              className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                              title="Cancel"
                              disabled={isUpdatingNote}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleSaveEditNote(note.id!)}
                              className="text-lime-400 hover:text-lime-300 transition-colors disabled:opacity-50"
                              title="Save Changes"
                              disabled={isUpdatingNote || !editContent.trim()}
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap pr-12">
                            {note.content}
                          </p>
                          <div className="mt-2 flex justify-between items-center text-xs text-zinc-500">
                            <span>
                              {note.timestamp
                                ? new Date(note.timestamp.seconds * 1000).toLocaleDateString()
                                : 'Just now'}
                            </span>
                            <div className="flex items-center gap-2">
                              {((note as Record<string, unknown>).workoutId as boolean) && (
                                <span className="text-lime-400/70 flex items-center gap-1">
                                  <Activity className="h-3 w-3" /> Linked to Workout
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>

                    {/* Actions for Author */}
                    {isAuthor && !editingNoteId && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-zinc-950/80 p-1.5 rounded backdrop-blur-sm border border-zinc-800/50">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="text-zinc-400 hover:text-lime-400 p-1 transition-colors"
                          title="Edit Note"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id!)}
                          className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No clinical notes recorded yet.
            </div>
          )}
        </div>
      </div>

      <div className="h-[1px] bg-zinc-800 w-full" />

      {/* 3. Patient Workouts (Secure View) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          Recent Activity
        </h3>

        <div className="space-y-4 pb-8">
          {isLoadingWorkouts ? (
            <div className="text-zinc-500 text-sm">Loading activity...</div>
          ) : workouts && workouts.length > 0 ? (
            workouts.map(workout => (
              <PatientWorkoutCard
                key={workout.id}
                workout={workout}
                notes={notes.filter(
                  (n: Record<string, unknown>) =>
                    (n as Record<string, unknown>).workoutId === workout.id
                )}
                onAddNote={() => openNoteModal(workout.id)}
              />
            ))
          ) : (
            <div className="text-zinc-500 text-sm">No recent workouts found.</div>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add Clinical Note</h3>
            {linkedWorkoutId && (
              <div className="text-xs bg-lime-500/10 text-lime-400 px-2 py-1 rounded inline-block">
                Linking to specific workout
              </div>
            )}
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Enter clinical observations..."
              className="w-full min-h-[150px] bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-lime-400 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setNoteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={isSavingNote || !newNote.trim()}
                className="bg-lime-500 hover:bg-lime-600 text-black"
              >
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-lg border border-red-800/50 bg-zinc-950 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">Delete All Clinical Notes?</h3>
            <p className="text-zinc-300 text-sm">
              You are about to permanently delete{' '}
              <span className="font-semibold">{notes.length}</span> clinical note
              {notes.length !== 1 ? 's' : ''} for this patient. This action cannot be undone.
            </p>
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
              <p className="text-xs text-red-300">
                ⚠️ This will delete all notes including those linked to specific workouts.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-red-900 hover:bg-red-800 text-red-100 border border-red-700"
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete All Notes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
