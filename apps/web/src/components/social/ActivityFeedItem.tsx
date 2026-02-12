import {
  Card,
  CardContent,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui'
import { motion } from 'framer-motion'
import { Activity, Clock, Flame, Stethoscope, Pencil, Trash2, Save, X } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useToggleKudos, useUserProfile } from '../../hooks/useSocial'
import type { Workout } from '@repo/shared'
import { useState } from 'react'
import { useWorkoutNotes } from '../../hooks/useClinicalNotes'
import { toast } from 'sonner'

interface ActivityFeedItemProps {
  workout: Workout
  showUser?: boolean
  isNested?: boolean
}

export function ActivityFeedItem({
  workout,
  showUser = true,
  isNested = false,
}: ActivityFeedItemProps) {
  const { user } = useAuth()
  const { mutate: toggleKudos } = useToggleKudos()
  const { data: userProfile } = useUserProfile(showUser ? workout.userId : '')
  const { notes, addNote, deleteNote, updateNote } = useWorkoutNotes(workout.id, workout.userId)

  const [newNote, setNewNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const isPhysio = user?.role === 'PHYSIO' || user?.role === 'ADMIN'
  const hasNotes = notes && notes.length > 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = workout as any

  const hasLiked = user && workout.kudos?.includes(user.uid)
  const kudosCount = workout.kudos?.length || 0

  // Handle both old schema (durationMinutes / targetedMuscles) and new (durationMins / muscleGroup)
  const duration = w.durationMins ?? workout.durationMinutes ?? 0
  const musclesLabel = w.muscleGroup ? w.muscleGroup : workout.targetedMuscles?.join(', ') || '—'

  const handleKudos = () => {
    if (!user || !workout.id) return
    toggleKudos({ workoutId: workout.id, currentKudos: workout.kudos || [] })
  }

  // Strain color logic
  const getStrainColor = (score: number) => {
    if (score < 10) return 'text-lime-400'
    if (score < 15) return 'text-yellow-400'
    return 'text-orange-500' // High strain
  }

  const startEditing = (note: Record<string, unknown>) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const saveEdit = async (noteId: string) => {
    if (!editContent.trim()) return
    await updateNote(noteId, editContent)
    setEditingNoteId(null)
  }

  const handleSaveNote = async () => {
    if (!newNote.trim()) return
    setIsSaving(true)
    try {
      await addNote(newNote.trim())
      setNewNote('')
      toast.success('Observation saved to workout.')
    } catch {
      toast.error('Failed to save observation.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card
      className={cn(
        'overflow-hidden',
        isNested ? 'border-none bg-transparent shadow-none' : 'border-zinc-800 bg-zinc-900'
      )}
    >
      <CardContent className="p-0">
        <div className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-white text-lg">
                {w.exerciseName ?? workout.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                {showUser && (
                  <span className="text-zinc-300">
                    {userProfile?.displayName || `User ${workout.userId.slice(0, 4)}`}
                  </span>
                )}
                <span>•</span>
                <span>
                  {workout.date && typeof workout.date !== 'string' && 'seconds' in workout.date
                    ? new Date(workout.date.seconds * 1000).toLocaleDateString()
                    : 'Just now'}
                </span>
              </div>
            </div>
            {/* Strain Badge */}
            <div className="flex flex-col items-end">
              <div className={cn('text-2xl font-bold', getStrainColor(workout.strainScore || 0))}>
                {workout.strainScore || 0}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                Strain
              </div>
            </div>
          </div>

          {/* Body stats */}
          <div className="flex gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {duration} min
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {musclesLabel}
            </span>
          </div>
        </div>

        {/* ── Clinical Observation Section ── */}
        {(isPhysio || hasNotes) && (
          <div className="border-t border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
            <h3 className="text-yellow-500 font-bold text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Clinical Observation
            </h3>

            {/* Existing Notes (visible to everyone) */}
            {hasNotes && (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="group relative flex gap-3 text-sm">
                    <div className="w-1 bg-yellow-500 rounded-full h-auto shrink-0 min-h-[1.5em]" />
                    <div className="flex-1">
                      {editingNoteId === note.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full bg-black/50 border border-zinc-700 rounded p-2 text-zinc-300 text-xs focus:ring-1 focus:ring-yellow-500 outline-none resize-y min-h-[60px]"
                            placeholder="Edit your observation..."
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingNoteId(null)
                                setEditContent('')
                              }}
                              className="text-zinc-500 hover:text-white transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => saveEdit(note.id!)}
                              className="text-yellow-500 hover:text-yellow-400 transition-colors"
                              title="Save Changes"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {note.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-500">
                              {note.timestamp &&
                              typeof note.timestamp === 'object' &&
                              'seconds' in note.timestamp
                                ? new Date(note.timestamp.seconds * 1000).toLocaleDateString()
                                : 'Just now'}
                            </span>
                            <span className="text-[10px] text-yellow-500/50">Clinical Note</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Edit/Delete for the note author only */}
                    {user?.uid === note.physioId && !editingNoteId && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-zinc-950/80 p-1 rounded backdrop-blur-sm border border-zinc-800/50">
                        <button
                          onClick={() => startEditing(note)}
                          className="text-zinc-400 hover:text-yellow-500 p-1 transition-colors"
                          title="Edit Note"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this note?')) {
                              deleteNote(note.id!)
                            }
                          }}
                          className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Note (Physio / Admin only) */}
            {isPhysio && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-700 rounded p-2 text-sm text-white placeholder-zinc-500 focus:ring-1 focus:ring-yellow-500 outline-none resize-none"
                  placeholder="Add clinical context, pain observations, or load restrictions..."
                  rows={2}
                />
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving || !newNote.trim()}
                  className="text-xs font-semibold px-3 py-1.5 rounded border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Observation'}
                </button>
              </div>
            )}

            {/* Empty state for Trainee when no notes exist */}
            {!isPhysio && !hasNotes && (
              <p className="text-sm text-zinc-500 italic">No clinical notes for this session.</p>
            )}
          </div>
        )}

        {/* Footer / Kudos Action */}
        <div className="bg-zinc-950/50 p-3 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {/* Empty slot or comment count placeholder */}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={handleKudos}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm font-medium',
                    hasLiked
                      ? 'bg-lime-400/10 text-lime-400'
                      : 'bg-transparent text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                  )}
                >
                  <Flame className={cn('h-4 w-4', hasLiked ? 'fill-lime-400' : '')} />
                  <span>{kudosCount}</span>
                  {hasLiked && <span className="ml-1 text-xs">Kudos!</span>}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                {workout.kudos && workout.kudos.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-lime-400">Kudos from:</span>
                    {workout.kudos.slice(0, 5).map(uid => (
                      <span key={uid}>User {uid.slice(0, 4)}</span>
                    ))}
                    {workout.kudos.length > 5 && <span>+ {workout.kudos.length - 5} others</span>}
                  </div>
                ) : (
                  <p>Be the first to give kudos!</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}
