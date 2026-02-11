import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { useWorkouts } from '../../hooks/useWorkouts'
import { ActivityFeedItem } from '../../components/social/ActivityFeedItem'
import { ArrowLeft, Users } from 'lucide-react'

export default function TeamFeedPage() {
  // Fetch ALL workouts my user has access to (viewers array)
  const { data: workouts, isLoading } = useWorkouts()

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Team Feed{' '}
            <span className="bg-lime-400/10 text-lime-400 px-3 py-1 rounded-full text-sm font-medium border border-lime-400/20">
              Beta
            </span>
          </h1>
        </div>
        <p className="text-zinc-400 ml-14">
          See what your team is up to. Give kudos and stay motivated together.
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="md:col-span-2 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-500">
              <div className="animate-spin h-8 w-8 border-4 border-lime-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading team activity...
            </div>
          ) : workouts && workouts.length > 0 ? (
            workouts.map(workout => (
              <ActivityFeedItem
                key={workout.id}
                workout={workout}
                showUser={true} // Always show user info in feed
              />
            ))
          ) : (
            <Card className="border-zinc-800 bg-zinc-900 text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No activity yet</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">
                  Your feed is empty. Connect with a Trainer or Buddy to see their workouts here!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="hidden md:block space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/50 sticky top-8">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">Feed Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Active Posts</span>
                <span className="text-white font-bold">{workouts?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Members</span>
                <span className="text-white font-bold">--</span>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  Workouts are visible to you if you are listed as a viewer or if they are public.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
