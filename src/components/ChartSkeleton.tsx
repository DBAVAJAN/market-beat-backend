import React from 'react'

export function ChartSkeleton() {
  return (
    <div className="w-full h-[400px] animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 bg-muted rounded w-32"></div>
        <div className="h-6 bg-muted rounded w-24"></div>
      </div>
      
      <div className="relative h-[350px] bg-muted/30 rounded-lg overflow-hidden">
        {/* Y-axis skeleton */}
        <div className="absolute left-2 top-4 space-y-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 w-12 bg-muted rounded"></div>
          ))}
        </div>
        
        {/* Chart area skeleton */}
        <div className="ml-16 mr-4 mt-4 h-[280px] relative">
          {/* Candlestick-like rectangles */}
          <div className="flex justify-between items-end h-full">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex flex-col justify-end space-y-1">
                <div 
                  className="w-1 bg-muted rounded"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                ></div>
                <div 
                  className="w-3 bg-muted/60 rounded"
                  style={{ height: `${Math.random() * 40 + 30}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* X-axis skeleton */}
        <div className="absolute bottom-2 left-16 right-4 flex justify-between">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Volume chart skeleton */}
      <div className="mt-4 h-[80px] bg-muted/20 rounded-lg relative">
        <div className="flex justify-between items-end h-full p-2">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="w-1 bg-muted/60 rounded"
              style={{ height: `${Math.random() * 70 + 10}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}