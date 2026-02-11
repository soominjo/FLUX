import { useState, useEffect } from 'react'
import { ArrowLeft, Activity, FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Label, cn } from '@repo/ui'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useAuth } from '../../providers/AuthProvider'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { ChatBox } from '../../components/chat/ChatBox'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { ClinicalNote } from '@repo/shared'

interface PhysioPatientViewProps {
  patientId: string
  onBack: () => void
}

export function PhysioPatientView({ patientId, onBack }: PhysioPatientViewProps) {
  const { user } = useAuth()
  const { data: workouts, isLoading } = useWorkouts(patientId)

  // Pain Filter State
  const [showHighPainOnly, setShowHighPainOnly] = useState(false)

  // Clinical Notes State
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Filter workouts if toggle is on
  const displayedWorkouts = showHighPainOnly
    ? workouts?.filter(w => w.perceivedPain && w.perceivedPain > 0)
    : workouts

  // Fetch Clinical Notes (Real-time)
  useEffect(() => {
    if (!patientId) return

    // Sub-collection: users/{patientId}/clinical_notes
    const q = query(
      collection(db, `users/${patientId}/clinical_notes`),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, snapshot => {
      const fetchedNotes = snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as ClinicalNote
      )
      setNotes(fetchedNotes)
    })

    return () => unsubscribe()
  }, [patientId])

  const handleSaveNote = async () => {
    if (!newNote.trim() || !user) return

    setIsSavingNote(true)
    try {
      await addDoc(collection(db, `users/${patientId}/clinical_notes`), {
        physioId: user.uid,
        patientId: patientId,
        content: newNote,
        timestamp: serverTimestamp(),
      })

      // Trigger notification for the patient
      await addDoc(collection(db, 'notifications'), {
        userId: patientId,
        title: 'New Clinical Note',
        body: 'Your Physio has added a new recovery note.',
        read: false,
        createdAt: serverTimestamp(),
      })

      setNewNote('')
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save clinical note.')
    } finally {
      setIsSavingNote(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header / Nav */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Patient Recovery View</h1>
            <p className="text-zinc-400 text-sm font-mono">Patient ID: {patientId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Col: Activity & Pain Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-lime-400" />
                Workout Log
              </h3>
              <div className="flex items-center gap-2">
                <label
                  className="text-sm text-zinc-400 cursor-pointer select-none"
                  htmlFor="pain-toggle"
                >
                  Show High Pain Only
                </label>
                <div
                  onClick={() => setShowHighPainOnly(!showHighPainOnly)}
                  className={cn(
                    'w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer px-1',
                    showHighPainOnly ? 'bg-red-500/80' : 'bg-zinc-700'
                  )}
                  id="pain-toggle"
                >
                  <div
                    className={cn(
                      'w-4 h-4 bg-white rounded-full transition-transform',
                      showHighPainOnly ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="text-zinc-500">Loading patient activity...</div>
              ) : displayedWorkouts && displayedWorkouts.length > 0 ? (
                displayedWorkouts.map(workout => (
                  <ActivityFeedItem key={workout.id} workout={workout} showUser={false} />
                ))
              ) : (
                <div className="p-8 border border-zinc-800 rounded-lg bg-zinc-900/50 text-center">
                  <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">
                    {showHighPainOnly
                      ? 'No workouts with reported pain found.'
                      : 'No workouts logged yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Clinical Notes */}
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900 sticky top-8">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  Clinical Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* New Note Form */}
                <div className="space-y-3">
                  <Label>Add New Note</Label>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="w-full min-h-[100px] bg-zinc-950 border border-zinc-800 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-zinc-600 resize-none"
                    placeholder="Document symptoms, progress, or treatment plan..."
                  />
                  <Button
                    onClick={handleSaveNote}
                    disabled={isSavingNote || !newNote.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isSavingNote ? 'Saving...' : 'Save Note'}
                  </Button>
                </div>

                <div className="h-[1px] bg-zinc-800 w-full" />

                {/* Notes History */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    History
                  </h4>
                  {notes.length > 0 ? (
                    notes.map(note => (
                      <div
                        key={note.id}
                        className="bg-zinc-950/50 border border-zinc-800 rounded p-3 text-sm"
                      >
                        <p className="text-zinc-300 whitespace-pre-wrap">{note.content}</p>
                        <div className="mt-2 text-xs text-zinc-600 flex justify-between">
                          <span>
                            {note.timestamp
                              ? new Date(note.timestamp.seconds * 1000).toLocaleString()
                              : 'Just now'}
                          </span>
                          <span>By Physio</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-600 text-sm italic">No clinical notes yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Chat with Patient */}
            <ChatBox otherUserId={patientId} />
          </div>
        </div>
      </div>
    </div>
  )
}
