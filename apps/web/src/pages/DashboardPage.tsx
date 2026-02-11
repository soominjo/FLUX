import { useAuth } from '../providers/AuthProvider'
import TraineeDashboard from './dashboard/TraineeDashboard'

export default function DashboardPage() {
  const { userRole, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        Loading...
      </div>
    )
  }

  // Role-Based Routing / Rendering
  if (userRole === 'TRAINEE') {
    return <TraineeDashboard />
  }

  if (userRole === 'TRAINER') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <h1 className="text-2xl">Trainer Dashboard (Coming Soon)</h1>
      </div>
    )
  }

  if (userRole === 'PHYSIO') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <h1 className="text-2xl">Physio Dashboard (Coming Soon)</h1>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
      <h1 className="text-xl">Role not found. Please contact support.</h1>
    </div>
  )
}
