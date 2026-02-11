import { useState } from 'react'
import {
  ArrowLeft,
  Dumbbell,
  Calendar as CalendarIcon,
  Target,
  CheckCircle,
  Circle,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, cn } from '@repo/ui'
import { useWorkouts } from '../../hooks/useWorkouts'
import { useAuth } from '../../providers/AuthProvider'
import { useTrainerGoals } from '../../hooks/useTrainerGoals'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { ChatBox } from '../../components/chat/ChatBox'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface TrainerClientViewProps {
  clientId: string
  onBack: () => void
}

export function TrainerClientView({ clientId, onBack }: TrainerClientViewProps) {
  // Fetch workouts where userId == clientId
  // We can reuse useWorkouts but need to pass userId.
  // NOTE: useWorkouts currently accepts userId to filter.
  const { data: workouts, isLoading } = useWorkouts(clientId)

  // Aggregate Muscle Groups for Chart
  const muscleCounts: Record<string, number> = {}
  workouts?.forEach(w => {
    w.targetedMuscles?.forEach(m => {
      muscleCounts[m] = (muscleCounts[m] || 0) + 1
    })
  })

  const chartData = Object.entries(muscleCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header / Nav */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Client Details</h1>
            <p className="text-zinc-400 text-sm font-mono">ID: {clientId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content: Charts & Stats */}
          <div className="md:col-span-2 space-y-6">
            {/* Muscle Breakdown Chart */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="h-4 w-4 text-lime-400" />
                  Targeted Muscle Frequency
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 0 ? (
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
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">
                    Not enough data to generate chart.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Goals Section */}
            <ClientGoalsSection clientId={clientId} />

            {/* Recent Workouts List */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-zinc-400" />
                Recent Workouts
              </h3>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-zinc-500">Loading workouts...</div>
                ) : workouts && workouts.length > 0 ? (
                  workouts.map(workout => (
                    <ActivityFeedItem
                      key={workout.id}
                      workout={workout}
                      showUser={false} // Don't show user name since we are on their page
                    />
                  ))
                ) : (
                  <div className="text-zinc-500 p-4 border border-zinc-800 rounded bg-zinc-900/50 text-center">
                    No workouts logged yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-base">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Workouts</span>
                  <span className="text-white font-bold">{workouts?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Last Active</span>
                  <span className="text-white font-mono text-xs">
                    {workouts?.[0]?.date
                      ? new Date(
                          (workouts[0].date as { seconds: number }).seconds * 1000
                        ).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Chat with Client */}
            <ChatBox otherUserId={clientId} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientGoalsSection({ clientId }: { clientId: string }) {
  const { user } = useAuth()
  const { goals, isLoading, addGoal, isAdding } = useTrainerGoals(clientId)
  const [newGoalTitle, setNewGoalTitle] = useState('')

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || !user) return
    try {
      await addGoal({ title: newGoalTitle, trainerId: user.uid })
      setNewGoalTitle('')
    } catch (error) {
      console.error('Failed to add goal', error)
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-blue-400" />
          Active Goals
        </CardTitle>
      </CardHeader>
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
                className="flex items-center gap-3 p-3 rounded bg-zinc-950/50 border border-zinc-800/50"
              >
                {goal.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-lime-400 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-zinc-600 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    goal.isCompleted ? 'text-zinc-500 line-through' : 'text-white'
                  )}
                >
                  {goal.title}
                </span>
              </div>
            ))
          ) : (
            <p className="text-zinc-500 text-sm italic">No active goals assigned.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
