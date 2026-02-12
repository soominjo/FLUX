import { useState } from 'react'
import { Button } from '@repo/ui'
import { Plus, X } from 'lucide-react'
import { LogWorkoutForm } from './LogWorkoutForm'

export function NewWorkoutLogger() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
      >
        <Plus className="mr-2 h-4 w-4" /> Log Workout
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Log Session</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* The New Form */}
            <LogWorkoutForm onSuccess={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
