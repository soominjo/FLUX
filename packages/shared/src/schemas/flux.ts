import { z } from 'zod'

// --- Enums ---
export const RoleEnum = z.enum(['TRAINEE', 'TRAINER', 'PHYSIO', 'SUPERADMIN'])
export const VerificationStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED'])
export const RelationTypeEnum = z.enum(['TRAINER', 'PHYSIO', 'BUDDY'])
export const RelationStatusEnum = z.enum(['PENDING', 'ACTIVE', 'DECLINED'])
export const MuscleGroupEnum = z.enum([
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
])

// --- 1. User Profile Schema ---
export const UserProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
  role: RoleEnum,
  photoURL: z.string().url().optional(),
  // Gym Profile Fields (New)
  bio: z.string().max(150, 'Bio must be 150 characters or less').optional(),
  location: z.string().optional(),
  socials: z
    .object({
      instagram: z.string().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
  tags: z.array(z.string()).default([]), // e.g., ["Weight Loss", "Powerlifting", "Rehab"]
  isPublic: z.boolean().default(true),
  // Flux calculation fields
  gender: z.enum(['male', 'female']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'athlete']).optional(),
  goal: z.enum(['lose', 'maintain', 'gain']).optional(),
  nutritionTargets: z
    .object({
      calories: z.number().nonnegative(),
      protein: z.number().nonnegative(),
      fat: z.number().nonnegative(),
      carbs: z.number().nonnegative(),
    })
    .optional(),
  // Private metrics (nullable for Trainer/Physio)
  metrics: z
    .object({
      heightCm: z.number().positive().optional(),
      weightKg: z.number().positive().optional(),
      age: z.number().int().positive().optional(),
      bmi: z.number().optional(),
    })
    .optional(),
  // Professional Verification
  verification: z
    .object({
      licenseUrl: z.string().url().optional(),
      isVerified: z.boolean().default(false),
    })
    .optional(),
  // Physio verification status (admin-managed)
  verificationStatus: VerificationStatusEnum.default('PENDING').optional(),
  // Trainer credentials
  experience: z.string().optional(),
  certifications: z.array(z.string()).optional(),
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

// --- 2b. Workout Exercise Log Schema (Single-Exercise CRUD) ---
export const WorkoutExerciseLogSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  exerciseName: z.string().min(1, 'Exercise name is required'),
  muscleGroup: MuscleGroupEnum,

  // Strength fields (optional — only present for lifting)
  sets: z.coerce.number().int().min(1, 'At least 1 set').optional(),
  reps: z.coerce.number().int().min(1, 'At least 1 rep').optional(),
  weight: z.coerce.number().nonnegative('Weight cannot be negative').optional(),

  // Endurance fields (optional — only present for Legs/Cardio)
  durationMins: z.coerce.number().positive('Duration must be positive').optional(),
  distanceKm: z.coerce.number().nonnegative('Distance cannot be negative').optional(),

  rpe: z.coerce.number().int().min(1).max(10),
  performedAt: z.any(), // Firestore serverTimestamp()
  note: z.string().optional(),
  viewers: z.array(z.string()).default([]), // Crucial for cross-role visibility
})

// Form-level input schema (no userId/id/performedAt/viewers — injected on submit)
export const WorkoutExerciseLogInputSchema = WorkoutExerciseLogSchema.omit({
  id: true,
  userId: true,
  performedAt: true,
  viewers: true,
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
export const NotificationTypeEnum = z.enum([
  'NEW_MESSAGE',
  'CONNECTION_REQUEST',
  'NEW_PLAN',
  'KUDOS',
  'GENERAL',
])

export const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(), // Receiver
  senderId: z.string().optional(), // Who triggered it (for profile nav)
  type: NotificationTypeEnum.default('GENERAL'),
  title: z.string(),
  body: z.string(),
  link: z.string().optional(), // Legacy fallback
  read: z.boolean().default(false),
  createdAt: z.any(),
})

// Export TypeScript Types derived from schemas
export type UserProfile = z.infer<typeof UserProfileSchema>
export type Workout = z.infer<typeof WorkoutSchema>
export type WorkoutExerciseLog = z.infer<typeof WorkoutExerciseLogSchema>
export type WorkoutExerciseLogInput = z.infer<typeof WorkoutExerciseLogInputSchema>
export type MuscleGroup = z.infer<typeof MuscleGroupEnum>
export type DailyMetric = z.infer<typeof DailyMetricSchema>
export type Nutrition = z.infer<typeof NutritionSchema>
export type Relationship = z.infer<typeof RelationshipSchema>
export type ClinicalNote = z.infer<typeof ClinicalNoteSchema>
export type Goal = z.infer<typeof GoalSchema>
export type Message = z.infer<typeof MessageSchema>
export type Notification = z.infer<typeof NotificationSchema>
export type VerificationStatus = z.infer<typeof VerificationStatusEnum>
