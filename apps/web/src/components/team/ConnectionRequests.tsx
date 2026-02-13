import { usePendingClients, useRespondToConnection } from '../../hooks/useRelationships'
import { useUserProfile } from '../../hooks/useSocial'
import { Button } from '@repo/ui'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'

function RequestCard({
  relationshipId,
  traineeId,
  onRespond,
}: {
  relationshipId: string
  traineeId: string
  onRespond: (id: string, action: 'ACCEPT' | 'REJECT') => void
}) {
  const { data: profile, isLoading } = useUserProfile(traineeId)

  if (isLoading) return <div className="h-16 bg-zinc-900/50 animate-pulse rounded-lg" />

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-zinc-900/50 border-lime-400/20">
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
            {profile?.displayName || 'Unknown User'}
          </div>
          <div className="text-[10px] text-zinc-500">Requested to connect</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-lime-400 hover:text-lime-300 hover:bg-lime-400/10 rounded-full"
          onClick={() => onRespond(relationshipId, 'ACCEPT')}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full"
          onClick={() => onRespond(relationshipId, 'REJECT')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ConnectionRequests() {
  const { data: requests, isLoading } = usePendingClients()
  const { mutate: respond } = useRespondToConnection()

  const handleRespond = (connectionId: string, action: 'ACCEPT' | 'REJECT') => {
    respond(
      { connectionId, action },
      {
        onSuccess: () =>
          toast.success(action === 'ACCEPT' ? 'Request accepted' : 'Request rejected'),
        onError: () => toast.error('Failed to process request'),
      }
    )
  }

  if (isLoading) return null
  if (!requests || requests.length === 0) return null

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-lime-400 uppercase tracking-wider">
          Pending Requests
        </h3>
        <span className="text-xs font-medium bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded-full">
          {requests.length} New
        </span>
      </div>
      <div className="grid gap-2">
        {requests.map(
          req =>
            req.id && (
              <RequestCard
                key={req.id}
                relationshipId={req.id}
                traineeId={req.traineeId}
                onRespond={handleRespond}
              />
            )
        )}
      </div>
    </div>
  )
}
