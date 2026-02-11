import { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useMyClients } from '../../hooks/useRelationships'
import type { Relationship } from '@repo/shared'
import { PhysioPatientView } from '../../components/dashboard/PhysioPatientView'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { Stethoscope, User, ChevronRight, Fingerprint, Copy } from 'lucide-react'
import { NotificationBell } from '../../components/notifications/NotificationBell'

export default function PhysioDashboard() {
  const { user } = useAuth()
  const { data: patients, isLoading } = useMyClients() // Reusing same hook, logic is identical (providerId == me)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-500">
        Loading physio dashboard...
      </div>
    )
  }

  // If a patient is selected, show their detail view
  if (selectedPatientId) {
    return (
      <PhysioPatientView patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-lime-400" />
              Physio Dashboard
            </h1>
            <p className="text-zinc-400">Monitor recovery and manage patient rehabilitation.</p>
          </div>
          <NotificationBell />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Patient Roster */}
          <Card className="md:col-span-2 border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-400" />
                Patient Roster
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patients && patients.length > 0 ? (
                patients.map((rel: Relationship) => (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedPatientId(rel.traineeId)}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-lime-400/50 hover:bg-zinc-800 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                        {rel.traineeId.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white group-hover:text-lime-400 transition-colors">
                          Patient ID: {rel.traineeId.slice(0, 6)}...
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">Status: Active</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-lime-400" />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <p>No active patients.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            {/* Referral Code Card */}
            <Card className="border-lime-400/20 bg-zinc-900 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-lime-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-lime-400" />
                  My Referral Code
                </CardTitle>
                <p className="text-xs text-zinc-400">Share this code with patients to connect.</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-sm font-mono text-zinc-300 truncate select-all">
                    {user?.uid || 'Loading...'}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={() => {
                      if (user?.uid) {
                        navigator.clipboard.writeText(user.uid)
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-base">Practice Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Total Patients</span>
                  <span className="text-xl font-bold text-white">{patients?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
