import { useState, useMemo } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useNutritionRange, useDeleteNutrition } from '../../hooks/useNutrition'
import { useFluxSync } from '../../hooks/useFluxSync'
import { useMetricsRange, getTodayDateString } from '../../hooks/useDailyMetrics'
import { useWorkoutsRange } from '../../hooks/useWorkouts'
import { computeFluxState, calculateCaloriesBurned } from '../../lib/energyUtils'
import { NutritionLogger } from '../../components/tracking/NutritionLogger'
import { EditNutritionModal } from '../../components/tracking/EditNutritionModal'
import { WaterTracker } from '../../components/tracking/WaterTracker'
import { FluxBar } from '../../components/dashboard/FluxBar'
import { DateFilter, type FilterView } from '../../components/dashboard/DateFilter'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import {
  Utensils,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Pencil,
  Trash2,
  Loader2,
  GlassWater,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { Nutrition, Workout } from '@repo/shared'

const MACRO_COLORS = {
  Protein: '#84cc16',
  Carbs: '#f59e0b',
  Fat: '#ef4444',
}

function NutritionLogRow({
  log,
  readOnly = false,
}: {
  log: Nutrition & { id: string }
  readOnly?: boolean
}) {
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
          {!readOnly && (
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
          )}
        </div>
      </div>

      {editOpen && <EditNutritionModal log={log} onClose={() => setEditOpen(false)} />}
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')
const formatDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function getDateRange(date: Date, viewType: FilterView) {
  let start: Date, end: Date
  switch (viewType) {
    case 'day':
      start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
      break
    case 'month':
      start = new Date(date.getFullYear(), date.getMonth(), 1)
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
      break
    case 'year':
      start = new Date(date.getFullYear(), 0, 1)
      end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
      break
  }
  const startStr = formatDateStr(start)
  const endStr = formatDateStr(end)
  // Force 1 for day view; for month/year count calendar days between start and end
  const dayCount =
    viewType === 'day'
      ? 1
      : Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
  return { startStr, endStr, startDate: start, endDate: end, dayCount }
}

function computeTotalBurn(workouts: Workout[], weightKg: number): number {
  return workouts.reduce((sum, w) => {
    const wAny = w as Record<string, unknown>
    const activityType =
      (wAny.exerciseName as string) ||
      (wAny.title as string) ||
      (wAny.muscleGroup as string) ||
      'workout'
    const duration = (wAny.durationMinutes as number) ?? (wAny.durationMins as number) ?? 30
    const distanceKm = (wAny.distanceKm as number) || undefined
    return sum + calculateCaloriesBurned(activityType, duration, weightKg, distanceKm)
  }, 0)
}

function getPeriodLabel(viewType: FilterView): string | undefined {
  switch (viewType) {
    case 'month':
      return 'Monthly Total'
    case 'year':
      return 'Yearly Total'
    default:
      return undefined
  }
}

// ── Component ────────────────────────────────────────────────────────────

interface NutritionPageProps {
  viewAsId?: string
}

export default function NutritionPage({ viewAsId }: NutritionPageProps = {}) {
  const { user, userProfile } = useAuth()
  const today = getTodayDateString()
  const isAdminView = !!viewAsId

  const [filterType, setFilterType] = useState<FilterView>('day')
  const [filterDate, setFilterDate] = useState(new Date())

  const { startStr, endStr, startDate, endDate, dayCount } = useMemo(
    () => getDateRange(filterDate, filterType),
    [filterDate, filterType]
  )

  const isToday = filterType === 'day' && startStr === today

  const { data: nutritionLogs, isLoading } = useNutritionRange(startStr, endStr, viewAsId)
  const { data: metricsRange } = useMetricsRange(startStr, endStr, viewAsId)
  const { data: workoutsRange } = useWorkoutsRange(startDate, endDate, viewAsId)
  const { flux: liveFlux } = useFluxSync()

  const macroTargets = (userProfile as Record<string, unknown>)?.nutritionTargets as
    | { calories: number; protein: number; carbs: number; fat: number }
    | undefined

  const dailyCalorieTarget = liveFlux?.dailyTarget ?? macroTargets?.calories ?? 2500

  const totalCalories = nutritionLogs?.reduce((acc, log) => acc + log.calories, 0) ?? 0
  const totalProtein = nutritionLogs?.reduce((acc, log) => acc + (log.macros?.protein ?? 0), 0) ?? 0
  const totalCarbs = nutritionLogs?.reduce((acc, log) => acc + (log.macros?.carbs ?? 0), 0) ?? 0
  const totalFat = nutritionLogs?.reduce((acc, log) => acc + (log.macros?.fat ?? 0), 0) ?? 0

  const totalWater =
    metricsRange?.reduce(
      (acc, m) => acc + (((m as Record<string, unknown>).waterIntake as number) ?? 0),
      0
    ) ?? 0

  const weightKg = userProfile?.metrics?.weightKg || 75
  const totalBurn = workoutsRange ? computeTotalBurn(workoutsRange, weightKg) : 0

  const periodCalorieTarget = dailyCalorieTarget * dayCount
  const periodProteinTarget = macroTargets ? macroTargets.protein * dayCount : undefined
  const periodCarbsTarget = macroTargets ? macroTargets.carbs * dayCount : undefined
  const periodFatTarget = macroTargets ? macroTargets.fat * dayCount : undefined

  const periodFlux = useMemo(
    () => computeFluxState(periodCalorieTarget, totalCalories, totalBurn),
    [periodCalorieTarget, totalCalories, totalBurn]
  )

  const periodLabel = getPeriodLabel(filterType)
  const periodSuffix = filterType === 'day' ? '' : filterType === 'month' ? ' (Month)' : ' (Year)'

  const macroData = [
    { name: 'Protein', value: totalProtein },
    { name: 'Carbs', value: totalCarbs },
    { name: 'Fat', value: totalFat },
  ].filter(d => d.value > 0)

  return (
    <div className="min-h-screen bg-zinc-950">
      <header>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nutrition</h1>
            <p className="text-zinc-400 mt-1">
              {isAdminView
                ? 'Viewing nutrition data — read only.'
                : `Track your meals, macros, and hydration for ${user?.displayName?.split(' ')[0] || 'today'}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateFilter
              viewType={filterType}
              date={filterDate}
              onViewChange={setFilterType}
              onDateChange={setFilterDate}
            />
            <div className="shrink-0">
              {!isAdminView && filterType === 'day' && <NutritionLogger targetDate={filterDate} />}
            </div>
          </div>
        </div>
      </header>

      <div className="mb-8">
        <FluxBar overrideFlux={periodFlux} periodLabel={periodLabel} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Calories{periodSuffix}
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalCalories}</div>
            <p className="text-xs text-zinc-500 mt-1">/ {periodCalorieTarget} kcal</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Protein{periodSuffix}
            </CardTitle>
            <Beef className="h-4 w-4 text-lime-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalProtein}
              <span className="text-sm font-normal text-zinc-500">g</span>
            </div>
            {periodProteinTarget !== undefined && (
              <p className="text-xs text-zinc-500 mt-1">/ {periodProteinTarget}g</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Carbs{periodSuffix}</CardTitle>
            <Wheat className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalCarbs}
              <span className="text-sm font-normal text-zinc-500">g</span>
            </div>
            {periodCarbsTarget !== undefined && (
              <p className="text-xs text-zinc-500 mt-1">/ {periodCarbsTarget}g</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Fat{periodSuffix}</CardTitle>
            <Droplets className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalFat}
              <span className="text-sm font-normal text-zinc-500">g</span>
            </div>
            {periodFatTarget !== undefined && (
              <p className="text-xs text-zinc-500 mt-1">/ {periodFatTarget}g</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Utensils className="h-5 w-5 text-lime-400" />
                Macro Split{periodSuffix}
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
                  {filterType === 'day'
                    ? 'Log a meal to see your macro breakdown.'
                    : 'No nutrition data for this period.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {filterType === 'day' ? (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white text-base">Hydration</CardTitle>
              </CardHeader>
              <CardContent>
                <WaterTracker date={filterDate} readOnly={isAdminView} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <GlassWater className="h-4 w-4 text-blue-400" />
                  Hydration{periodSuffix}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-blue-400">{totalWater}</div>
                  <div className="text-sm text-zinc-500 mt-1">total glasses ({dayCount} days)</div>
                  {dayCount > 0 && (
                    <div className="text-xs text-zinc-600 mt-1">
                      ~{Math.round((totalWater / dayCount) * 10) / 10} avg/day
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white text-base">
                {filterType === 'day'
                  ? isToday
                    ? "Today's Logs"
                    : 'Logs'
                  : `${filterType === 'month' ? 'Monthly' : 'Yearly'} Summary`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filterType === 'day' ? (
                isLoading ? (
                  <div className="text-zinc-500 text-sm">Loading...</div>
                ) : nutritionLogs && nutritionLogs.length > 0 ? (
                  <div className="space-y-2">
                    {nutritionLogs.map(log => (
                      <NutritionLogRow
                        key={log.id}
                        log={log as Nutrition & { id: string }}
                        readOnly={isAdminView || !isToday}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    No meals logged{isToday ? ' today' : ' for this day'}.
                  </div>
                )
              ) : isLoading ? (
                <div className="text-zinc-500 text-sm">Loading...</div>
              ) : nutritionLogs && nutritionLogs.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
                      <div className="text-2xl font-bold text-white">{nutritionLogs.length}</div>
                      <div className="text-xs text-zinc-500">Total Meals</div>
                    </div>
                    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
                      <div className="text-2xl font-bold text-white">
                        {dayCount > 0 ? Math.round(totalCalories / dayCount) : 0}
                      </div>
                      <div className="text-xs text-zinc-500">Avg Cal/Day</div>
                    </div>
                    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
                      <div className="text-2xl font-bold text-white">
                        {dayCount > 0 ? Math.round(totalProtein / dayCount) : 0}g
                      </div>
                      <div className="text-xs text-zinc-500">Avg Protein/Day</div>
                    </div>
                    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3">
                      <div className="text-2xl font-bold text-white">
                        {dayCount > 0 ? Math.round((nutritionLogs.length / dayCount) * 10) / 10 : 0}
                      </div>
                      <div className="text-xs text-zinc-500">Avg Meals/Day</div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 text-center">
                    Switch to Day view to see individual meal entries.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-500 text-sm">
                  No nutrition data for this period.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
