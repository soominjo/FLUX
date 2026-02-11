import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import LoginPage from './pages/auth/LoginPage'
import SignUpPage from './pages/auth/SignUpPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import TeamFeedPage from './pages/social/TeamFeedPage'
import UserProfilePage from './pages/social/UserProfilePage'
import TrainerDashboard from './pages/dashboard/TrainerDashboard'
import PhysioDashboard from './pages/dashboard/PhysioDashboard'
import { Loader2 } from 'lucide-react'

// Protected Route Component
const ProtectedRoute = ({ requireRole = true }: { requireRole?: boolean }) => {
  const { user, userRole, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If user has NO role, they MUST go to onboarding (unless they are already there)
  if (!userRole && requireRole) {
    return <Navigate to="/onboarding" replace />
  }

  // If user HAS a role, they should NOT access onboarding
  if (userRole && !requireRole) {
    // Redirect based on role
    if (userRole === 'TRAINER') return <Navigate to="/trainer-dashboard" replace />
    if (userRole === 'PHYSIO') return <Navigate to="/physio-dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Protected Routes (No Role Required - i.e. Onboarding) */}
          <Route element={<ProtectedRoute requireRole={false} />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Protected Routes (Role Required) */}
          <Route element={<ProtectedRoute requireRole={true} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
            <Route path="/physio-dashboard" element={<PhysioDashboard />} />
            <Route path="/feed" element={<TeamFeedPage />} />
            <Route path="/profile/:uid" element={<UserProfilePage />} />

            {/* Default redirect for authenticated users with role */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
