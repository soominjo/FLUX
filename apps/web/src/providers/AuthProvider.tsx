import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { UserProfile } from '@repo/shared'

interface AuthContextType {
  user: User | null
  userRole: UserProfile['role'] | null | undefined
  userProfile: UserProfile | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserProfile['role'] | null | undefined>(undefined)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser)
      if (currentUser) {
        // Fetch user profile from Firestore to get the role
        const userDocRef = doc(db, 'users', currentUser.uid)
        try {
          const userSnap = await getDoc(userDocRef)

          if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile
            setUserRole(userData.role)
            setUserProfile(userData)
          } else {
            setUserRole(null) // User exists in Auth but no profile yet (needs onboarding)
            setUserProfile(null)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          setUserRole(null)
          setUserProfile(null)
        }
      } else {
        setUserRole(null)
        setUserProfile(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error signing in with Google', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await firebaseSignInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error signing in with Email', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await firebaseCreateUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error signing up with Email', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserRole(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        userProfile,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
