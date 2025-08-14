import React from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartTypeToggleProps {
  chartType: 'line' | 'candlestick'
  onToggle: (type: 'line' | 'candlestick') => void
  disabled?: boolean
}

export function ChartTypeToggle({ chartType, onToggle, disabled = false }: ChartTypeToggleProps) {
  return (
    <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-lg">
      <button
        onClick={() => onToggle('line')}
        disabled={disabled}
        className={cn(
          "flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
          "hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          chartType === 'line'
            ? "bg-background text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <TrendingUp className="h-4 w-4" />
        <span>Line</span>
      </button>
      
      <button
        onClick={() => onToggle('candlestick')}
        disabled={disabled}
        className={cn(
          "flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
          "hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          chartType === 'candlestick'
            ? "bg-background text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BarChart3 className="h-4 w-4" />
        <span>Candles</span>
      </button>
    </div>
  )
}