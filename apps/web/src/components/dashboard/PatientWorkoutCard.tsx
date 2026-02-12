import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { FileText } from 'lucide-react'
import type { Workout, ClinicalNote } from '@repo/shared'

interface PatientWorkoutCardProps {
  workout: Workout
  notes: ClinicalNote[]
  onAddNote: () => void
}

export function PatientWorkoutCard({ workout, notes, onAddNote }: PatientWorkoutCardProps) {
  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden mb-4 transition-all hover:border-zinc-700">
      {/* 1. The Workout (Read-Only) */}
      <div className="p-0">
        <ActivityFeedItem workout={workout} showUser={false} isNested={true} />
      </div>

      {/* 2. The "Comments" Section (Clinical Notes) */}
      {notes.length > 0 && (
        <div className="bg-zinc-950/50 border-t border-zinc-800 p-3 space-y-2">
          {notes.map(note => (
            <div key={note.id} className="flex gap-3 text-sm animate-in fade-in duration-300">
              <div className="w-1 bg-lime-500 rounded-full h-auto shrink-0 min-h-[1.5em]" />
              <div className="flex-1">
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {note.timestamp &&
                    typeof note.timestamp === 'object' &&
                    'seconds' in note.timestamp
                      ? new Date(note.timestamp.seconds * 1000).toLocaleDateString()
                      : 'Just now'}
                  </span>
                  <span className="text-[10px] text-lime-400/50">Clinical Note</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. The Action Bar */}
      <div className="border-t border-zinc-800 p-2 flex justify-end bg-zinc-900/50">
        <button
          onClick={onAddNote}
          className="flex items-center gap-2 text-xs font-semibold text-lime-400 hover:text-lime-300 px-3 py-1.5 rounded hover:bg-lime-400/10 transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          Add Clinical Note
        </button>
      </div>
    </div>
  )
}
