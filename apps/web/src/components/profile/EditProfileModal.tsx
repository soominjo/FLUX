import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Camera } from 'lucide-react'
import { Button } from '@repo/ui'
import { useProfileUpdate } from '../../hooks/useProfileUpdate'
import type { UserProfile } from '@repo/shared'

interface EditProfileModalProps {
  profile: UserProfile | null
  onClose: () => void
}

export function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const { updateProfile, isUpdating } = useProfileUpdate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(profile?.photoURL || '')
  const [error, setError] = useState<string | null>(null)

  // Role-specific fields
  const [certifications, setCertifications] = useState(profile?.certifications?.join(', ') || '')
  const [mainGoal, setMainGoal] = useState('')

  const isTrainer = profile?.role === 'TRAINER'
  const isTrainee = profile?.role === 'TRAINEE'

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setImageFile(file)
    setError(null)

    // Create preview URL using FileReader
    const reader = new FileReader()
    reader.onload = event => {
      setImagePreview(event.target?.result as string)
    }
    reader.onerror = () => {
      setError('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    if (bio.length > 150) {
      setError('Bio must be 150 characters or less')
      return
    }

    setError(null)

    const updateData: Record<string, unknown> = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      location: location.trim(),
    }

    if (isTrainer && certifications.trim()) {
      updateData.certifications = certifications
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
    }

    if (isTrainee && mainGoal.trim()) {
      updateData.goals = [mainGoal.trim()]
    }

    updateProfile(updateData, imageFile || undefined)
    // Hook handles success/error alerts and reload
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUpdating) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isUpdating, onClose])

  // Prevent scrolling on body when modal is open
  useEffect(() => {
    const originalOverflow = document.documentElement.style.overflow
    const originalHeight = document.documentElement.style.height
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100%'
    return () => {
      document.documentElement.style.overflow = originalOverflow
      document.documentElement.style.height = originalHeight
    }
  }, [])

  return createPortal(
    <>
      {/* Portal-like Overlay - blocks all background interaction */}
      <div
        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Modal Content - stacked above overlay */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-2xl font-bold text-white">
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="p-1 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Avatar Section — with Firebase Storage Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Profile Picture</label>
            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-lime-500 to-blue-500 flex items-center justify-center overflow-hidden flex-shrink-0 border-4 border-zinc-900">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                {/* Camera Icon Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUpdating}
                  className="absolute bottom-0 right-0 bg-lime-500 hover:bg-lime-600 disabled:opacity-50 text-black rounded-full p-2 transition-colors shadow-lg"
                  title="Change photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={isUpdating}
                  className="hidden"
                />
              </div>
              <div className="text-sm text-zinc-400">
                <p className="font-medium text-zinc-300">Change Photo</p>
                <p className="text-xs mt-1">JPG, PNG • Max 5MB • Auto-compressed</p>
                {imageFile && (
                  <p className="text-xs text-lime-400 mt-1">✓ Ready to upload: {imageFile.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Display Name Field */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Display Name *</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={isUpdating}
              placeholder="Your full name"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-400 disabled:opacity-50 placeholder:text-zinc-600"
            />
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Bio ({bio.length}/150)
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 150))}
              disabled={isUpdating}
              placeholder="Tell members about yourself..."
              maxLength={150}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-400 disabled:opacity-50 placeholder:text-zinc-600 resize-none"
            />
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              disabled={isUpdating}
              placeholder="City, Country"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-400 disabled:opacity-50 placeholder:text-zinc-600"
            />
          </div>

          {/* Trainer-Specific Fields */}
          {isTrainer && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Certifications</label>
              <input
                type="text"
                value={certifications}
                onChange={e => setCertifications(e.target.value)}
                disabled={isUpdating}
                placeholder="e.g., NASM Certified, CrossFit Level 1 (comma-separated)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-400 disabled:opacity-50 placeholder:text-zinc-600"
              />
            </div>
          )}

          {/* Trainee-Specific Fields */}
          {isTrainee && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Main Goal</label>
              <input
                type="text"
                value={mainGoal}
                onChange={e => setMainGoal(e.target.value)}
                disabled={isUpdating}
                placeholder="e.g., Weight Loss, Build Muscle, Improve Flexibility"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-lime-400 disabled:opacity-50 placeholder:text-zinc-600"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-zinc-800">
            <Button onClick={onClose} disabled={isUpdating} variant="ghost" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUpdating || !displayName.trim()}
              className="flex-1 bg-lime-500 hover:bg-lime-600 disabled:opacity-50 text-black font-semibold flex items-center justify-center gap-2"
            >
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isUpdating ? 'Saving & Uploading...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
