import React from 'react'
import { cn } from '@/lib/utils'

interface TimeframeControlsProps {
  selected: string
  onSelect: (timeframe: string) => void
  disabled?: boolean
}

const timeframes = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'MAX', value: 'MAX' }
]

export function TimeframeControls({ selected, onSelect, disabled = false }: TimeframeControlsProps) {
  return (
    <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-lg">
      {timeframes.map((timeframe) => (
        <button
          key={timeframe.value}
          onClick={() => onSelect(timeframe.value)}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            "hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            selected === timeframe.value
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {timeframe.label}
        </button>
      ))}
    </div>
  )
}