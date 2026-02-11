import { z } from 'zod'

// --- Enums ---
export const RoleEnum = z.enum(['TRAINEE', 'TRAINER', 'PHYSIO'])
export const RelationTypeEnum = z.enum(['TRAINER', 'PHYSIO', 'BUDDY'])
export const RelationStatusEnum = z.enum(['PENDING', 'ACTIVE', 'DECLINED'])

// --- 1. User Profile Schema ---
export const UserProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
  role: RoleEnum,
  photoURL: z.string().url().optional(),
  // Private metrics (nullable for Trainer/Physio)
  metrics: z
    .object({
      heightCm: z.number().positive().optional(),
      weightKg: z.number().positive().optional(),
      age: z.number().int().positive().optional(),
    })
    .optional(),
  // Professional Verification
  verification: z
    .object({
      licenseUrl: z.string().url().optional(),
      isVerified: z.boolean().default(false),
    })
    .optional(),
  createdAt: z.string().or(z.date()), // Firestore timestamps often return as objects/strings
})

// --- 2. Workout Schema ---
export const ExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name required'),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  weight: z.number().nonnegative(),
})

export const WorkoutSchema = z.object({
  id: z.string().optional(), // ID is often separate from doc data
  userId: z.string(),
  date: z.date().or(z.any()), // Handle Firestore Timestamp
  title: z.string().default('Workout'),
  strainScore: z.number().min(0).max(21).default(0),
  durationMinutes: z.number().positive(),
  perceivedPain: z.number().min(0).max(10).default(0),
  targetedMuscles: z.array(z.string()),
  exercises: z.array(ExerciseSchema),
  viewers: z.array(z.string()), // Crucial for security rules
  kudos: z.array(z.string()).default([]),
})

// --- 3. Daily Metrics (Recovery) Schema ---
export const DailyMetricSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD
  recoveryScore: z.number().min(0).max(100),
  sleepHours: z.number().min(0).max(24),
  restingHR: z.number().min(30).max(200),
  waterIntake: z.number().min(0).default(0),
  viewers: z.array(z.string()),
})

// --- 4. Nutrition Schema ---
export const NutritionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  date: z.date().or(z.any()), // Firestore Timestamp
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']),
  name: z.string().min(1, 'Meal name required'),
  calories: z.number().int().nonnegative(),
  macros: z.object({
    protein: z.number().nonnegative().default(0),
    carbs: z.number().nonnegative().default(0),
    fat: z.number().nonnegative().default(0),
  }),
  photoUrl: z.string().url().optional(),
  viewers: z.array(z.string()),
})

// --- 5. Relationship Schema (The "Circle") ---
export const RelationshipSchema = z.object({
  id: z.string().optional(),
  traineeId: z.string(),
  providerId: z.string(),
  type: RelationTypeEnum,
  status: RelationStatusEnum,
  permissions: z.object({
    canViewDiet: z.boolean().default(false),
    canViewMedical: z.boolean().default(false),
  }),
  createdAt: z.any(),
})

// --- 6. Clinical Note Schema ---
export const ClinicalNoteSchema = z.object({
  id: z.string().optional(),
  physioId: z.string(),
  patientId: z.string(),
  content: z.string().min(1, 'Note cannot be empty'),
  timestamp: z.any(), // ServerTimestamp
})

// --- 7. Trainer Goal Schema ---
export const GoalSchema = z.object({
  id: z.string().optional(),
  traineeId: z.string(),
  trainerId: z.string(),
  title: z.string().min(1, 'Goal title required'),
  isCompleted: z.boolean().default(false),
  createdAt: z.any(), // ServerTimestamp
})

// --- 8. Message Schema ---
export const MessageSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  senderId: z.string(),
  receiverId: z.string(),
  chatRoomId: z.string(), // deterministic: [uid1, uid2].sort().join('_')
  participants: z.array(z.string()), // [uid1, uid2] for security rules
  createdAt: z.any(),
})

// --- 9. Notification Schema ---
export const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(), // Receiver
  title: z.string(),
  body: z.string(),
  link: z.string().optional(),
  read: z.boolean().default(false),
  createdAt: z.any(),
})

// Export TypeScript Types derived from schemas
export type UserProfile = z.infer<typeof UserProfileSchema>
export type Workout = z.infer<typeof WorkoutSchema>
export type DailyMetric = z.infer<typeof DailyMetricSchema>
export type Nutrition = z.infer<typeof NutritionSchema>
export type Relationship = z.infer<typeof RelationshipSchema>
export type ClinicalNote = z.infer<typeof ClinicalNoteSchema>
export type Goal = z.infer<typeof GoalSchema>
export type Message = z.infer<typeof MessageSchema>
export type Notification = z.infer<typeof NotificationSchema>
