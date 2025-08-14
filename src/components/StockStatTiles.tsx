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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-[#f8f9fa] border border-border shadow-sm">
            <CardContent className="p-4 h-32 flex flex-col items-center justify-center">
              <div className="space-y-3 w-full text-center">
                <div className="h-4 w-20 bg-muted animate-pulse rounded mx-auto"></div>
                <div className="h-8 w-24 bg-muted animate-pulse rounded mx-auto"></div>
                <div className="h-3 w-16 bg-muted animate-pulse rounded mx-auto"></div>
              </div>
            </CardContent>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {/* 52W High */}
      <Card className="hover:shadow-md transition-shadow bg-[#f8f9fa] border border-border shadow-sm">
        <CardContent className="p-4 h-32 flex flex-col items-center justify-center">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-gain" />
            <span className="text-sm font-semibold text-foreground">52W High</span>
          </div>
          <div className="text-center space-y-1 flex-1 flex flex-col justify-center">
            <div className="text-2xl font-bold text-foreground">₹{stats.fiftyTwoWeekHigh.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(stats.asOf)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 52W Low */}
      <Card className="hover:shadow-md transition-shadow bg-[#f8f9fa] border border-border shadow-sm">
        <CardContent className="p-4 h-32 flex flex-col items-center justify-center">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-4 w-4 text-loss" />
            <span className="text-sm font-semibold text-foreground">52W Low</span>
          </div>
          <div className="text-center space-y-1 flex-1 flex flex-col justify-center">
            <div className="text-2xl font-bold text-foreground">₹{stats.fiftyTwoWeekLow.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(stats.asOf)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Volume */}
      <Card className="hover:shadow-md transition-shadow bg-[#f8f9fa] border border-border shadow-sm">
        <CardContent className="p-4 h-32 flex flex-col items-center justify-center">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Avg Volume (52W)</span>
          </div>
          <div className="text-center space-y-1 flex-1 flex flex-col justify-center">
            <div className="text-2xl font-bold text-foreground">{formatVolume(stats.averageVolume)}</div>
            <div className="text-xs text-muted-foreground">
              Daily average
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Sparkline */}
      <Card className="hover:shadow-md transition-shadow bg-[#f8f9fa] border border-border shadow-sm">
        <CardContent className="p-4 h-32 flex flex-col items-center justify-center">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Volume Trend</span>
          </div>
          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <div className="flex justify-center">
              <VolumeSparkline data={volumeData} />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Last 30 sessions
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}