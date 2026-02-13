import { useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { NotificationBell } from '../../components/notifications/NotificationBell'
import { UserMenu } from '../../components/nav/UserMenu'
import { Dumbbell, Apple, Users, Menu, X, LayoutGrid, Users2 } from 'lucide-react'

const traineeLinks = [
  { to: '/dashboard/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/dashboard/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/dashboard/connect', label: 'Connect', icon: Users },
]

const adminLinks = [
  { to: '/dashboard/admin', label: 'Command Center', icon: LayoutGrid },
  { to: '/dashboard/admin/users', label: 'User Management', icon: Users2 },
]

export default function DashboardLayout() {
  const { user, userRole } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Role-aware home path
  const ROLE_HOME: Record<string, string> = {
    TRAINEE: '/dashboard/workouts',
    TRAINER: '/dashboard/trainer',
    PHYSIO: '/dashboard/physio',
    SUPERADMIN: '/dashboard/admin',
  }
  const homeLink = ROLE_HOME[userRole || ''] || '/dashboard'

  // Dynamically build nav items based on role
  let currentNavItems = [...traineeLinks]

  if (userRole === 'SUPERADMIN') {
    // Admin sees Admin Panel + Trainee Features
    currentNavItems = [...adminLinks, ...traineeLinks]
  }

  const sidebarContent = (
    <>
      {/* Brand — links to role-specific home */}
      <Link to={homeLink} className="block px-6 py-6 hover:bg-zinc-800/30 transition-colors">
        <h2 className="text-xl font-bold text-white tracking-tight">
          FL<span className="text-lime-400">UX</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-1 truncate">{user?.displayName || 'Trainee'}</p>
      </Link>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1">
        {currentNavItems.map(({ to, label, icon: Icon }, index) => {
          // Divider logic
          if (label === '---') {
            return <div key={`divider-${index}`} className="h-px bg-zinc-800 my-2 mx-3" />
          }

          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-lime-400/10 text-lime-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* User Menu Footer */}
      <div className="px-3 pb-6 border-t border-zinc-800">
        <UserMenu />
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-[250px] flex-col border-r border-zinc-800 bg-zinc-900/50 fixed inset-y-0 left-0">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          {/* Drawer */}
          <aside className="relative z-50 w-[250px] h-full flex flex-col bg-zinc-900 border-r border-zinc-800">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-[250px] flex flex-col">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to={homeLink} className="text-lg font-bold text-white tracking-tight">
            FL<span className="text-lime-400">UX</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 bg-zinc-950 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
