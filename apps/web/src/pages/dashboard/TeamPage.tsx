import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { ArrowLeft, Users } from 'lucide-react'
import { InviteManager } from '../../components/network/InviteManager'
import { TeamActivityFeed } from '../../components/team/TeamActivityFeed'

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            My Team
            <span className="bg-lime-400/10 text-lime-400 px-3 py-1 rounded-full text-sm font-medium border border-lime-400/20">
              Active
            </span>
          </h1>
        </div>
        <p className="text-zinc-400 ml-14">
          See what your workout buddies are up to. Give kudos and stay motivated together.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed - Team Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-lime-400" />
            <h2 className="text-2xl font-bold">Team Activity</h2>
          </div>
          <TeamActivityFeed />
        </div>

        {/* Sidebar - Invite Manager */}
        <div className="space-y-6">
          <InviteManager />

          {/* Team Stats Card */}
          <Card className="border-zinc-800 bg-zinc-900/50 sticky top-8">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">Team Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  About This Page
                </p>
                <p className="text-sm text-zinc-300">
                  Track your workout buddies' activity in real-time. Connect with friends to stay
                  motivated and accountable!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
