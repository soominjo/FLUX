import { collection, doc, writeBatch } from 'firebase/firestore'
import { db } from './firebase' // Ensure this points to your firebase config

export const seedDatabase = async (currentUserId: string) => {
  if (!currentUserId) return alert('Please login first!')

  const batch = writeBatch(db)
  const today = new Date()

  // 1. Create Dummy Trainer & Physio Users (Using fake IDs)
  const trainerId = 'trainer_demo_123'
  const physioId = 'physio_demo_456'

  // 2. Create Relationship (You <-> Trainer)
  const relRef = doc(collection(db, 'relationships'))
  batch.set(relRef, {
    traineeId: currentUserId,
    providerId: trainerId,
    type: 'TRAINER',
    status: 'ACTIVE',
    permissions: { canViewDiet: true, canViewMedical: false },
    createdAt: new Date(),
  })

  // 3. Create 5 Dummy Workouts (Past 5 days)
  for (let i = 0; i < 5; i++) {
    const workoutRef = doc(collection(db, 'workouts'))
    const date = new Date()
    date.setDate(today.getDate() - i)

    batch.set(workoutRef, {
      userId: currentUserId,
      date: date,
      title: `Workout Day -${i}`,
      strainScore: Math.floor(Math.random() * 21), // Random 0-21
      durationMinutes: 45 + i * 5,
      perceivedPain: i === 0 ? 6 : 0, // Make today's workout painful (for testing Physio view)
      targetedMuscles: ['Chest', 'Triceps'],
      exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weight: 100 }],
      // CRITICAL: Add Trainer to viewers so they can query this
      viewers: [currentUserId, trainerId],
    })
  }

  // 4. Create 7 Days of Metrics (For Graphs)
  for (let i = 0; i < 7; i++) {
    const dateStr = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    const metricRef = doc(db, 'daily_metrics', `${currentUserId}_${dateStr}`)

    batch.set(metricRef, {
      userId: currentUserId,
      date: dateStr,
      recoveryScore: Math.floor(Math.random() * 100),
      sleepHours: 6 + Math.random() * 3,
      restingHR: 60 + Math.floor(Math.random() * 10),
      viewers: [currentUserId, trainerId, physioId],
    })
  }

  await batch.commit()
  alert('Database Seeded! You now have data.')
}
