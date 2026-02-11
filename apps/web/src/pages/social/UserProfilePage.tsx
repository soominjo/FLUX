import { useParams } from 'react-router-dom'
import { useUserProfile } from '../../hooks/useSocial'
import { useWorkouts } from '../../hooks/useWorkouts'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { Loader2, Shield, Trophy, FileText, Target, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, cn } from '@repo/ui'
import { calculateStreak } from '../../lib/flux-logic'
import { useAuth } from '../../providers/AuthProvider'
import { useClinicalNotes } from '../../hooks/useClinicalNotes'
import { useTrainerGoals } from '../../hooks/useTrainerGoals'
import { ChatBox } from '../../components/chat/ChatBox'
import type { ClinicalNote, Goal } from '@repo/shared'

// ─── Physio Notes Feed ────────────────────────────────────────────────────────
function PhysioNotesFeed({ physioId }: { physioId: string | undefined }) {
  const { user } = useAuth()

  // The notes live in MY (trainee) sub-collection, filtered by this physio's uid
  const { data: notes, isLoading } = useClinicalNotes(user?.uid, physioId)

  console.log('FETCHED PHYSIO NOTES:', { traineeId: user?.uid, physioId, notes, isLoading })

  if (!user) return null
  if (isLoading) return <div className="text-zinc-500 animate-pulse">Loading recovery plan...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FileText className="h-5 w-5 text-purple-400" />
        Recovery Plan &amp; Notes
      </h2>

      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note: ClinicalNote) => (
            <Card key={note.id} className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-purple-300">
                    Clinical Note
                  </CardTitle>
                  <span className="text-xs text-zinc-500">
                    {note.timestamp
                      ? new Date(
                          (note.timestamp as { seconds: number }).seconds * 1000
                        ).toLocaleDateString()
                      : 'Recent'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-zinc-800 rounded-lg bg-zinc-900/30 text-zinc-500">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No clinical notes found from this Physio.</p>
          <p className="text-xs mt-1 text-zinc-600">
            Notes will appear here once the specialist adds them.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Trainer Goals Feed ───────────────────────────────────────────────────────
function TrainerGoalsFeed({ trainerId }: { trainerId: string | undefined }) {
  const { user } = useAuth()
  const { goals, isLoading, toggleGoal } = useTrainerGoals(user?.uid)

  // Filter goals assigned by THIS trainer
  const relevantGoals = goals?.filter(g => g.trainerId === trainerId)

  if (isLoading) return <div className="text-zinc-500">Loading goals...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Target className="h-5 w-5 text-blue-400" />
        Assigned Goals
      </h2>

      {relevantGoals && relevantGoals.length > 0 ? (
        <div className="grid gap-4">
          {relevantGoals.map((goal: Goal) => (
            <div
              key={goal.id}
              onClick={() => toggleGoal({ goalId: goal.id!, currentStatus: goal.isCompleted })}
              className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-blue-400/50 cursor-pointer transition-all group"
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  goal.isCompleted
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-zinc-600 group-hover:border-blue-400'
                )}
              >
                {goal.isCompleted && <CheckCircle className="h-4 w-4 text-white" />}
              </div>
              <div>
                <h3
                  className={cn(
                    'font-medium text-lg transition-colors',
                    goal.isCompleted ? 'text-zinc-500 line-through' : 'text-white'
                  )}
                >
                  {goal.title}
                </h3>
                <p className="text-xs text-zinc-500">
                  Assigned{' '}
                  {goal.createdAt
                    ? new Date(
                        (goal.createdAt as { seconds: number }).seconds * 1000
                      ).toLocaleDateString()
                    : 'Recently'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-zinc-800 rounded-lg bg-zinc-900/30 text-zinc-500">
          <p>No active goals assigned by this trainer.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const { uid } = useParams<{ uid: string }>()
  const { data: profile, isLoading: isLoadingProfile } = useUserProfile(uid || '')
  const { data: workouts, isLoading: isLoadingWorkouts } = useWorkouts(uid)

  if (isLoadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-lime-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        Profile not found or access denied.
      </div>
    )
  }

  const streak = workouts ? calculateStreak(workouts.map(w => w.date)) : 0
  const totalStrain = workouts?.reduce((acc, w) => acc + w.strainScore, 0) || 0
  const isTrainee = profile.role === 'TRAINEE'

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ── Profile Header ── */}
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-500 border-4 border-zinc-900 ring-2 ring-zinc-800">
            {profile.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-800 text-zinc-300">
                {profile.role}
              </span>
              {profile.verification?.isVerified && (
                <span className="flex items-center gap-1 text-xs text-blue-400">
                  <Shield className="h-3 w-3" /> Verified Pro
                </span>
              )}
            </div>
          </div>

          {/* Streak badge */}
          <div className="ml-auto text-right hidden md:block">
            <div className="text-4xl font-bold text-orange-500 flex items-center justify-end gap-2">
              {streak} <span className="text-lg text-zinc-500 font-medium">days</span>
            </div>
            <div className="text-zinc-500 text-sm">Active Streak</div>
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div className={cn('grid grid-cols-1 gap-8', isTrainee && 'md:grid-cols-3')}>
          {/* Sidebar — only for TRAINEE profiles */}
          {isTrainee && (
            <div className="space-y-6">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-400 flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Lifetime Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{workouts?.length || 0}</div>
                    <div className="text-xs text-zinc-500">Workouts Logged</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{Math.round(totalStrain)}</div>
                    <div className="text-xs text-zinc-500">Total Strain</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Feed Area */}
          <div className={isTrainee ? 'md:col-span-2 space-y-6' : 'space-y-6'}>
            {profile.role === 'PHYSIO' ? (
              <PhysioNotesFeed physioId={uid} />
            ) : profile.role === 'TRAINER' ? (
              <TrainerGoalsFeed trainerId={uid} />
            ) : (
              <>
                <h2 className="text-xl font-bold">Recent Activity</h2>
                {isLoadingWorkouts ? (
                  <div className="text-zinc-500">Loading activity...</div>
                ) : workouts?.length === 0 ? (
                  <div className="text-zinc-500">No activity visible.</div>
                ) : (
                  <div className="space-y-4">
                    {workouts?.map(workout => (
                      <ActivityFeedItem key={workout.id} workout={workout} showUser={false} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Chat Box — always visible at bottom of every profile ── */}
        <ChatBox otherUserId={uid || ''} otherUserName={profile.displayName} />
      </div>
    </div>
  )
}
