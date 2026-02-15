import { describe, it, expect } from 'vitest'
import {
  UserProfileSchema,
  WorkoutSchema,
  WorkoutExerciseLogSchema,
  RelationshipSchema,
  DailyMetricSchema,
  NutritionSchema,
  RoleEnum,
  RelationTypeEnum,
  RelationStatusEnum,
  MuscleGroupEnum,
} from './flux'

// ============================================================================
// UserProfileSchema
// ============================================================================
describe('UserProfileSchema', () => {
  const validProfile = {
    displayName: 'Jane Doe',
    email: 'jane@example.com',
    role: 'TRAINEE' as const,
    createdAt: '2025-01-01',
  }

  it('parses a valid profile', () => {
    const result = UserProfileSchema.parse(validProfile)
    expect(result.displayName).toBe('Jane Doe')
    expect(result.role).toBe('TRAINEE')
  })

  it('rejects displayName shorter than 2 characters', () => {
    expect(() => UserProfileSchema.parse({ ...validProfile, displayName: 'J' })).toThrow(
      /at least 2 characters/
    )
  })

  it('rejects invalid email', () => {
    expect(() => UserProfileSchema.parse({ ...validProfile, email: 'not-an-email' })).toThrow()
  })

  it('rejects invalid role', () => {
    expect(() => UserProfileSchema.parse({ ...validProfile, role: 'ADMIN' })).toThrow()
  })

  it('accepts all valid roles', () => {
    for (const role of ['TRAINEE', 'TRAINER', 'PHYSIO', 'SUPERADMIN'] as const) {
      const result = UserProfileSchema.parse({ ...validProfile, role })
      expect(result.role).toBe(role)
    }
  })

  it('applies default values for optional fields', () => {
    const result = UserProfileSchema.parse(validProfile)
    expect(result.tags).toEqual([])
    expect(result.isPublic).toBe(true)
  })

  it('validates nested metrics', () => {
    const result = UserProfileSchema.parse({
      ...validProfile,
      metrics: { heightCm: 175, weightKg: 70, age: 25 },
    })
    expect(result.metrics?.heightCm).toBe(175)
  })

  it('rejects non-positive metric values', () => {
    expect(() =>
      UserProfileSchema.parse({
        ...validProfile,
        metrics: { heightCm: -5 },
      })
    ).toThrow()
  })

  it('validates nutritionTargets', () => {
    const result = UserProfileSchema.parse({
      ...validProfile,
      nutritionTargets: { calories: 2000, protein: 150, fat: 60, carbs: 250 },
    })
    expect(result.nutritionTargets?.calories).toBe(2000)
  })

  it('rejects negative nutritionTargets', () => {
    expect(() =>
      UserProfileSchema.parse({
        ...validProfile,
        nutritionTargets: { calories: -100, protein: 0, fat: 0, carbs: 0 },
      })
    ).toThrow()
  })
})

// ============================================================================
// WorkoutSchema
// ============================================================================
describe('WorkoutSchema', () => {
  const validWorkout = {
    userId: 'user_123',
    date: new Date(),
    strainScore: 15,
    durationMinutes: 60,
    targetedMuscles: ['Chest', 'Arms'],
    exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weight: 80 }],
    viewers: ['user_123'],
  }

  it('parses a valid workout', () => {
    const result = WorkoutSchema.parse(validWorkout)
    expect(result.strainScore).toBe(15)
    expect(result.exercises).toHaveLength(1)
  })

  it('rejects strainScore above 21', () => {
    expect(() => WorkoutSchema.parse({ ...validWorkout, strainScore: 25 })).toThrow()
  })

  it('rejects strainScore below 0', () => {
    expect(() => WorkoutSchema.parse({ ...validWorkout, strainScore: -1 })).toThrow()
  })

  it('rejects non-positive durationMinutes', () => {
    expect(() => WorkoutSchema.parse({ ...validWorkout, durationMinutes: 0 })).toThrow()
  })

  it('rejects exercise with negative weight', () => {
    expect(() =>
      WorkoutSchema.parse({
        ...validWorkout,
        exercises: [{ name: 'Deadlift', sets: 1, reps: 5, weight: -10 }],
      })
    ).toThrow()
  })

  it('requires viewers array', () => {
    const noViewers = { ...validWorkout, viewers: undefined }
    expect(() => WorkoutSchema.parse(noViewers)).toThrow()
  })

  it('defaults title to "Workout"', () => {
    const result = WorkoutSchema.parse(validWorkout)
    expect(result.title).toBe('Workout')
  })
})

// ============================================================================
// WorkoutExerciseLogSchema
// ============================================================================
describe('WorkoutExerciseLogSchema', () => {
  const validLog = {
    userId: 'user_123',
    exerciseName: 'Squat',
    muscleGroup: 'Legs' as const,
    sets: 4,
    reps: 8,
    weight: 100,
    rpe: 8,
    performedAt: new Date(),
  }

  it('parses a valid strength log', () => {
    const result = WorkoutExerciseLogSchema.parse(validLog)
    expect(result.exerciseName).toBe('Squat')
    expect(result.sets).toBe(4)
  })

  it('parses a valid cardio log', () => {
    const result = WorkoutExerciseLogSchema.parse({
      userId: 'user_123',
      exerciseName: 'Running',
      muscleGroup: 'Cardio',
      durationMins: 30,
      distanceKm: 5,
      rpe: 6,
      performedAt: new Date(),
    })
    expect(result.durationMins).toBe(30)
    expect(result.distanceKm).toBe(5)
  })

  it('rejects empty exerciseName', () => {
    expect(() => WorkoutExerciseLogSchema.parse({ ...validLog, exerciseName: '' })).toThrow()
  })

  it('rejects RPE outside 1-10', () => {
    expect(() => WorkoutExerciseLogSchema.parse({ ...validLog, rpe: 0 })).toThrow()
    expect(() => WorkoutExerciseLogSchema.parse({ ...validLog, rpe: 11 })).toThrow()
  })

  it('rejects invalid muscle group', () => {
    expect(() => WorkoutExerciseLogSchema.parse({ ...validLog, muscleGroup: 'Glutes' })).toThrow()
  })

  it('accepts all valid muscle groups', () => {
    for (const group of ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'] as const) {
      const result = WorkoutExerciseLogSchema.parse({ ...validLog, muscleGroup: group })
      expect(result.muscleGroup).toBe(group)
    }
  })
})

// ============================================================================
// RelationshipSchema
// ============================================================================
describe('RelationshipSchema', () => {
  const validRelation = {
    traineeId: 'trainee_1',
    providerId: 'trainer_1',
    type: 'TRAINER' as const,
    status: 'PENDING' as const,
    permissions: { canViewDiet: false, canViewMedical: false },
    createdAt: new Date(),
  }

  it('parses a valid relationship', () => {
    const result = RelationshipSchema.parse(validRelation)
    expect(result.traineeId).toBe('trainee_1')
    expect(result.status).toBe('PENDING')
  })

  it('accepts all relation types', () => {
    for (const type of ['TRAINER', 'PHYSIO', 'BUDDY'] as const) {
      const result = RelationshipSchema.parse({ ...validRelation, type })
      expect(result.type).toBe(type)
    }
  })

  it('accepts all statuses', () => {
    for (const status of ['PENDING', 'ACTIVE', 'DECLINED'] as const) {
      const result = RelationshipSchema.parse({ ...validRelation, status })
      expect(result.status).toBe(status)
    }
  })

  it('rejects invalid relation type', () => {
    expect(() => RelationshipSchema.parse({ ...validRelation, type: 'FRIEND' })).toThrow()
  })

  it('defaults permissions to false', () => {
    const result = RelationshipSchema.parse(validRelation)
    expect(result.permissions.canViewDiet).toBe(false)
    expect(result.permissions.canViewMedical).toBe(false)
  })
})

// ============================================================================
// DailyMetricSchema
// ============================================================================
describe('DailyMetricSchema', () => {
  const validMetric = {
    userId: 'user_123',
    date: '2025-02-15',
    recoveryScore: 75,
    sleepHours: 7.5,
    restingHR: 62,
    viewers: ['user_123'],
  }

  it('parses valid daily metrics', () => {
    const result = DailyMetricSchema.parse(validMetric)
    expect(result.recoveryScore).toBe(75)
  })

  it('rejects recoveryScore above 100', () => {
    expect(() => DailyMetricSchema.parse({ ...validMetric, recoveryScore: 101 })).toThrow()
  })

  it('rejects negative sleepHours', () => {
    expect(() => DailyMetricSchema.parse({ ...validMetric, sleepHours: -1 })).toThrow()
  })

  it('rejects restingHR below 30', () => {
    expect(() => DailyMetricSchema.parse({ ...validMetric, restingHR: 20 })).toThrow()
  })

  it('defaults waterIntake to 0', () => {
    const result = DailyMetricSchema.parse(validMetric)
    expect(result.waterIntake).toBe(0)
  })
})

// ============================================================================
// NutritionSchema
// ============================================================================
describe('NutritionSchema', () => {
  const validNutrition = {
    userId: 'user_123',
    date: new Date(),
    mealType: 'Lunch' as const,
    name: 'Chicken Salad',
    calories: 450,
    macros: { protein: 35, carbs: 20, fat: 15 },
    viewers: ['user_123'],
  }

  it('parses valid nutrition entry', () => {
    const result = NutritionSchema.parse(validNutrition)
    expect(result.name).toBe('Chicken Salad')
    expect(result.macros.protein).toBe(35)
  })

  it('rejects negative calories', () => {
    expect(() => NutritionSchema.parse({ ...validNutrition, calories: -100 })).toThrow()
  })

  it('rejects empty meal name', () => {
    expect(() => NutritionSchema.parse({ ...validNutrition, name: '' })).toThrow()
  })

  it('rejects invalid mealType', () => {
    expect(() => NutritionSchema.parse({ ...validNutrition, mealType: 'Brunch' })).toThrow()
  })

  it('rejects negative macros', () => {
    expect(() =>
      NutritionSchema.parse({
        ...validNutrition,
        macros: { protein: -5, carbs: 0, fat: 0 },
      })
    ).toThrow()
  })
})

// ============================================================================
// Enum exports
// ============================================================================
describe('Enum schemas', () => {
  it('RoleEnum accepts valid roles', () => {
    expect(RoleEnum.parse('TRAINEE')).toBe('TRAINEE')
    expect(RoleEnum.parse('SUPERADMIN')).toBe('SUPERADMIN')
  })

  it('RelationTypeEnum accepts valid types', () => {
    expect(RelationTypeEnum.parse('BUDDY')).toBe('BUDDY')
  })

  it('RelationStatusEnum accepts valid statuses', () => {
    expect(RelationStatusEnum.parse('ACTIVE')).toBe('ACTIVE')
  })

  it('MuscleGroupEnum accepts valid groups', () => {
    expect(MuscleGroupEnum.parse('Cardio')).toBe('Cardio')
    expect(MuscleGroupEnum.parse('Core')).toBe('Core')
  })
})
