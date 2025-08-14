import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { VolumeSparkline } from './VolumeSparkline'

interface StockStats {
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  averageVolume: number
  asOf: string
}

interface OHLCData {
  t: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

interface StockStatTilesProps {
  stats: StockStats | null
  volumeData: OHLCData[]
  loading?: boolean
  symbol?: string
}

export function StockStatTiles({ stats, volumeData, loading = false, symbol }: StockStatTilesProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
            </div>
          </Card>
        ))}
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
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
    return volume.toString()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 52W High */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-muted-foreground">52W High</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold">₹{stats.fiftyTwoWeekHigh.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              As of {formatDate(stats.asOf)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 52W Low */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">52W Low</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold">₹{stats.fiftyTwoWeekLow.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              As of {formatDate(stats.asOf)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Volume */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">Avg Volume (52W)</span>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold">{formatVolume(stats.averageVolume)}</div>
            <div className="text-xs text-muted-foreground">
              Daily average
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Sparkline */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-muted-foreground">Volume Trend</span>
          </div>
          <div className="space-y-2">
            <VolumeSparkline data={volumeData} />
            <div className="text-xs text-muted-foreground">
              Last 30 sessions
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}