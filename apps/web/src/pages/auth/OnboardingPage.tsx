import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../providers/AuthProvider'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { calculateBMI, getBMICategory } from '../../lib/flux-logic'
import { calculateMacros } from '../../lib/energyUtils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@repo/ui'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import { cn } from '@repo/ui'
import { Loader2, Dumbbell, Stethoscope, Users, ChevronLeft, ChevronRight, X } from 'lucide-react'

const roles = [
  {
    id: 'TRAINEE',
    title: 'Trainee',
    description: 'I want to track my workouts and nutrition.',
    icon: Dumbbell,
    color: 'text-blue-400',
    borderColor: 'hover:border-blue-400',
    ringColor: 'hover:ring-blue-400',
  },
  {
    id: 'TRAINER',
    title: 'Trainer',
    description: 'I want to manage clients and plans.',
    icon: Users,
    color: 'text-lime-400',
    borderColor: 'hover:border-lime-400',
    ringColor: 'hover:ring-lime-400',
  },
  {
    id: 'PHYSIO',
    title: 'Physiotherapist',
    description: 'I want to monitor patient recovery.',
    icon: Stethoscope,
    color: 'text-red-400',
    borderColor: 'hover:border-red-400',
    ringColor: 'hover:ring-red-400',
  },
]

export default function OnboardingPage() {
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Form States
  const [traineeData, setTraineeData] = useState({
    age: '',
    weightKg: '',
    heightCm: '',
  })
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [activityLevel, setActivityLevel] = useState<
    'sedentary' | 'light' | 'moderate' | 'active' | 'athlete' | ''
  >('')
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain' | ''>('')
  const [trainerBio, setTrainerBio] = useState('')
  const [trainerExperience, setTrainerExperience] = useState('')
  const [certifications, setCertifications] = useState<string[]>([])
  const [certInput, setCertInput] = useState('')
  const [physioLicense, setPhysioLicense] = useState<File | null>(null)

  // BMI auto-calculation
  const bmiResult = useMemo(() => {
    const w = Number(traineeData.weightKg)
    const h = Number(traineeData.heightCm)
    if (w > 0 && h > 0) {
      const bmi = calculateBMI(w, h)
      return { bmi, ...getBMICategory(bmi) }
    }
    return null
  }, [traineeData.weightKg, traineeData.heightCm])

  const handleAddCertification = () => {
    const trimmed = certInput.trim()
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications([...certifications, trimmed])
      setCertInput('')
    }
  }

  const handleRemoveCertification = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert))
  }

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    setStep(2)
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setSelectedRole(null)
    }
  }

  const handleSave = async () => {
    if (!user || !selectedRole) return
    setLoading(true)

    try {
      const userData: Record<string, unknown> = {
        displayName: user.displayName || 'New User',
        email: user.email,
        photoURL: user.photoURL,
        role: selectedRole,
        createdAt: serverTimestamp(),
      }

      // Add role-specific data
      if (selectedRole === 'TRAINEE') {
        const age = Number(traineeData.age)
        const weightKg = Number(traineeData.weightKg)
        const heightCm = Number(traineeData.heightCm)

        userData.metrics = {
          age,
          weightKg,
          heightCm,
          bmi: bmiResult?.bmi || undefined,
        }

        if (gender) userData.gender = gender
        if (activityLevel) userData.activityLevel = activityLevel
        if (goal) userData.goal = goal

        // Auto-calculate initial nutrition targets using Mifflin-St Jeor + protein priority
        if (gender && age > 0 && weightKg > 0 && heightCm > 0) {
          userData.nutritionTargets = calculateMacros(
            weightKg,
            heightCm,
            age,
            gender,
            activityLevel || 'moderate',
            goal || 'maintain'
          )
        }
      } else if (selectedRole === 'TRAINER') {
        userData.bio = trainerBio
        userData.experience = trainerExperience
        userData.certifications = certifications
      } else if (selectedRole === 'PHYSIO') {
        // In a real app, upload file to Storage and get URL
        // For V1, just marking verification pending
        userData.verification = {
          isVerified: false,
          licenseUploaded: !!physioLicense,
        }
        userData.verificationStatus = 'PENDING'
      }

      await setDoc(doc(db, 'users', user.uid), userData, { merge: true })

      // Force reload to refresh auth context role
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error saving profile:', error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 p-4">
      <div className="mb-8 text-center bg-zinc-900 p-4 rounded-lg">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to FLUX</h1>
        <p className="text-zinc-400">Let's set up your profile.</p>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-4 space-x-2">
          <div
            className={cn(
              'h-2 w-16 rounded-full transition-colors',
              step >= 1 ? 'bg-lime-400' : 'bg-zinc-800'
            )}
          />
          <div
            className={cn(
              'h-2 w-16 rounded-full transition-colors',
              step >= 2 ? 'bg-lime-400' : 'bg-zinc-800'
            )}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid w-full max-w-5xl gap-6 md:grid-cols-3"
          >
            {roles.map(role => {
              const Icon = role.icon
              return (
                <motion.div key={role.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card
                    className={cn(
                      'cursor-pointer border-zinc-800 bg-zinc-950 transition-all duration-300 hover:shadow-2xl hover:ring-2 hover:ring-offset-2 hover:ring-offset-zinc-900 font-semibold h-full',
                      role.borderColor,
                      role.ringColor
                    )}
                    onClick={() => handleRoleSelect(role.id)}
                  >
                    <CardHeader className="text-center">
                      <div
                        className={cn(
                          'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900',
                          role.color
                        )}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-white text-xl">{role.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-zinc-400">
                      <p>{role.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md"
          >
            <Card className="border-zinc-800 bg-zinc-950 text-white">
              <CardHeader>
                <CardTitle>
                  {selectedRole === 'TRAINEE' && 'Your Stats'}
                  {selectedRole === 'TRAINER' && 'Trainer Profile'}
                  {selectedRole === 'PHYSIO' && 'Professional Verification'}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {selectedRole === 'TRAINEE' && 'Help us customize your Flux scores.'}
                  {selectedRole === 'TRAINER' && 'Tell clients about yourself.'}
                  {selectedRole === 'PHYSIO' && 'Upload your license for verification.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* TRAINEE FORM */}
                {selectedRole === 'TRAINEE' && (
                  <>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={traineeData.age}
                        onChange={e => setTraineeData({ ...traineeData, age: e.target.value })}
                        className="bg-zinc-900 border-zinc-800 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          value={traineeData.weightKg}
                          onChange={e =>
                            setTraineeData({ ...traineeData, weightKg: e.target.value })
                          }
                          className="bg-zinc-900 border-zinc-800 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          value={traineeData.heightCm}
                          onChange={e =>
                            setTraineeData({ ...traineeData, heightCm: e.target.value })
                          }
                          className="bg-zinc-900 border-zinc-800 text-white"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['male', 'female'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={cn(
                              'rounded-lg border px-4 py-2 text-sm font-medium transition-all capitalize',
                              gender === g
                                ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Activity Level */}
                    <div className="space-y-2">
                      <Label>Activity Level</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {(
                          [
                            {
                              value: 'sedentary',
                              label: 'Sedentary',
                              desc: 'Desk job, little exercise',
                            },
                            { value: 'light', label: 'Light', desc: '1-2 workouts / week' },
                            { value: 'moderate', label: 'Moderate', desc: '3-4 workouts / week' },
                            { value: 'active', label: 'Active', desc: '5-6 workouts / week' },
                            { value: 'athlete', label: 'Athlete', desc: 'Daily intense training' },
                          ] as const
                        ).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setActivityLevel(opt.value)}
                            className={cn(
                              'flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-all',
                              activityLevel === opt.value
                                ? 'border-lime-400 bg-lime-400/10 text-white'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                            )}
                          >
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-xs text-zinc-500">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Goal */}
                    <div className="space-y-2">
                      <Label>Goal</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {(
                          [
                            { value: 'lose', label: 'Lose Fat' },
                            { value: 'maintain', label: 'Maintain' },
                            { value: 'gain', label: 'Build Muscle' },
                          ] as const
                        ).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setGoal(opt.value)}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                              goal === opt.value
                                ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* BMI Auto-Calculation Display */}
                    {bmiResult && (
                      <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Estimated BMI</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">{bmiResult.bmi}</span>
                            <span className={cn('text-sm font-semibold', bmiResult.color)}>
                              {bmiResult.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-600 italic">
                          Note: BMI is a screening tool, not a diagnostic measure. It does not
                          account for muscle mass.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* TRAINER FORM */}
                {selectedRole === 'TRAINER' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bio / Specialization</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="I specialize in hypertrophy..."
                        value={trainerBio}
                        onChange={e => setTrainerBio(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Experience / Background</Label>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="5 years of personal training, former athlete..."
                        value={trainerExperience}
                        onChange={e => setTrainerExperience(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Certifications</Label>
                      <div className="flex gap-2">
                        <Input
                          value={certInput}
                          onChange={e => setCertInput(e.target.value)}
                          onKeyDown={e =>
                            e.key === 'Enter' && (e.preventDefault(), handleAddCertification())
                          }
                          placeholder="e.g. NASM-CPT, ACE, CSCS"
                          className="bg-zinc-900 border-zinc-800 text-white flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleAddCertification}
                          variant="outline"
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          Add
                        </Button>
                      </div>
                      {certifications.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {certifications.map(cert => (
                            <span
                              key={cert}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-lime-400/10 text-lime-400 text-xs font-medium"
                            >
                              {cert}
                              <button
                                type="button"
                                onClick={() => handleRemoveCertification(cert)}
                                className="hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PHYSIO FORM */}
                {selectedRole === 'PHYSIO' && (
                  <div className="space-y-2">
                    <Label>Upload License (PDF/Image)</Label>
                    <Input
                      type="file"
                      onChange={e => setPhysioLicense(e.target.files?.[0] || null)}
                      className="bg-zinc-900 border-zinc-800 text-white file:text-lime-400"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-zinc-400 hover:text-white"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Setup'}
                  {!loading && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
