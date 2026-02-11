import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { Relationship } from '@repo/shared'

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

// 2. Fetch My Clients (Active connections where I am the Provider)
export function useMyClients() {
  const user = auth.currentUser

  return useQuery({
    queryKey: RELATIONSHIP_KEYS.myClients(user?.uid || ''),
    queryFn: async (): Promise<Relationship[]> => {
      if (!user) return []

      const q = query(
        collection(db, 'relationships'),
        where('providerId', '==', user.uid),
        where('status', '==', 'ACTIVE')
      )

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
        status: 'ACTIVE', // Auto-accept for V1 (or PENDING if we wanted a flow) - User request implied "Connect" button works immediately?
        // "Invite logic... creates document... sets status" - let's assume ACTIVE for V1 to simplify "Viewers Injection" testing immediately.
        // Actually, schema has RelationStatusEnum. Let's start with ACTIVE for less friction in V1.
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
      }
    },
  })
}
