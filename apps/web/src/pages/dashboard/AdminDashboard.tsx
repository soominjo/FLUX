import { useState } from 'react'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '../../lib/firebase'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Clock,
  LayoutDashboard,
  Stethoscope,
  Dumbbell,
  HeartPulse,
  ArrowLeft,
} from 'lucide-react'
import { UserMenu } from '../../components/nav/UserMenu'
import type { UserProfile } from '@repo/shared'
import { AdminStats } from '../../components/admin/AdminStats'
import { TraineeSelector } from '../../components/admin/TraineeSelector'
import TrainerDashboard from './TrainerDashboard'
import PhysioDashboard from './PhysioDashboard'
import TraineeDashboard from './TraineeDashboard'
import NutritionPage from './NutritionPage'
import ConnectPage from './ConnectPage'
import DashboardLayout from './DashboardLayout'

type TraineeTab = 'workouts' | 'nutrition' | 'connect'

interface PendingPhysio extends UserProfile {
  uid: string
}

function useAdminPendingPhysios() {
  return useQuery({
    queryKey: ['admin', 'pending-physios'],
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'PHYSIO'),
        where('verificationStatus', '==', 'PENDING')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({
        uid: d.id,
        ...d.data(),
      })) as PendingPhysio[]
    },
  })
}

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const { data: pendingPhysios, isLoading } = useAdminPendingPhysios()
  const [processing, setProcessing] = useState<string | null>(null)
  // Type kept as string so button variant comparisons don't get narrowed by early returns
  const [activeView, setActiveView] = useState<string>('admin')
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null)
  const [selectedTraineeName, setSelectedTraineeName] = useState<string>('')
  const [activeTraineeTab, setActiveTraineeTab] = useState<TraineeTab>('workouts')

  const updateStatus = useMutation({
    mutationFn: async ({ uid, status }: { uid: string; status: 'APPROVED' | 'REJECTED' }) => {
      await updateDoc(doc(db, 'users', uid), { verificationStatus: status })
    },
    onMutate: ({ uid }) => setProcessing(uid),
    onSettled: () => {
      setProcessing(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-physios'] })
    },
  })

  const exitSubView = () => {
    setActiveView('admin')
    setSelectedTraineeId(null)
    setSelectedTraineeName('')
    setActiveTraineeTab('workouts')
  }

  // ── Sub-view: Trainer ──
  if (activeView === 'trainer') {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exitSubView} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Exit View
          </Button>
          <span className="text-sm font-medium text-zinc-400">Trainer View</span>
        </div>
        <TrainerDashboard />
      </div>
    )
  }

  // ── Sub-view: Physio ──
  if (activeView === 'physio') {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exitSubView} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Exit View
          </Button>
          <span className="text-sm font-medium text-zinc-400">Physio View</span>
        </div>
        <PhysioDashboard />
      </div>
    )
  }

  // ── Sub-view: Trainee (with sidebar + tab navigation) ──
  if (activeView === 'trainee') {
    // Step 2: Selected trainee → full sidebar layout with tab-based content
    if (selectedTraineeId) {
      let tabContent: React.ReactNode
      switch (activeTraineeTab) {
        case 'nutrition':
          tabContent = <NutritionPage viewAsId={selectedTraineeId} />
          break
        case 'connect':
          tabContent = <ConnectPage viewAsId={selectedTraineeId} />
          break
        default:
          tabContent = (
            <TraineeDashboard viewAsId={selectedTraineeId} viewAsName={selectedTraineeName} />
          )
      }

      return (
        <DashboardLayout
          adminMode
          activeTab={activeTraineeTab}
          onTabChange={setActiveTraineeTab}
          onExitAdmin={exitSubView}
          viewingUserName={selectedTraineeName}
        >
          {tabContent}
        </DashboardLayout>
      )
    }

    // Step 1: Trainee selection screen
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-400 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={exitSubView} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Admin
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white">Trainee View</h2>
              <p className="text-sm text-zinc-400">Select a trainee to view their dashboard.</p>
            </div>
          </div>
          <TraineeSelector
            onSelectTrainee={(userId, displayName) => {
              setSelectedTraineeId(userId)
              setSelectedTraineeName(displayName)
              setActiveTraineeTab('workouts')
            }}
          />
        </div>
      </div>
    )
  }

  // ── Default: Admin Overview ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Shield className="h-8 w-8 text-amber-400" />
              Admin Panel
            </h1>
            <p className="text-zinc-400 mt-1">Manage platform verifications and user trust.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <Button
                variant={activeView === 'admin' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('admin')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" /> Overview
              </Button>
              <Button
                variant={activeView === 'trainee' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('trainee')}
                className="gap-2"
              >
                <HeartPulse className="h-4 w-4" /> Trainee View
              </Button>
              <Button
                variant={activeView === 'trainer' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('trainer')}
                className="gap-2"
              >
                <Dumbbell className="h-4 w-4" /> Trainer View
              </Button>
              <Button
                variant={activeView === 'physio' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('physio')}
                className="gap-2"
              >
                <Stethoscope className="h-4 w-4" /> Physio View
              </Button>
            </div>
            <UserMenu />
          </div>
        </div>

        {/* Stats Grid */}
        <AdminStats />

        {/* Pending Physio Section */}
        <Card className="border-zinc-800 bg-zinc-900 text-zinc-400">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Pending Physio Verifications
              {pendingPhysios && pendingPhysios.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-xs font-bold">
                  {pendingPhysios.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!pendingPhysios || pendingPhysios.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm mt-1">
                  No Physiotherapists are currently awaiting verification.
                </p>
              </div>
            ) : (
              pendingPhysios.map(physio => (
                <div
                  key={physio.uid}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-950 border border-zinc-800 transition-all hover:border-zinc-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {physio.displayName || 'Anonymous Physio'}
                      </div>
                      <div className="text-sm text-zinc-500">{physio.email}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">
                        License uploaded:{' '}
                        {physio.verification?.licenseUrl ? (
                          <a
                            href={physio.verification.licenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-zinc-600">Not provided</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ uid: physio.uid, status: 'APPROVED' })}
                      disabled={processing === physio.uid}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      {processing === physio.uid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ uid: physio.uid, status: 'REJECTED' })}
                      disabled={processing === physio.uid}
                      className="border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
