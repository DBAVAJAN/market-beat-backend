import React, { useMemo } from 'react'

interface OHLCData {
  t: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

interface VolumeSparklineProps {
  data: OHLCData[]
}

export function VolumeSparkline({ data }: VolumeSparklineProps) {
  const sparklineData = useMemo(() => {
    if (!data || data.length === 0) return { points: '', maxVolume: 0, minVolume: 0 }
    
    // Get last 30 sessions
    const last30 = data.slice(-30)
    const volumes = last30.map(d => d.v)
    
    if (volumes.length === 0) return { points: '', maxVolume: 0, minVolume: 0 }
    
    const maxVolume = Math.max(...volumes)
    const minVolume = Math.min(...volumes)
    const range = maxVolume - minVolume || 1
    
    const width = 120
    const height = 32
    const stepX = width / (volumes.length - 1 || 1)
    
    // Create SVG path points
    const points = volumes.map((volume, index) => {
      const x = index * stepX
      const y = height - ((volume - minVolume) / range) * height
      return `${x},${y}`
    }).join(' ')
    
    return { points, maxVolume, minVolume }
  }, [data])

  const formatVolume = (volume: number) => {
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
    return volume.toString()
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-8 text-xs text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <svg width="120" height="32" className="w-full h-8">
        <polyline
          points={sparklineData.points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-blue-500"
        />
        {/* Fill area under the line */}
        {sparklineData.points && (
          <polygon
            points={`0,32 ${sparklineData.points} 120,32`}
            fill="currentColor"
            className="text-blue-500/20"
          />
        )}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatVolume(sparklineData.minVolume)}</span>
        <span>{formatVolume(sparklineData.maxVolume)}</span>
      </div>
    </div>
  )
}