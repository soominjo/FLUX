import { useClinicalNotes } from '../../hooks/useClinicalNotes'
import { Loader2 } from 'lucide-react'

interface Props {
  patientId: string
}

export function ClinicalNotesSection({ patientId }: Props) {
  const { data: notes, isLoading } = useClinicalNotes(patientId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading records...
      </div>
    )
  }

  if (notes.length === 0) {
    return <div className="text-zinc-500">No clinical notes found for this patient.</div>
  }

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <div key={note.id} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="flex justify-between text-xs text-zinc-400 mb-2">
            <span>{note.type?.toUpperCase() || 'NOTE'}</span>
            <span>
              {note.timestamp && typeof note.timestamp === 'object' && 'seconds' in note.timestamp
                ? new Date(
                    (note.timestamp as { seconds: number }).seconds * 1000
                  ).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Just now'}
            </span>
          </div>
          <p className="text-zinc-300 whitespace-pre-wrap">{note.content}</p>
        </div>
      ))}
    </div>
  )
}
