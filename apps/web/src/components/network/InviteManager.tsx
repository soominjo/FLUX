import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@repo/ui'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { useMyProviders, useAddConnection } from '../../hooks/useRelationships'
import { Copy, Users, UserPlus, Check, Loader2 } from 'lucide-react'
import type { Relationship } from '@repo/shared'

export function InviteManager() {
  const { user } = useAuth()
  const { data: providers, isLoading: isLoadingProviders } = useMyProviders()
  const { mutateAsync: addConnection, isPending: isAdding } = useAddConnection()

  const [inviteCode, setInviteCode] = useState('')
  const [role, setRole] = useState<'TRAINER' | 'PHYSIO' | 'BUDDY'>('TRAINER')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid)
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
              value={user?.uid || ''}
              className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-xs md:text-sm"
            />
            <Button
              variant="outline"
              onClick={handleCopy}
              className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Share this code with your Trainer or Physiotherapist so they can connect with you.
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
              <Label>Their Invite Code (UID)</Label>
              <Input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Paste code here..."
                className="bg-zinc-950 border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
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
          ) : providers && providers.length > 0 ? (
            <div className="space-y-3">
              {providers.map((rel: Relationship) => (
                <Link
                  key={rel.id}
                  to={`/profile/${rel.providerId}`}
                  className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {rel.type[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-lime-400 transition-colors">
                        {rel.type}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono">
                        {rel.providerId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded bg-lime-400/10 text-lime-400 text-xs font-bold">
                    ACTIVE
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-500 text-sm">
              No connections yet. Add a Trainer!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
