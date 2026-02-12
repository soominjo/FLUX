import { useParams } from 'react-router-dom'
import { useUserProfile } from '../../hooks/useSocial'
import { useWorkouts } from '../../hooks/useWorkouts'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { EditProfileModal } from '../../components/profile/EditProfileModal'
import { Loader2, Shield, Trophy, Target, CheckCircle, Edit2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, cn } from '@repo/ui'
import { useTrainerGoals } from '../../hooks/useTrainerGoals'
import { ChatBox } from '../../components/chat/ChatBox'
import { calculateStreak } from '../../lib/flux-logic'
import { useAuth } from '../../providers/AuthProvider'
import { ClinicalNotesSection } from '../../components/dashboard/ClinicalNotesSection'
import { useState } from 'react'
import type { Goal } from '@repo/shared'

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
  const { user } = useAuth()
  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useUserProfile(uid || '')
  const { data: workouts, isLoading: isLoadingWorkouts } = useWorkouts(uid)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const isOwnProfile = user?.uid === uid

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
          {/* Avatar */}
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-lime-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white border-4 border-zinc-900 ring-2 ring-zinc-800 overflow-hidden flex-shrink-0">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                profile.displayName?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{profile.displayName}</h1>
              {isOwnProfile && (
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  size="sm"
                  className="bg-lime-500 hover:bg-lime-600 text-black font-semibold flex items-center gap-1"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2 mt-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-800 text-zinc-300">
                {profile.role}
              </span>
              {profile.verification?.isVerified && (
                <span className="flex items-center gap-1 text-xs text-blue-400">
                  <Shield className="h-3 w-3" /> Verified Pro
                </span>
              )}
            </div>

            {/* Bio and Location */}
            {profile.bio && <p className="text-sm text-zinc-300 mb-2">{profile.bio}</p>}
            {profile.location && (
              <p className="text-xs text-zinc-500 mb-3">📍 {profile.location}</p>
            )}

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lime-500/10 text-lime-400 border border-lime-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
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
            {profile.role === 'TRAINER' ? (
              <>
                {/* Trainer Credentials */}
                {(profile.experience ||
                  (profile.certifications && profile.certifications.length > 0)) && (
                  <Card className="border-zinc-800 bg-zinc-900">
                    <CardHeader>
                      <CardTitle className="text-base text-zinc-400 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Credentials
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {profile.experience && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-500 mb-1">Experience</h4>
                          <p className="text-zinc-300 text-sm whitespace-pre-wrap">
                            {profile.experience}
                          </p>
                        </div>
                      )}
                      {profile.certifications && profile.certifications.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-500 mb-2">Certifications</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.certifications.map((cert: string) => (
                              <span
                                key={cert}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 text-lime-400 text-xs font-medium"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                <TrainerGoalsFeed trainerId={uid} />
              </>
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

        {/* ── Clinical Records — only visible to Physio / Admin viewers ── */}
        {(user?.role === 'PHYSIO' || user?.role === 'ADMIN') && !isOwnProfile && (
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <h2 className="text-xl font-semibold mb-4 text-white">Clinical Records</h2>
            <ClinicalNotesSection patientId={uid!} />
          </div>
        )}

        {/* ── Chat Box — only visible when viewing other profiles ── */}
        {!isOwnProfile && <ChatBox otherUserId={uid || ''} otherUserName={profile.displayName} />}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          userId={uid || ''}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            refetchProfile()
            setIsEditModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
