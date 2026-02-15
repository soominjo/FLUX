import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@repo/ui'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  useMyProviders,
  useAddConnection,
  useMyPendingProviders,
} from '../../hooks/useRelationships'
import { useUserProfile } from '../../hooks/useSocial'
import { Copy, Users, UserPlus, Check, Loader2, Clock } from 'lucide-react'
import type { Relationship } from '@repo/shared'

function ConnectionItem({
  relationship,
  isPending,
}: {
  relationship: Relationship
  isPending?: boolean
}) {
  const { data: profile } = useUserProfile(relationship.providerId)

  if (isPending) {
    return (
      <div className="flex items-center justify-between p-3 rounded bg-zinc-950/50 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-zinc-400">
                {(profile?.displayName || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-white">
              {profile?.displayName || 'Loading...'}
            </div>
            <div className="text-xs text-zinc-500 font-mono">{relationship.type} • Waiting...</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px] font-medium uppercase tracking-wider">
          <Clock className="h-3 w-3" />
          Waiting for Approval
        </div>
      </div>
    )
  }

  return (
    <Link
      to={`/profile/${relationship.providerId}`}
      className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName || 'User'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-zinc-400">
              {(profile?.displayName || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-white group-hover:text-lime-400 transition-colors">
            {profile?.displayName || 'Loading...'}
          </div>
          <div className="text-xs text-zinc-500 font-mono">{relationship.type} • Active</div>
        </div>
      </div>
      <div className="px-2 py-1 rounded bg-lime-400/10 text-lime-400 text-xs font-bold">ACTIVE</div>
    </Link>
  )
}

interface InviteManagerProps {
  targetUserId?: string
}

export function InviteManager({ targetUserId }: InviteManagerProps = {}) {
  const { user } = useAuth()
  const { data: providers, isLoading: isLoadingProviders } = useMyProviders()
  const { data: pendingProviders } = useMyPendingProviders()
  const { mutateAsync: addConnection, isPending: isAdding } = useAddConnection()

  const displayUserId = targetUserId || user?.uid
  const isAdminView = !!targetUserId

  const [inviteCode, setInviteCode] = useState('')
  const [role, setRole] = useState<'TRAINER' | 'PHYSIO' | 'BUDDY'>('TRAINER')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (displayUserId) {
      navigator.clipboard.writeText(displayUserId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode) return

    try {
      await addConnection({ inviteCode, role })
      setInviteCode('')
      // Ideally show a toast here
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. My Invite Code */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-lime-400" />
            My Invite Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={displayUserId || ''}
              className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-xs md:text-sm"
            />
            <Button
              variant="outline"
              onClick={handleCopy}
              className="border-zinc-800 text-zinc-700 hover:text-white hover:bg-zinc-800"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {isAdminView
              ? "This trainee's invite code. Share it with providers so they can connect."
              : 'Share this code with your Trainer or Physiotherapist so they can connect with you.'}
          </p>
        </CardContent>
      </Card>

      {/* 2. Add Connection */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-lime-400" />
            Add Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Their Invite Code (UID)</Label>
              <Input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Paste code here..."
                className="bg-zinc-950 border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Role</Label>
              <select
                value={role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setRole(e.target.value as 'TRAINER' | 'PHYSIO' | 'BUDDY')
                }
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
              >
                <option value="TRAINER">Trainer</option>
                <option value="PHYSIO">Physiotherapist</option>
                <option value="BUDDY">Workout Buddy</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={!inviteCode || isAdding}
              className="w-full bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Active Connections */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white text-base">Your Team</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProviders ? (
            <div className="text-zinc-500 text-sm">Loading team...</div>
          ) : (
            <div className="space-y-3">
              {/* Pending Connections */}
              {pendingProviders &&
                pendingProviders.map((rel: Relationship) => (
                  <ConnectionItem key={rel.id} relationship={rel} isPending={true} />
                ))}

              {/* Active Connections */}
              {providers && providers.length > 0
                ? providers.map((rel: Relationship) => (
                    <ConnectionItem key={rel.id} relationship={rel} />
                  ))
                : (!pendingProviders || pendingProviders.length === 0) && (
                    <div className="text-center py-6 text-zinc-500 text-sm">
                      No connections yet. Add a Trainer!
                    </div>
                  )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
