import { useState } from 'react'
import { useUpdateNutrition } from '../../hooks/useNutrition'
import { Button, Input, Label } from '@repo/ui'
import { X, Loader2 } from 'lucide-react'
import type { Nutrition } from '@repo/shared'

interface EditNutritionModalProps {
  log: Nutrition & { id: string }
  onClose: () => void
}

export function EditNutritionModal({ log, onClose }: EditNutritionModalProps) {
  const { mutateAsync: updateNutrition, isPending } = useUpdateNutrition()

  const [name, setName] = useState(log.name)
  const [calories, setCalories] = useState(String(log.calories))
  const [protein, setProtein] = useState(String(log.macros?.protein ?? 0))
  const [carbs, setCarbs] = useState(String(log.macros?.carbs ?? 0))
  const [fat, setFat] = useState(String(log.macros?.fat ?? 0))
  const [mealType, setMealType] = useState(log.mealType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateNutrition({
      id: log.id,
      data: {
        name,
        calories: Number(calories),
        macros: {
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        },
        mealType,
      },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Edit Meal</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Meal Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Calories</Label>
              <Input
                type="number"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Meal Type</Label>
              <select
                value={mealType}
                onChange={e => setMealType(e.target.value as typeof mealType)}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Protein (g)</Label>
              <Input
                type="number"
                value={protein}
                onChange={e => setProtein(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Carbs (g)</Label>
              <Input
                type="number"
                value={carbs}
                onChange={e => setCarbs(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Fat (g)</Label>
              <Input
                type="number"
                value={fat}
                onChange={e => setFat(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:bg-lime-500"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
