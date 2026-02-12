import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../providers/AuthProvider'
import { useMyClients } from '../../hooks/useRelationships'
import type { Relationship } from '@repo/shared'
import { PhysioPatientView } from '../../components/dashboard/PhysioPatientView'
import { ConnectionRequests } from '../../components/team/ConnectionRequests'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { Stethoscope, User, ChevronRight, ShieldAlert } from 'lucide-react'
import { NotificationBell } from '../../components/notifications/NotificationBell'
import { UserMenu } from '../../components/nav/UserMenu'
import { ChatBox } from '../../components/chat/ChatBox'

export default function PhysioDashboard() {
  const { userProfile } = useAuth()
  const queryClient = useQueryClient()
  const { data: patients, isLoading } = useMyClients() // Reusing same hook, logic is identical (providerId == me)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  // Deduplicate patients for Admin view (group by traineeId)
  const uniquePatients = useMemo(() => {
    if (!patients) return []

    // If not admin, just return patients as is (though deduplication doesn't hurt)
    // Actually, for Admin view we get ALL connections, so duplicates are possible if multiple pros have same patient.

    const map = new Map<string, Relationship & { assignedPros: string[] }>()

    patients.forEach(rel => {
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
  }, [patients])

  // Verification gate — block unverified Physios (bypass for Admin)
  const isApproved =
    userProfile?.verificationStatus === 'APPROVED' ||
    (userProfile?.role as string) === 'SUPERADMIN' ||
    (userProfile?.role as string) === 'admin'

  if (userProfile && !isApproved) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-amber-400/10 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Application Under Review</h1>
          <p className="text-zinc-400 leading-relaxed">
            Your account is currently pending approval. An administrator will review your license
            shortly.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 text-amber-400 text-sm font-medium">
            <ShieldAlert className="h-4 w-4" />
            Status: {userProfile.verificationStatus || 'PENDING'}
          </div>
          <div>
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['auth'] })
                window.location.reload()
              }}
              className="bg-lime-500 hover:bg-lime-600 text-black font-semibold px-6"
            >
              Refresh Status
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-500">
        Loading physio dashboard...
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
              <Stethoscope className="h-8 w-8 text-lime-400" />
              Physio Dashboard
            </h1>
            <p className="text-zinc-400">Monitor recovery and manage patient rehabilitation.</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Patient List (Always Visible) */}
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900 h-[calc(100vh-100px)] flex flex-col">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-zinc-400" />
                  Patient Roster
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-0 px-4 pb-4 space-y-2">
                <div className="px-4 pt-4 pb-0">
                  <ConnectionRequests />
                </div>
                {/* Divide only if there are active clients */}
                {uniquePatients && uniquePatients.length > 0 ? (
                  uniquePatients.map(rel => (
                    <div
                      key={rel.id}
                      onClick={() => setSelectedPatientId(rel.traineeId)}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all group ${
                        selectedPatientId === rel.traineeId
                          ? 'bg-zinc-800 border-lime-400/50'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                            selectedPatientId === rel.traineeId
                              ? 'bg-lime-400 text-black'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {rel.traineeId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div
                            className={`font-medium transition-colors ${
                              selectedPatientId === rel.traineeId ? 'text-lime-400' : 'text-white'
                            }`}
                          >
                            Patient ID: {rel.traineeId.slice(0, 6)}...
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
                          selectedPatientId === rel.traineeId ? 'text-lime-400' : 'text-zinc-600'
                        }`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <p>No active patients.</p>
                  </div>
                )}
              </CardContent>

              {/* Chat Box (Pinned to Bottom) */}
              <div className="border-t border-zinc-800 bg-zinc-950/50 h-[400px] flex flex-col">
                {selectedPatientId && patients?.find(p => p.traineeId === selectedPatientId) ? (
                  <ChatBox
                    otherUserId={selectedPatientId}
                    otherUserName={
                      patients
                        ?.find(p => p.traineeId === selectedPatientId)
                        ?.traineeId.slice(0, 8) || 'Patient'
                    }
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm italic p-4 text-center">
                    Select a patient from the list above to start chatting.
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Stats Sidebar (Moved to bottom of Col 1 if needed, or kept separate) */}
            {/* Keeping it simple for now, can add back if requested */}
          </div>

          {/* Col 2 & 3: Patient Details (Main Content) */}
          <div className="md:col-span-2">
            {selectedPatientId ? (
              <PhysioPatientView
                patientId={selectedPatientId}
                onBack={() => setSelectedPatientId(null)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50 p-12">
                <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No Patient Selected</h3>
                <p className="max-w-md text-center">
                  Select a patient from the roster on the left to view their detailed stats,
                  clinical notes, and workout history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
