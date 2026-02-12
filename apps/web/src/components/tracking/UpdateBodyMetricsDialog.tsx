import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../providers/AuthProvider'
import { Button, Input, Label } from '@repo/ui'
import { X, Loader2 } from 'lucide-react'

interface UpdateBodyMetricsDialogProps {
  onClose: () => void
}

export function UpdateBodyMetricsDialog({ onClose }: UpdateBodyMetricsDialogProps) {
  const { user, userProfile } = useAuth()

  const [heightCm, setHeightCm] = useState<number>(userProfile?.metrics?.heightCm ?? 0)
  const [weightKg, setWeightKg] = useState<number>(userProfile?.metrics?.weightKg ?? 0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (userProfile?.metrics) {
      setHeightCm(userProfile.metrics.heightCm ?? 0)
      setWeightKg(userProfile.metrics.weightKg ?? 0)
    }
  }, [userProfile])

  const bmi = heightCm > 0 && weightKg > 0 ? weightKg / Math.pow(heightCm / 100, 2) : 0
  const bmiCategory =
    bmi === 0
      ? '—'
      : bmi < 18.5
        ? 'Underweight'
        : bmi < 25
          ? 'Healthy'
          : bmi < 30
            ? 'Overweight'
            : 'Obese'
  const bmiColor =
    bmi === 0
      ? 'text-zinc-500'
      : bmi < 18.5
        ? 'text-blue-400'
        : bmi < 25
          ? 'text-emerald-400'
          : bmi < 30
            ? 'text-amber-400'
            : 'text-red-400'

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'metrics.heightCm': heightCm,
        'metrics.weightKg': weightKg,
        'metrics.bmi': Math.round(bmi * 10) / 10,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Update Body Metrics</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Height (cm)</Label>
              <Input
                type="number"
                min={0}
                placeholder="175"
                value={heightCm || ''}
                onChange={e => setHeightCm(Number(e.target.value))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Weight (kg)</Label>
              <Input
                type="number"
                min={0}
                placeholder="70"
                value={weightKg || ''}
                onChange={e => setWeightKg(Number(e.target.value))}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Live BMI Preview */}
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-center space-y-1">
            <div className={`text-3xl font-bold ${bmiColor}`}>{bmi > 0 ? bmi.toFixed(1) : '—'}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">BMI</div>
            <div className={`text-sm font-semibold ${bmiColor}`}>{bmiCategory}</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:bg-lime-600 hover:text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (heightCm === 0 && weightKg === 0)}
              className="bg-lime-500 hover:bg-lime-600 text-black font-semibold"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Metrics'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
