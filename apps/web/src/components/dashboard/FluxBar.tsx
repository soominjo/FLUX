import { useFluxSync } from '../../hooks/useFluxSync'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { ArrowDownUp } from 'lucide-react'
import type { FluxState } from '../../lib/energyUtils'

const ZONE_STYLES = {
  deficit: {
    bar: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    label: 'Deficit',
  },
  balanced: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    label: 'Balanced',
  },
  surplus: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    label: 'Surplus',
  },
} as const

interface FluxBarProps {
  overrideFlux?: FluxState
  periodLabel?: string
}

export function FluxBar({ overrideFlux, periodLabel }: FluxBarProps = {}) {
  const { flux: syncFlux, isLoading, missingMetrics } = useFluxSync()
  const flux = overrideFlux || syncFlux

  if (!overrideFlux) {
    if (isLoading) {
      return (
        <Card className="border-zinc-800 bg-zinc-900/50 animate-pulse">
          <CardContent className="py-6">
            <div className="h-4 bg-zinc-800 rounded w-3/4 mx-auto" />
          </CardContent>
        </Card>
      )
    }

    if (missingMetrics || !flux) {
      return (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-lime-400" />
              Energy Flux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">
              Set your height, weight, and age in{' '}
              <span className="text-zinc-300">Body Composition</span> to activate Flux tracking.
            </p>
          </CardContent>
        </Card>
      )
    }
  }

  if (!flux) return null

  const style = ZONE_STYLES[flux.zone]

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4 text-lime-400" />
            Energy Flux
            {periodLabel && (
              <span className="text-xs text-zinc-500 font-normal">({periodLabel})</span>
            )}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${style.badge}`}>
            {style.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-white">{flux.caloriesIn}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Eaten</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{flux.caloriesOut}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Burned</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">{flux.dailyTarget}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Target</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${style.bar}`}
              style={{ width: `${Math.min(flux.balancePercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>0%</span>
            <span>{flux.balancePercent}% of adjusted target</span>
            <span>100%</span>
          </div>
        </div>

        {/* Recommendation */}
        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 border border-zinc-800 rounded-lg p-3">
          {flux.recommendation}
        </p>
      </CardContent>
    </Card>
  )
}
