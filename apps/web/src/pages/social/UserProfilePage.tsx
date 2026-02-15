import { useParams, useNavigate } from 'react-router-dom'
import { useUserProfile } from '../../hooks/useSocial'
import { useWorkouts } from '../../hooks/useWorkouts'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { EditProfileModal } from '../../components/profile/EditProfileModal'
import {
  Loader2,
  Shield,
  Trophy,
  Target,
  CheckCircle,
  Edit2,
  ArrowLeft,
  MapPin,
  Crosshair,
  Cake,
  Scale,
  Ruler,
  Activity,
  Flame,
  Utensils,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, cn } from '@repo/ui'
import { useTrainerGoals } from '../../hooks/useTrainerGoals'
import { ChatBox } from '../../components/chat/ChatBox'
import { calculateStreak } from '../../lib/flux-logic'
import { useAuth } from '../../providers/AuthProvider'
import { ClinicalNotesSection } from '../../components/dashboard/ClinicalNotesSection'
import { useState } from 'react'
import type { Goal } from '@repo/shared'

// ─── Goal display labels ─────────────────────────────────────────────────────
const GOAL_LABELS: Record<string, string> = {
  lose: 'Fat Loss',
  maintain: 'Maintain',
  gain: 'Muscle Gain',
}

// ─── Trainer Goals Feed ───────────────────────────────────────────────────────
function TrainerGoalsFeed({ trainerId }: { trainerId: string | undefined }) {
  const { user } = useAuth()
  const { goals, isLoading, toggleGoal } = useTrainerGoals(user?.uid)

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

// ─── Stat Card (small) ───────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color = 'text-lime-400',
}: {
  icon: typeof Scale
  label: string
  value: string | number
  unit?: string
  color?: string
}) {
  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span>}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const { uid } = useParams<{ uid: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: profile, isLoading: isLoadingProfile } = useUserProfile(uid || '')
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

  // BMI calculation
  const heightCm = profile.metrics?.heightCm
  const weightKg = profile.metrics?.weightKg
  const bmi = heightCm && weightKg ? weightKg / Math.pow(heightCm / 100, 2) : null
  const bmiDisplay = bmi ? bmi.toFixed(1) : '—'
  const bmiCategory = !bmi
    ? '—'
    : bmi < 18.5
      ? 'Underweight'
      : bmi < 25
        ? 'Healthy'
        : bmi < 30
          ? 'Overweight'
          : 'Obese'
  const bmiColor = !bmi
    ? 'text-zinc-500'
    : bmi < 18.5
      ? 'text-blue-400'
      : bmi < 25
        ? 'text-emerald-400'
        : bmi < 30
          ? 'text-amber-400'
          : 'text-red-400'

  const nutritionTargets = (profile as Record<string, unknown>)?.nutritionTargets as
    | { calories: number; protein: number; carbs: number; fat: number }
    | undefined

  const goalLabel = profile.goal ? GOAL_LABELS[profile.goal] || profile.goal : null

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ── Back Button ── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* ── Hero Card ── */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-lime-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white border-4 border-zinc-800 ring-2 ring-zinc-700 overflow-hidden">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile.displayName?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-zinc-800 text-zinc-300">
                    {profile.role}
                  </span>
                  {profile.verification?.isVerified && (
                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      <Shield className="h-3 w-3" /> Verified
                    </span>
                  )}
                  {isOwnProfile && (
                    <Button
                      onClick={() => setIsEditModalOpen(true)}
                      size="sm"
                      className="bg-lime-500 hover:bg-lime-600 text-black font-semibold flex items-center gap-1 ml-auto"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-sm text-zinc-300 mt-2 max-w-lg">{profile.bio}</p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-zinc-400">
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                      {profile.location}
                    </span>
                  )}
                  {goalLabel && (
                    <span className="flex items-center gap-1.5">
                      <Crosshair className="h-3.5 w-3.5 text-zinc-500" />
                      {goalLabel}
                    </span>
                  )}
                  {profile.metrics?.age && (
                    <span className="flex items-center gap-1.5">
                      <Cake className="h-3.5 w-3.5 text-zinc-500" />
                      {profile.metrics.age} years
                    </span>
                  )}
                  {streak > 0 && (
                    <span className="flex items-center gap-1.5 text-orange-500 font-semibold">
                      <Flame className="h-3.5 w-3.5 fill-orange-500" />
                      {streak} day streak
                    </span>
                  )}
                </div>

                {/* Tags */}
                {profile.tags && profile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
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
            </div>
          </CardContent>
        </Card>

        {/* ── Content Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Sidebar: Stats */}
          <div className="space-y-6">
            {/* Body Composition */}
            {isTrainee && (weightKg || heightCm) && (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-400 flex items-center gap-2">
                    <Scale className="h-4 w-4" /> Body Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {weightKg && (
                      <StatCard
                        icon={Scale}
                        label="Weight"
                        value={weightKg}
                        unit="kg"
                        color="text-blue-400"
                      />
                    )}
                    {heightCm && (
                      <StatCard
                        icon={Ruler}
                        label="Height"
                        value={heightCm}
                        unit="cm"
                        color="text-emerald-400"
                      />
                    )}
                  </div>
                  {bmi && (
                    <div className="mt-3 rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-center">
                      <div className={cn('text-3xl font-bold', bmiColor)}>{bmiDisplay}</div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">BMI</div>
                      <div className={cn('text-sm font-semibold mt-0.5', bmiColor)}>
                        {bmiCategory}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Nutrition Targets */}
            {isTrainee && nutritionTargets && (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-400 flex items-center gap-2">
                    <Utensils className="h-4 w-4" /> Daily Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Calories</span>
                    <span className="text-white font-semibold">
                      {nutritionTargets.calories} kcal
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Protein</span>
                    <span className="text-lime-400 font-semibold">{nutritionTargets.protein}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Carbs</span>
                    <span className="text-amber-400 font-semibold">{nutritionTargets.carbs}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Fat</span>
                    <span className="text-red-400 font-semibold">{nutritionTargets.fat}g</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lifetime Stats */}
            {isTrainee && (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-base text-zinc-400 flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Lifetime Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon={Activity}
                      label="Workouts"
                      value={workouts?.length || 0}
                      color="text-lime-400"
                    />
                    <StatCard
                      icon={Flame}
                      label="Total Strain"
                      value={Math.round(totalStrain)}
                      color="text-orange-500"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trainer Credentials — when viewing a trainer */}
            {profile.role === 'TRAINER' &&
              (profile.experience ||
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
          </div>

          {/* Right Main Column: Activity / Goals */}
          <div className="md:col-span-2 space-y-6">
            {profile.role === 'TRAINER' ? (
              <TrainerGoalsFeed trainerId={uid} />
            ) : (
              <>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-lime-400" />
                  Recent Activity
                </h2>
                {isLoadingWorkouts ? (
                  <div className="text-zinc-500">Loading activity...</div>
                ) : workouts?.length === 0 ? (
                  <div className="text-center py-12 border border-zinc-800 rounded-lg bg-zinc-900/30 text-zinc-500">
                    No activity visible.
                  </div>
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
        {((user as unknown as Record<string, unknown>)?.role === 'PHYSIO' ||
          (user as unknown as Record<string, unknown>)?.role === 'ADMIN') &&
          !isOwnProfile && (
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
        <EditProfileModal profile={profile} onClose={() => setIsEditModalOpen(false)} />
      )}
    </div>
  )
}
