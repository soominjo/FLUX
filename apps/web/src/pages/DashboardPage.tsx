import { Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../providers/AuthProvider'

const ROLE_REDIRECT: Record<string, string> = {
  TRAINEE: '/dashboard/workouts',
  TRAINER: '/dashboard/trainer',
  PHYSIO: '/dashboard/physio',
  SUPERADMIN: '/dashboard/admin',
}

export default function DashboardPage() {
  const { userRole, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        Loading...
      </div>
    )
  }

  const target = userRole ? ROLE_REDIRECT[userRole] : null

  if (target) {
    return <Navigate to={target} replace />
  }

  return (
    <>
      <Helmet>
        <title>FLUX | Dashboard</title>
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <h1 className="text-xl">Role not found. Please contact support.</h1>
      </div>
    </>
  )
}
