import { useWorkouts } from '../../hooks/useWorkouts'
import { InviteManager } from '../../components/network/InviteManager'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { Card, CardContent } from '@repo/ui'
import { Users } from 'lucide-react'

export default function ConnectPage() {
  // Fetch ALL workouts the user has access to (team feed)
  const { data: workouts, isLoading } = useWorkouts()

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Connect</h1>
        <p className="text-zinc-400 mt-1">Manage your team and see what they're up to.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Team Feed */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-lime-400" />
            Team Activity
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-zinc-500">
              <div className="animate-spin h-8 w-8 border-4 border-lime-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading team activity...
            </div>
          ) : workouts && workouts.length > 0 ? (
            <div className="space-y-4">
              {workouts.map(workout => (
                <ActivityFeedItem key={workout.id} workout={workout} showUser={true} />
              ))}
            </div>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900 text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No activity yet</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">
                  Connect with a Trainer or Buddy to see their workouts here!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Invite Manager */}
        <div>
          <InviteManager />
        </div>
      </div>
    </>
  )
}
