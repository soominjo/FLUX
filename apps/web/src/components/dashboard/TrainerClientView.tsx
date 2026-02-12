import { useState } from 'react'
import {
  ArrowLeft,
  Dumbbell,
  Calendar as CalendarIcon,
  Target,
  CheckCircle,
  Circle,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent, Button, cn } from '@repo/ui'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useAuth } from '../../providers/AuthProvider'
import { useTrainerGoals } from '../../hooks/useTrainerGoals'
import { useUserProfile } from '../../hooks/useSocial'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface TrainerClientViewProps {
  clientId: string
  onBack: () => void
}

export function TrainerClientView({ clientId, onBack }: TrainerClientViewProps) {
  const { data: workouts, isLoading } = useWorkouts(clientId)
  const { data: clientProfile } = useUserProfile(clientId)

  // Aggregate Muscle Groups for Chart
  const muscleCounts: Record<string, number> = {}
  workouts?.forEach(w => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wAny = w as any
    const muscles: string[] = Array.isArray(w.targetedMuscles)
      ? w.targetedMuscles
      : wAny.muscleGroup
        ? [wAny.muscleGroup]
        : []

    muscles.forEach(m => {
      muscleCounts[m] = (muscleCounts[m] || 0) + 1
    })
  })

  const chartData = Object.entries(muscleCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white max-sm:text-xl">
              {clientProfile?.displayName || 'Client'}
            </h2>
            <p className="text-zinc-400 text-sm">Client ID: {clientId.slice(0, 8)}...</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 text-center hidden md:block">
            <div className="text-xs text-zinc-500 uppercase">Height</div>
            <div className="font-mono font-bold text-white">
              {clientProfile?.metrics?.heightCm ? `${clientProfile.metrics.heightCm}cm` : '--'}
            </div>
          </div>
          <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 text-center hidden md:block">
            <div className="text-xs text-zinc-500 uppercase">Weight</div>
            <div className="font-mono font-bold text-white">
              {clientProfile?.metrics?.weightKg ? `${clientProfile.metrics.weightKg}kg` : '--'}
            </div>
          </div>
          <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
            <div className="text-xs text-zinc-500 uppercase">BMI</div>
            <div className="font-mono font-bold text-lime-400">
              {clientProfile?.metrics?.bmi || '--'}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-zinc-800 w-full" />

      {/* 2. Content Sections */}
      <div className="space-y-8 pb-8">
        {/* SECTION A: Active Goals (Replacing Clinical Notes slot) */}
        <ClientGoalsSection clientId={clientId} />

        {/* SECTION B: Recent Activity */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-zinc-400" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-zinc-500">Loading workouts...</div>
            ) : workouts && workouts.length > 0 ? (
              workouts.map(workout => (
                <ActivityFeedItem key={workout.id} workout={workout} showUser={false} />
              ))
            ) : (
              <div className="text-zinc-500 p-4 border border-zinc-800 rounded bg-zinc-900/50 text-center">
                No workouts logged yet.
              </div>
            )}
          </div>
        </div>

        {/* SECTION C: Chart (Moved to bottom, collapsible-ish feel by being last) */}
        {chartData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-lime-400" />
              Muscle Distribution
            </h3>
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: '#27272a' }}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#84cc16" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
// ClientGoalsSection implementation remains same...
function ClientGoalsSection({ clientId }: { clientId: string }) {
  // ... (keep existing implementation)
  const { user } = useAuth()
  const { goals, isLoading, addGoal, updateGoal, deleteGoal, isAdding } = useTrainerGoals(clientId)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || !user) return
    try {
      await addGoal({ title: newGoalTitle, trainerId: user.uid })
      setNewGoalTitle('')
    } catch (error) {
      console.error('Failed to add goal', error)
    }
  }

  const handleSaveEdit = async (goalId: string) => {
    if (!editTitle.trim()) return
    await updateGoal({ goalId, title: editTitle })
    setEditingId(null)
  }

  const handleDelete = async (goalId: string) => {
    await deleteGoal(goalId)
    setDeletingId(null)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-blue-400" />
        Active Goals
      </h3>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="space-y-4">
          {/* Add Goal Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoalTitle}
              onChange={e => setNewGoalTitle(e.target.value)}
              placeholder="Assign a new goal..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-zinc-600"
              onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
            />
            <Button
              size="sm"
              onClick={handleAddGoal}
              disabled={isAdding || !newGoalTitle.trim()}
              className="bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Goals List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-zinc-500 text-sm">Loading goals...</div>
            ) : goals && goals.length > 0 ? (
              goals.map(goal => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 p-3 rounded bg-zinc-950/50 border border-zinc-800/50 group"
                >
                  {goal.isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-lime-400 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-zinc-600 flex-shrink-0" />
                  )}

                  {editingId === goal.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(goal.id!)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(goal.id!)}
                        className="p-1 text-lime-400 hover:text-lime-300"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-zinc-500 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={cn(
                          'text-sm flex-1',
                          goal.isCompleted ? 'text-zinc-500 line-through' : 'text-white'
                        )}
                      >
                        {goal.title}
                      </span>

                      {/* Edit/Delete — only if I'm the trainer who created this goal */}
                      {user && goal.trainerId === user.uid && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingId(goal.id!)
                              setEditTitle(goal.title)
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {deletingId === goal.id ? (
                            <button
                              onClick={() => handleDelete(goal.id!)}
                              className="px-1.5 py-0.5 rounded text-xs text-red-400 hover:bg-zinc-800"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeletingId(goal.id!)}
                              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-sm italic">No active goals assigned.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
