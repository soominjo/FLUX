import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { Relationship } from '@repo/shared'
import { useAuth } from '../providers/AuthProvider'

export const RELATIONSHIP_KEYS = {
  all: ['relationships'] as const,
  myProviders: (userId: string) => [...RELATIONSHIP_KEYS.all, 'providers', userId] as const,
  myClients: (userId: string) => [...RELATIONSHIP_KEYS.all, 'clients', userId] as const,
}

// 1. Fetch My Providers (Active connections where I am the Trainee)
export function useMyProviders() {
  const user = auth.currentUser

  return useQuery({
    queryKey: RELATIONSHIP_KEYS.myProviders(user?.uid || ''),
    queryFn: async (): Promise<Relationship[]> => {
      if (!user) return []

      const q = query(
        collection(db, 'relationships'),
        where('traineeId', '==', user.uid),
        where('status', '==', 'ACTIVE')
      )

      const snapshot = await getDocs(q)
      const providers: Relationship[] = []

      snapshot.forEach(doc => {
        providers.push({ id: doc.id, ...doc.data() } as Relationship)
      })

      return providers
    },
    enabled: !!user,
  })
}

// 1b. Fetch My Pending Providers (Pending connections where I am the Trainee)
export function useMyPendingProviders() {
  const user = auth.currentUser

  return useQuery({
    queryKey: [...RELATIONSHIP_KEYS.all, 'providers', 'pending', user?.uid],
    queryFn: async (): Promise<Relationship[]> => {
      if (!user) return []

      const q = query(
        collection(db, 'relationships'),
        where('traineeId', '==', user.uid),
        where('status', '==', 'PENDING')
      )

      const snapshot = await getDocs(q)
      const providers: Relationship[] = []

      snapshot.forEach(doc => {
        providers.push({ id: doc.id, ...doc.data() } as Relationship)
      })

      return providers
    },
    enabled: !!user,
  })
}

// 2. Fetch My Clients (Active connections where I am the Provider)
export function useMyClients() {
  const { user, userProfile } = useAuth()

  return useQuery({
    queryKey: RELATIONSHIP_KEYS.myClients(user?.uid || ''),
    queryFn: async (): Promise<Relationship[]> => {
      if (!user) return []

      const isAdmin =
        (userProfile?.role as string) === 'SUPERADMIN' || (userProfile?.role as string) === 'admin'

      let q
      if (isAdmin) {
        // Admin sees ALL active connections
        q = query(collection(db, 'relationships'), where('status', '==', 'ACTIVE'))
      } else {
        q = query(
          collection(db, 'relationships'),
          where('providerId', '==', user.uid),
          where('status', '==', 'ACTIVE')
        )
      }

      const snapshot = await getDocs(q)
      const clients: Relationship[] = []

      snapshot.forEach(doc => {
        clients.push({ id: doc.id, ...doc.data() } as Relationship)
      })

      return clients
    },
    enabled: !!user,
  })
}

// 2b. Fetch Pending Clients (Pending connections where I am the Provider)
export function usePendingClients() {
  const { user, userProfile } = useAuth()

  return useQuery({
    queryKey: [...RELATIONSHIP_KEYS.all, 'pending', user?.uid],
    queryFn: async (): Promise<Relationship[]> => {
      if (!user) return []

      const isAdmin =
        (userProfile?.role as string) === 'SUPERADMIN' || (userProfile?.role as string) === 'admin'

      let q
      if (isAdmin) {
        // Admin sees ALL pending connections
        q = query(collection(db, 'relationships'), where('status', '==', 'PENDING'))
      } else {
        q = query(
          collection(db, 'relationships'),
          where('providerId', '==', user.uid),
          where('status', '==', 'PENDING')
        )
      }

      const snapshot = await getDocs(q)
      const pending: Relationship[] = []

      snapshot.forEach(doc => {
        pending.push({ id: doc.id, ...doc.data() } as Relationship)
      })

      return pending
    },
    enabled: !!user,
  })
}

// 3. Add Connection (Invite Logic)
export function useAddConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      inviteCode,
      role,
    }: {
      inviteCode: string
      role: 'TRAINER' | 'PHYSIO' | 'BUDDY'
    }) => {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      // In V1, inviteCode IS the target user's UID.
      // We should probably check if a relationship already exists, but for V1 we'll trust Firestore rules or just add.
      // Ideally we check if the user exists, but we can't easily query users without an index or knowing if it's a valid UID.
      // We'll assume the user pasted a valid UID.

      const newRelationship = {
        traineeId: user.uid,
        providerId: inviteCode, // The target user's UID
        type: role,
        status: 'PENDING',
        permissions: {
          canViewDiet: true,
          canViewMedical: true,
        },
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'relationships'), newRelationship)
    },
    onSuccess: () => {
      const user = auth.currentUser
      if (user) {
        queryClient.invalidateQueries({ queryKey: RELATIONSHIP_KEYS.myProviders(user.uid) })
        queryClient.invalidateQueries({
          queryKey: [...RELATIONSHIP_KEYS.all, 'providers', 'pending', user.uid],
        })
      }
    },
  })
}

// 4. Respond to Connection Request
export function useRespondToConnection() {
  const queryClient = useQueryClient()
  const user = auth.currentUser

  return useMutation({
    mutationFn: async ({
      connectionId,
      action,
    }: {
      connectionId: string
      action: 'ACCEPT' | 'REJECT'
    }) => {
      if (!user) throw new Error('Not authenticated')

      const connectionRef = doc(db, 'relationships', connectionId)

      if (action === 'ACCEPT') {
        await updateDoc(connectionRef, {
          status: 'ACTIVE',
        })
      } else {
        // Option A: Delete the request completely
        // await deleteDoc(connectionRef)
        // Option B: Set to DECLINED (better for audit/spam prevention, but let's just delete for now as per requirements "no connection is formed")
        await deleteDoc(connectionRef)
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: RELATIONSHIP_KEYS.myClients(user.uid) })
        queryClient.invalidateQueries({ queryKey: [...RELATIONSHIP_KEYS.all, 'pending', user.uid] })
      }
    },
  })
}
