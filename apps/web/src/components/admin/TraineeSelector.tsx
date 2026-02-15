import { collection, query, where, getDocs } from 'firebase/firestore'
import { useQuery } from '@tanstack/react-query'
import { db } from '../../lib/firebase'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { Users, User, Eye, Loader2, Search } from 'lucide-react'
import { useState } from 'react'

interface TraineeUser {
  uid: string
  displayName?: string
  email?: string
  photoURL?: string
  createdAt?: { seconds: number }
}

function useAllTrainees() {
  return useQuery({
    queryKey: ['admin', 'all-trainees'],
    queryFn: async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'TRAINEE'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(d => ({
        uid: d.id,
        ...d.data(),
      })) as TraineeUser[]
    },
  })
}

interface TraineeSelectorProps {
  onSelectTrainee: (userId: string, displayName: string) => void
}

export function TraineeSelector({ onSelectTrainee }: TraineeSelectorProps) {
  const { data: trainees, isLoading } = useAllTrainees()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = trainees?.filter(t => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return t.displayName?.toLowerCase().includes(term) || t.email?.toLowerCase().includes(term)
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
      </div>
    )
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-lime-400" />
          Select a Trainee
          {trainees && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-400 text-xs font-bold">
              {trainees.length}
            </span>
          )}
        </CardTitle>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!filtered || filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No trainees found</p>
            <p className="text-sm mt-1">
              {searchTerm
                ? 'Try a different search term.'
                : 'No users with the TRAINEE role exist yet.'}
            </p>
          </div>
        ) : (
          filtered.map(trainee => (
            <div
              key={trainee.uid}
              className="flex items-center justify-between p-4 rounded-lg bg-zinc-950 border border-zinc-800 transition-all hover:border-zinc-700"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 overflow-hidden">
                  {trainee.photoURL ? (
                    <img src={trainee.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">
                    {trainee.displayName || 'Unnamed Trainee'}
                  </div>
                  <div className="text-xs text-zinc-500">{trainee.email}</div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() =>
                  onSelectTrainee(trainee.uid, trainee.displayName || 'Unnamed Trainee')
                }
                className="gap-2 bg-lime-500 hover:bg-lime-600 text-black font-medium"
              >
                <Eye className="h-4 w-4" /> View Dashboard
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
