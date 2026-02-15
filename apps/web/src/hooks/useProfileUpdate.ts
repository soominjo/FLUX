import { useAuth } from '../providers/AuthProvider'
import { useState } from 'react'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp, type FieldValue } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'

interface ProfileUpdateData {
  displayName?: string
  bio?: string
  location?: string
  goals?: string[]
  certifications?: string[]
}

// Compress and resize image before upload for faster transfer
async function compressImage(
  file: File,
  maxWidth: number = 320,
  maxHeight: number = 320,
  quality: number = 0.75
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = event => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            const timestamp = Date.now()
            const compressedFile = new File([blob], `avatar-${timestamp}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => reject(new Error('Invalid image file'))
    }

    reader.onerror = () => reject(new Error('Failed to read image file'))
  })
}

export function useProfileUpdate() {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false) // Added isUpdating state

  const updateProfile = async (
    // Replaced useMutation with this function
    data: ProfileUpdateData,
    imageFile?: File
  ) => {
    setIsUpdating(true)
    try {
      if (!user) throw new Error('Not authenticated')

      // 1. Validate File Size (Max 5MB)
      if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        throw new Error('Image is too large. Please choose an image under 5MB.')
      }

      let photoURL = user.photoURL || undefined

      // 2. Handle Image Upload
      if (imageFile) {
        console.log('Starting upload...')

        // Compress image first (lightweight, fast) - with safety timeout
        const compressionPromise = compressImage(imageFile, 320, 320, 0.75)
        const timeoutPromise = new Promise<File>((_, reject) => {
          setTimeout(() => reject(new Error('Image compression timed out')), 5000)
        })

        // Race compression against timeout
        let fileToUpload = imageFile
        try {
          fileToUpload = await Promise.race([compressionPromise, timeoutPromise])
        } catch (e) {
          console.warn(
            'Compression failed or timed out, falling back to original file if small enough'
          )
          if (imageFile.size > 2 * 1024 * 1024) {
            throw new Error('Image compression failed and original is too large (>2MB).')
          }
        }

        const timestamp = Date.now()
        const storageRef = ref(storage, `avatars/${user.uid}/${timestamp}`) // Timestamp to avoid caching issues

        await uploadBytes(storageRef, fileToUpload, {
          cacheControl: 'public, max-age=86400',
          contentType: 'image/jpeg',
        })

        console.log('Upload complete, fetching URL...')
        photoURL = await getDownloadURL(storageRef)
      }

      // 3. Update Auth & Firestore
      // Update Firebase Auth (immediate session sync)
      await updateAuthProfile(user, {
        displayName: data.displayName || user.displayName || undefined,
        photoURL: photoURL,
      })

      // Update Firestore
      const updatePayload: Record<string, string | string[] | FieldValue | undefined> = {
        displayName: data.displayName || user.displayName || undefined,
        updatedAt: serverTimestamp(),
      }

      if (photoURL) updatePayload.photoURL = photoURL
      if (data.bio !== undefined) updatePayload.bio = data.bio
      if (data.location !== undefined) updatePayload.location = data.location
      if (data.goals !== undefined) updatePayload.goals = data.goals
      if (data.certifications !== undefined) updatePayload.certifications = data.certifications

      await updateDoc(doc(db, 'users', user.uid), updatePayload)

      alert('Profile Updated Successfully!')
      window.location.reload()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Profile Update Failed:', error)
      alert(`Update Failed: ${errorMessage}`)
    } finally {
      setIsUpdating(false)
    }
  }

  return { updateProfile, isUpdating } // Returned the new function and state
}
