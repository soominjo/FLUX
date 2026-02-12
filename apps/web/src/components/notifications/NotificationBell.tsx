import { useState, useRef, useEffect } from 'react'
import { Bell, MessageSquare, UserPlus, ClipboardList, Heart, Info } from 'lucide-react'
import { Button, cn } from '@repo/ui'
import { useNotifications } from '../../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import type { Notification } from '@repo/shared'

/** Derive the correct route for a notification, NEVER blindly trusting `link`. */
function getNotificationRoute(notif: Notification): string | null {
  const type = notif.type ?? 'GENERAL'

  switch (type) {
    case 'NEW_MESSAGE':
    case 'CONNECTION_REQUEST':
    case 'KUDOS':
      // Route to the sender's public profile
      return notif.senderId ? `/profile/${notif.senderId}` : null

    case 'NEW_PLAN':
      // Route to the user's own workouts page
      return '/dashboard/workouts'

    case 'GENERAL':
    default:
      // Legacy fallback — only allow safe paths (never another role's dashboard)
      if (
        notif.link &&
        !notif.link.includes('trainer-dashboard') &&
        !notif.link.includes('physio-dashboard') &&
        !notif.link.includes('admin')
      ) {
        return notif.link
      }
      return null
  }
}

/** Icon per notification type */
function NotifIcon({ type }: { type?: string }) {
  switch (type) {
    case 'NEW_MESSAGE':
      return <MessageSquare className="h-4 w-4 text-blue-400" />
    case 'CONNECTION_REQUEST':
      return <UserPlus className="h-4 w-4 text-lime-400" />
    case 'NEW_PLAN':
      return <ClipboardList className="h-4 w-4 text-amber-400" />
    case 'KUDOS':
      return <Heart className="h-4 w-4 text-pink-400" />
    default:
      return <Info className="h-4 w-4 text-zinc-400" />
  }
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotifClick = (notif: Notification) => {
    if (notif.id) markAsRead(notif.id)

    const route = getNotificationRoute(notif)
    if (route) {
      setIsOpen(false)
      navigate(route)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-zinc-400 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-zinc-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-zinc-500">
                All clear — no notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors',
                    !notif.read && 'bg-blue-500/5 border-l-2 border-l-blue-500'
                  )}
                  onClick={() => handleNotifClick(notif)}
                >
                  <div className="mt-0.5 shrink-0">
                    <NotifIcon type={notif.type} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-white truncate">{notif.title}</span>
                    <span className="text-xs text-zinc-400 line-clamp-2">{notif.body}</span>
                    <span className="text-[10px] text-zinc-600 mt-0.5">
                      {notif.createdAt
                        ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString()
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
