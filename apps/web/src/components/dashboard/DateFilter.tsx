import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@repo/ui'

export type FilterView = 'day' | 'month' | 'year'

interface DateFilterProps {
  viewType: FilterView
  date: Date
  onViewChange: (view: FilterView) => void
  onDateChange: (date: Date) => void
}

const VIEW_OPTIONS: { key: FilterView; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

function formatDisplayText(date: Date, viewType: FilterView): string {
  switch (viewType) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    case 'year':
      return date.getFullYear().toString()
  }
}

function navigateDate(date: Date, viewType: FilterView, direction: -1 | 1): Date {
  const d = new Date(date)
  switch (viewType) {
    case 'day':
      d.setDate(d.getDate() + direction)
      break
    case 'month':
      d.setMonth(d.getMonth() + direction)
      break
    case 'year':
      d.setFullYear(d.getFullYear() + direction)
      break
  }
  return d
}

export function DateFilter({ viewType, date, onViewChange, onDateChange }: DateFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Segmented Control */}
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5">
        {VIEW_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => onViewChange(opt.key)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewType === opt.key ? 'bg-lime-500 text-black' : 'text-zinc-400 hover:text-white'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDateChange(navigateDate(date, viewType, -1))}
          className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-white min-w-[160px] text-center">
          {formatDisplayText(date, viewType)}
        </span>
        <button
          onClick={() => onDateChange(navigateDate(date, viewType, 1))}
          className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
