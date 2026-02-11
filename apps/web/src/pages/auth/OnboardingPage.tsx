import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../providers/AuthProvider'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@repo/ui'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import { Loader2, Dumbbell, Stethoscope, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@repo/ui'

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
  const [trainerBio, setTrainerBio] = useState('')
  const [physioLicense, setPhysioLicense] = useState<File | null>(null)

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
        userData.metrics = {
          age: Number(traineeData.age),
          weightKg: Number(traineeData.weightKg),
          heightCm: Number(traineeData.heightCm),
        }
      } else if (selectedRole === 'TRAINER') {
        userData.bio = trainerBio
      } else if (selectedRole === 'PHYSIO') {
        // In a real app, upload file to Storage and get URL
        // For V1, just marking verification pending
        userData.verification = {
          isVerified: false,
          licenseUploaded: !!physioLicense,
        }
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
                  </>
                )}

                {/* TRAINER FORM */}
                {selectedRole === 'TRAINER' && (
                  <div className="space-y-2">
                    <Label>Bio / Specialization</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="I specialize in hypertrophy..."
                      value={trainerBio}
                      onChange={e => setTrainerBio(e.target.value)}
                    />
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
