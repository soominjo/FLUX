import { useState, useMemo } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useMyClients } from '../../hooks/useRelationships'
import type { Relationship } from '@repo/shared'
import { TrainerClientView } from '../../components/dashboard/TrainerClientView'
import { ConnectionRequests } from '../../components/team/ConnectionRequests'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Users, ChevronRight, User } from 'lucide-react'
import { NotificationBell } from '../../components/notifications/NotificationBell'
import { UserMenu } from '../../components/nav/UserMenu'
import { ChatBox } from '../../components/chat/ChatBox'

export default function TrainerDashboard() {
  const { user, userProfile } = useAuth()
  const { data: clients, isLoading } = useMyClients()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // Deduplicate clients for Admin view (group by traineeId)
  const uniqueClients = useMemo(() => {
    if (!clients) return []

    const map = new Map<string, Relationship & { assignedPros: string[] }>()

    clients.forEach(rel => {
      const existing = map.get(rel.traineeId)

      if (existing) {
        if (!existing.assignedPros.includes(rel.providerId)) {
          existing.assignedPros.push(rel.providerId)
        }
      } else {
        map.set(rel.traineeId, {
          ...rel,
          assignedPros: [rel.providerId],
        })
      }
    })

    return Array.from(map.values())
  }, [clients])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-500">
        Loading trainer dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
              <Users className="h-8 w-8 text-lime-400" />
              Trainer Dashboard
            </h1>
            <p className="text-zinc-400">Manage your athletes and monitor their progress.</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Client Roster (Always Visible) */}
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900 h-[calc(100vh-100px)] flex flex-col text-zinc-400">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-zinc-400" />
                  Client Roster
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-0 px-4 pb-4 space-y-2">
                <div className="px-4 pt-4 pb-0">
                  <ConnectionRequests />
                </div>
                {/* Divide only if there are active clients, logic slightly tricky without conditional CSS but safe to leave just padding */}

                {/* Divide only if there are active clients, logic slightly tricky without conditional CSS but safe to leave just padding */}

                {uniqueClients && uniqueClients.length > 0 ? (
                  uniqueClients.map(rel => (
                    <div
                      key={rel.id}
                      onClick={() => setSelectedClientId(rel.traineeId)}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all group ${
                        selectedClientId === rel.traineeId
                          ? 'bg-zinc-800 border-lime-400/50'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                            selectedClientId === rel.traineeId
                              ? 'bg-lime-400 text-black'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {rel.traineeId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div
                            className={`font-medium transition-colors ${
                              selectedClientId === rel.traineeId ? 'text-lime-400' : 'text-white'
                            }`}
                          >
                            Client ID: {rel.traineeId.slice(0, 6)}...
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">Status: Active</div>
                          {(userProfile?.role === 'SUPERADMIN' ||
                            (userProfile?.role as string) === 'admin') && (
                            <div className="text-[10px] text-lime-400/70 font-mono mt-1">
                              Assigned to:{' '}
                              {rel.assignedPros
                                ? rel.assignedPros.map(p => p.slice(0, 6)).join(', ')
                                : rel.providerId.slice(0, 6)}
                              ...
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 transition-colors ${
                          selectedClientId === rel.traineeId ? 'text-lime-400' : 'text-zinc-600'
                        }`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <p>No active clients.</p>
                    <p className="text-xs mt-2">Share your ID: {user?.uid}</p>
                  </div>
                )}
              </CardContent>

              {/* Chat Box (Pinned to Bottom) */}
              <div className="border-t border-zinc-800 bg-zinc-950/50 h-[400px] flex flex-col">
                {selectedClientId && clients?.find(c => c.traineeId === selectedClientId) ? (
                  <ChatBox
                    otherUserId={selectedClientId}
                    otherUserName={
                      clients?.find(c => c.traineeId === selectedClientId)?.traineeId.slice(0, 8) ||
                      'Client'
                    }
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm italic p-4 text-center">
                    Select a client from the list above to start chatting.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Col 2 & 3: Main Content */}
          <div className="md:col-span-2">
            {selectedClientId ? (
              <TrainerClientView
                clientId={selectedClientId}
                onBack={() => setSelectedClientId(null)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50 p-12">
                <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No Client Selected</h3>
                <p className="max-w-md text-center">
                  Select a client from the roster on the left to view their detailed metrics, goals,
                  and workout history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
