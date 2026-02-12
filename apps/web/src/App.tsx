import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import LoginPage from './pages/auth/LoginPage'
import SignUpPage from './pages/auth/SignUpPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import WorkoutsPage from './pages/dashboard/WorkoutsPage'
import NutritionPage from './pages/dashboard/NutritionPage'
import ConnectPage from './pages/dashboard/ConnectPage'
import TeamFeedPage from './pages/social/TeamFeedPage'
import UserProfilePage from './pages/social/UserProfilePage'
import TrainerDashboard from './pages/dashboard/TrainerDashboard'
import PhysioDashboard from './pages/dashboard/PhysioDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import { Loader2 } from 'lucide-react'

// Role → home path mapping (single source of truth)
const ROLE_HOME: Record<string, string> = {
  TRAINEE: '/dashboard',
  TRAINER: '/dashboard/trainer',
  PHYSIO: '/dashboard/physio',
  SUPERADMIN: '/dashboard/admin',
}

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-zinc-950">
    <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
  </div>
)

// Protected Route Component
const ProtectedRoute = ({
  requireRole = true,
  allowedRoles,
}: {
  requireRole?: boolean
  allowedRoles?: string[]
}) => {
  const { user, userRole, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If user has NO role, they MUST go to onboarding (unless they are already there)
  if (!userRole && requireRole) {
    return <Navigate to="/onboarding" replace />
  }

  // If user HAS a role, they should NOT access onboarding
  if (userRole && !requireRole) {
    return <Navigate to={ROLE_HOME[userRole] || '/dashboard'} replace />
  }

  // Role-based access control: bounce unauthorized roles to their home
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to={ROLE_HOME[userRole] || '/dashboard'} replace />
  }

  return <Outlet />
}

// Public-Only Route — blocks authenticated users from Login/Signup
const PublicOnlyRoute = () => {
  const { user, userRole, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (user) {
    const targetPath = userRole ? ROLE_HOME[userRole] || '/dashboard' : '/onboarding'
    return <Navigate to={targetPath} replace />
  }

  return <Outlet />
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public-Only Routes (redirect to dashboard if already logged in) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
          </Route>

          {/* Protected Routes (No Role Required - i.e. Onboarding) */}
          <Route element={<ProtectedRoute requireRole={false} />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Shared routes — any authenticated user with a role */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/feed" element={<TeamFeedPage />} />
            <Route path="/profile/:uid" element={<UserProfilePage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Trainee routes (SUPERADMIN also has access via DashboardLayout sidebar) */}
          <Route element={<ProtectedRoute allowedRoles={['TRAINEE', 'SUPERADMIN']} />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="workouts" element={<WorkoutsPage />} />
              <Route path="nutrition" element={<NutritionPage />} />
              <Route path="connect" element={<ConnectPage />} />
            </Route>
          </Route>

          {/* Trainer only */}
          <Route element={<ProtectedRoute allowedRoles={['TRAINER']} />}>
            <Route path="/dashboard/trainer" element={<TrainerDashboard />} />
          </Route>

          {/* Physio only */}
          <Route element={<ProtectedRoute allowedRoles={['PHYSIO']} />}>
            <Route path="/dashboard/physio" element={<PhysioDashboard />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['SUPERADMIN']} />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
          </Route>

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
