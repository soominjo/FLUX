import { useState } from 'react'
import { useLogNutrition } from '../../hooks/useNutrition'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import { X, Loader2, Camera, Utensils } from 'lucide-react'

// Pass refresh logic or rely on query invalidation?
// Query invalidation in hook handles refresh.
// But the list is in the Dashboard, not here.
// Wait, user request said: "Ensure the 'Recent Meals' table fetches data using the useNutrition hook, not a hardcoded array."
// The table is in Dashboard. This component is just the Logger/Button.
// But wait, the previous code had "Recent Meals Mini List" in the Dashboard.
// So I just need to make sure this logger inputs correctly.
// AND the user said "Logic: Replace the 'Save' button logic" - done via hook.

// Re-reading request: "Ensure the 'Recent Meals' table fetches data using the useNutrition hook" -> This implies checking dashboard too.

export function NutritionLogger() {
  const [isOpen, setIsOpen] = useState(false)
  const { mutateAsync: logNutrition } = useLogNutrition()
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await logNutrition({
        mealType,
        name: name || mealType,
        calories: Number(calories),
        macros: {
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        },
        // view_file note: Schema calls this 'photoUrl'. Code can simulate logic for now.
        photoUrl: '', // Placeholder
      })

      // Reset
      setIsOpen(false)
      setName('')
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
    } catch (error) {
      console.error('Failed to log nutrition:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
      >
        <Utensils className="mr-2 h-4 w-4" /> Log Meal
      </Button>

      {/* Manual Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Log Nutrition</h2>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Meal Name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Chicken Salad"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Calories</Label>
                  <Input
                    type="number"
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meal Type</Label>
                  <select
                    value={mealType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setMealType(e.target.value as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack')
                    }
                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={protein}
                    onChange={e => setProtein(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carbs (g)</Label>
                  <Input
                    type="number"
                    value={carbs}
                    onChange={e => setCarbs(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fat (g)</Label>
                  <Input
                    type="number"
                    value={fat}
                    onChange={e => setFat(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                >
                  <Camera className="mr-2 h-4 w-4" /> Add Photo (Coming Soon)
                </Button>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-lime-400 text-zinc-900 hover:bg-lime-500 font-semibold"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Log'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
