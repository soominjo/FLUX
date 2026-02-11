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
import { Activity, Clock, Flame } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useToggleKudos } from '../../hooks/useSocial'
import type { Workout } from '@repo/shared'

interface ActivityFeedItemProps {
  workout: Workout
  showUser?: boolean
}

export function ActivityFeedItem({ workout, showUser = true }: ActivityFeedItemProps) {
  const { user } = useAuth()
  const { mutate: toggleKudos } = useToggleKudos()

  // Optimistic UI state could be handled here or rely on react-query invalidation.
  // We'll rely on props updates for simplicity first, but maybe add local feel.
  const hasLiked = user && workout.kudos?.includes(user.uid)
  const kudosCount = workout.kudos?.length || 0

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

  return (
    <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-white text-lg">{workout.title}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                {showUser && (
                  <span className="text-zinc-300">User {workout.userId.slice(0, 4)}</span>
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
              <div className={cn('text-2xl font-bold', getStrainColor(workout.strainScore))}>
                {workout.strainScore}
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
              {workout.durationMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {workout.targetedMuscles?.length || 0} muscles
            </span>
          </div>
        </div>

        {/* Footer / Kudos Action */}
        <div className="bg-zinc-950/50 p-3 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500">{/* Comments placeholder? */}</div>

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
