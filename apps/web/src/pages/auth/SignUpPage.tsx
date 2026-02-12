import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../providers/AuthProvider'
import { Button } from '@repo/ui'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import { Loader2, AlertCircle } from 'lucide-react'

export default function SignUpPage() {
  const { signInWithGoogle, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      navigate('/onboarding')
    } catch (err: unknown) {
      console.error(err)
      setError('Failed to sign up with Google.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await signUpWithEmail(email, password)
      navigate('/onboarding')
    } catch (err: unknown) {
      console.error(err)
      const firebaseError = err as { code?: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Email already in use.')
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.')
      } else {
        setError('Failed to sign up. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tighter text-white">
              Create Account
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Join FLUX and start your journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500 focus-visible:ring-lime-400"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500 focus-visible:ring-lime-400"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Sign Up with Email'
                )}
              </Button>
            </form>

            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white"
              onClick={handleGoogleSignUp}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
              )}
              Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-sm text-zinc-400">
            <div>
              Already have an account?{' '}
              <Link to="/login" className="text-lime-400 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
