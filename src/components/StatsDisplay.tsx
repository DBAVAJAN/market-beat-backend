import React from 'react'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

interface StockStats {
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  averageVolume: number
  asOf: string
}

interface StatsDisplayProps {
  stats: StockStats | null
  loading?: boolean
  symbol?: string
}

export function StatsDisplay({ stats, loading = false, symbol }: StatsDisplayProps) {
  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-sm text-muted-foreground">
        No stats available
      </div>
    )
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e7) return `${(volume / 1e7).toFixed(1)}Cr`
    if (volume >= 1e5) return `${(volume / 1e5).toFixed(1)}L`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
    return volume.toString()
  }

  return (
    <div className="flex items-center space-x-3">
      <Badge variant="outline" className="flex items-center space-x-1">
        <TrendingUp className="h-3 w-3 text-emerald-500" />
        <span className="text-xs">52W High: ₹{stats.fiftyTwoWeekHigh}</span>
      </Badge>
      
      <Badge variant="outline" className="flex items-center space-x-1">
        <TrendingDown className="h-3 w-3 text-red-500" />
        <span className="text-xs">52W Low: ₹{stats.fiftyTwoWeekLow}</span>
      </Badge>
      
      <Badge variant="outline" className="flex items-center space-x-1">
        <BarChart3 className="h-3 w-3 text-blue-500" />
        <span className="text-xs">Avg Vol: {formatVolume(stats.averageVolume)}</span>
      </Badge>
    </div>
  )
}