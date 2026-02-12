import { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useNutrition, useDeleteNutrition } from '../../hooks/useNutrition'
import { useFluxSync } from '../../hooks/useFluxSync'
import { getTodayDateString } from '../../hooks/useDailyMetrics'
import { NutritionLogger } from '../../components/tracking/NutritionLogger'
import { EditNutritionModal } from '../../components/tracking/EditNutritionModal'
import { WaterTracker } from '../../components/tracking/WaterTracker'
import { FluxBar } from '../../components/dashboard/FluxBar'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Utensils, Flame, Beef, Wheat, Droplets, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { Nutrition } from '@repo/shared'

const MACRO_COLORS = {
  Protein: '#84cc16', // lime-400
  Carbs: '#f59e0b', // amber-500
  Fat: '#ef4444', // red-500
}

function NutritionLogRow({ log }: { log: Nutrition & { id: string } }) {
  const { mutateAsync: deleteNutrition, isPending: isDeleting } = useDeleteNutrition()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <div className="flex justify-between items-center text-sm p-3 bg-zinc-950 rounded-lg border border-zinc-800 group">
        <div className="min-w-0">
          <div className="text-zinc-300 font-medium">{log.name}</div>
          <div className="text-xs text-zinc-500">{log.mealType}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-white font-semibold">{log.calories} kcal</div>
            {log.macros && (
              <div className="text-xs text-zinc-500">
                P:{log.macros.protein}g C:{log.macros.carbs}g F:{log.macros.fat}g
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1 rounded text-zinc-500 hover:text-lime-400 hover:bg-zinc-800 transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
            {confirmDelete ? (
              <button
                onClick={async () => {
                  await deleteNutrition(log.id)
                  setConfirmDelete(false)
                }}
                disabled={isDeleting}
                className="px-1.5 py-0.5 rounded text-xs text-red-400 hover:text-red-300 hover:bg-zinc-800"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {editOpen && <EditNutritionModal log={log} onClose={() => setEditOpen(false)} />}
    </>
  )
}

export default function NutritionPage() {
  const { user, userProfile } = useAuth()
  const today = getTodayDateString()
  const { data: nutritionLogs, isLoading } = useNutrition(today)
  const { flux } = useFluxSync()

  const macroTargets = (userProfile as Record<string, unknown>)?.nutritionTargets as
    | { calories: number; protein: number; carbs: number; fat: number }
    | undefined

  const totalCalories = nutritionLogs
    ? nutritionLogs.reduce((acc, log) => acc + log.calories, 0)
    : 0
  const totalProtein = nutritionLogs
    ? nutritionLogs.reduce((acc, log) => acc + (log.macros?.protein ?? 0), 0)
    : 0
  const totalCarbs = nutritionLogs
    ? nutritionLogs.reduce((acc, log) => acc + (log.macros?.carbs ?? 0), 0)
    : 0
  const totalFat = nutritionLogs
    ? nutritionLogs.reduce((acc, log) => acc + (log.macros?.fat ?? 0), 0)
    : 0

  const calorieTarget = flux?.dailyTarget ?? macroTargets?.calories ?? 2500

  const macroData = [
    { name: 'Protein', value: totalProtein },
    { name: 'Carbs', value: totalCarbs },
    { name: 'Fat', value: totalFat },
  ].filter(d => d.value > 0)

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nutrition</h1>
        <p className="text-zinc-400 mt-1">
          Track your meals, macros, and hydration for {user?.displayName?.split(' ')[0] || 'today'}.
        </p>
      </header>

      {/* Energy Flux — dynamic Input↔Output balance */}
      <div className="mb-8">
        <FluxBar />
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Calories</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalCalories}</div>
            <p className="text-xs text-zinc-500 mt-1">/ {calorieTarget} kcal</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Protein</CardTitle>
            <Beef className="h-4 w-4 text-lime-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalProtein}
              <span className="text-sm font-normal text-zinc-500">g</span>
            </div>
            {macroTargets && (
              <p className="text-xs text-zinc-500 mt-1">/ {macroTargets.protein}g</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Carbs</CardTitle>
            <Wheat className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalCarbs}
              <span className="text-sm font-normal text-zinc-500">g</span>
            </div>
            {macroTargets && <p className="text-xs text-zinc-500 mt-1">/ {macroTargets.carbs}g</p>}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Fat</CardTitle>
            <Droplets className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalFat}
              <span className="text-sm font-normal text-zinc-500">g</span>
            </div>
            {macroTargets && <p className="text-xs text-zinc-500 mt-1">/ {macroTargets.fat}g</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Macro Split Chart */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Utensils className="h-5 w-5 text-lime-400" />
                Macro Split
              </CardTitle>
            </CardHeader>
            <CardContent>
              {macroData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {macroData.map(entry => (
                          <Cell
                            key={entry.name}
                            fill={MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value, name) => [`${value}g`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-3">
                    {macroData.map(entry => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS],
                          }}
                        />
                        <span className="text-sm text-zinc-400">{entry.name}</span>
                        <span className="text-sm font-semibold text-white">{entry.value}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  Log a meal to see your macro breakdown.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Logger */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Log a Meal</CardTitle>
            </CardHeader>
            <CardContent>
              <NutritionLogger />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Water Tracker */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white text-base">Hydration</CardTitle>
            </CardHeader>
            <CardContent>
              <WaterTracker />
            </CardContent>
          </Card>

          {/* Recent Logs — with Edit/Delete */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white text-base">Today's Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-zinc-500 text-sm">Loading...</div>
              ) : nutritionLogs && nutritionLogs.length > 0 ? (
                <div className="space-y-2">
                  {nutritionLogs.map(log => (
                    <NutritionLogRow key={log.id} log={log as Nutrition & { id: string }} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-500 text-sm">No meals logged today.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
