import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Users, User, Stethoscope, Dumbbell } from 'lucide-react'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { useQuery } from '@tanstack/react-query'
import { db } from '../../lib/firebase'

export function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const usersRef = collection(db, 'users')

      // Run parallel count queries
      const [totalSnap, traineesSnap, trainersSnap, physiosSnap] = await Promise.all([
        getCountFromServer(usersRef),
        getCountFromServer(query(usersRef, where('role', '==', 'TRAINEE'))),
        getCountFromServer(query(usersRef, where('role', '==', 'TRAINER'))),
        getCountFromServer(query(usersRef, where('role', '==', 'PHYSIO'))),
      ])

      return {
        total: totalSnap.data().count,
        trainees: traineesSnap.data().count,
        trainers: trainersSnap.data().count,
        physios: physiosSnap.data().count,
      }
    },
  })

  const cards = [
    {
      title: 'Total Users',
      value: stats?.total || 0,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      border: 'border-indigo-400/20',
    },
    {
      title: 'Trainees',
      value: stats?.trainees || 0,
      icon: User,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      title: 'Trainers',
      value: stats?.trainers || 0,
      icon: Dumbbell,
      color: 'text-lime-400',
      bg: 'bg-lime-400/10',
      border: 'border-lime-400/20',
    },
    {
      title: 'Physios',
      value: stats?.physios || 0,
      icon: Stethoscope,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
    },
  ]

  if (isLoading) {
    return <div className="text-zinc-500">Loading stats...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map(card => (
        <Card key={card.title} className={`bg-zinc-900 ${card.border}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{card.title}</CardTitle>
            <div className={`p-2 rounded-full ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
