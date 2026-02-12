import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Edit2, LogOut, User, Link as LinkIcon, Check } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useUserProfile } from '../../hooks/useSocial'
import { EditProfileModal } from '../profile/EditProfileModal'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@repo/ui'

interface UserMenuProps {
  onEditProfile?: () => void
}

export function UserMenu({ onEditProfile }: UserMenuProps) {
  const { user, logout, userProfile, userRole } = useAuth()
  const { data: profile } = useUserProfile(user?.uid || '')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Determine dropdown direction based on user role
  // Trainees have bottom sidebar -> open UP (bottom-full)
  // Trainers/Physios have top navbar -> open DOWN (top-full)
  const isTrainee = userRole === 'TRAINEE'
  const dropdownPositionClass = isTrainee ? 'bottom-full mb-2' : 'top-full mt-2'

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setIsOpen(false)
    await logout()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  const handleEditProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditModalOpen(true)
    setIsOpen(false)
    onEditProfile?.()
  }

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (user?.uid) {
      navigate(`/profile/${user.uid}`)
      setIsOpen(false)
    }
  }

  const handleCopyInviteLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user?.uid) return

    try {
      // Copy ONLY the user ID, not the full URL
      await navigator.clipboard.writeText(user.uid)
      setIsCopied(true)

      // Reset the "copied" state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy invite code:', err)
    }
  }

  const displayName = user?.displayName || userProfile?.displayName || 'User'
  const photoURL = user?.photoURL || userProfile?.photoURL
  const initials = displayName.charAt(0).toUpperCase()

  if (!user) return null

  return (
    <>
      {/* User Menu Container */}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          title="User menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-lime-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
            {photoURL ? (
              <img src={photoURL} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          {/* Name and chevron */}
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-sm font-medium text-white truncate max-w-[120px]">
              {displayName}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-zinc-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </div>
        </button>

        {/* Dropdown Menu - Dynamic direction based on user role */}
        {isOpen && (
          <div
            className={`absolute right-0 ${dropdownPositionClass} w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden`}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>

            {/* Menu Items */}
            <nav className="py-1">
              <button
                type="button"
                onClick={handleEditProfile}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
              >
                <Edit2 className="h-4 w-4 flex-shrink-0" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span>View Profile</span>
              </button>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-lime-400 hover:bg-zinc-800 hover:text-lime-300 transition-colors text-left"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <LinkIcon className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{isCopied ? 'Code Copied!' : 'Copy Invite Code'}</span>
              </button>
            </nav>

            {/* Sign Out */}
            <div className="py-1 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors text-left"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && profile && (
        <EditProfileModal
          profile={profile}
          userId={user?.uid || ''}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false)
            // Refresh profile data
            if (user?.uid) {
              queryClient.invalidateQueries({ queryKey: ['user', user.uid] })
            }
          }}
        />
      )}
    </>
  )
}
