import React, { useMemo, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { ChartSkeleton } from './ChartSkeleton'

interface OHLCData {
  t: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

interface StockStats {
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  averageVolume: number
  asOf: string
}

interface InteractiveChartProps {
  data: OHLCData[]
  stats: StockStats | null
  symbol: string
  chartType: 'line' | 'candlestick'
  timeframe: string
  loading?: boolean
}

export function InteractiveChart({ 
  data, 
  stats, 
  symbol, 
  chartType, 
  timeframe,
  loading = false 
}: InteractiveChartProps) {
  if (loading || !data || data.length === 0) {
    return <ChartSkeleton />
  }

  const { mainTraces, volumeTrace, layout } = useMemo(() => {
    const dates = data.map(d => d.t)
    const opens = data.map(d => d.o)
    const highs = data.map(d => d.h)
    const lows = data.map(d => d.l)
    const closes = data.map(d => d.c)
    const volumes = data.map(d => d.v)

    let mainTraces: any[] = []

    if (chartType === 'candlestick') {
      mainTraces.push({
        type: 'candlestick',
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        name: symbol,
        increasing: { line: { color: 'rgb(34, 197, 94)' } },
        decreasing: { line: { color: 'rgb(239, 68, 68)' } },
        hovertemplate: '<b>%{fullData.name}</b><br>' +
                      'Date: %{x}<br>' +
                      'Open: ₹%{open:,.2f}<br>' +
                      'High: ₹%{high:,.2f}<br>' +
                      'Low: ₹%{low:,.2f}<br>' +
                      'Close: ₹%{close:,.2f}<br>' +
                      '<extra></extra>'
      })
    } else {
      mainTraces.push({
        type: 'scatter',
        mode: 'lines',
        x: dates,
        y: closes,
        name: symbol,
        line: { 
          color: 'rgb(59, 130, 246)', 
          width: 2,
          shape: 'spline'
        },
        hovertemplate: '<b>%{fullData.name}</b><br>' +
                      'Date: %{x}<br>' +
                      'Close: ₹%{y:,.2f}<br>' +
                      '<extra></extra>'
      })
    }

    // Add 52-week high/low lines if stats available
    if (stats) {
      mainTraces.push({
        type: 'scatter',
        mode: 'lines',
        x: [dates[0], dates[dates.length - 1]],
        y: [stats.fiftyTwoWeekHigh, stats.fiftyTwoWeekHigh],
        name: '52W High',
        line: { 
          color: 'rgba(34, 197, 94, 0.6)', 
          width: 1, 
          dash: 'dash' 
        },
        hovertemplate: '52W High: ₹%{y:,.2f}<extra></extra>',
        showlegend: false
      })

      mainTraces.push({
        type: 'scatter',
        mode: 'lines',
        x: [dates[0], dates[dates.length - 1]],
        y: [stats.fiftyTwoWeekLow, stats.fiftyTwoWeekLow],
        name: '52W Low',
        line: { 
          color: 'rgba(239, 68, 68, 0.6)', 
          width: 1, 
          dash: 'dash' 
        },
        hovertemplate: '52W Low: ₹%{y:,.2f}<extra></extra>',
        showlegend: false
      })
    }

    const volumeTrace = {
      type: 'bar',
      x: dates,
      y: volumes,
      name: 'Volume',
      yaxis: 'y2',
      marker: { 
        color: volumes.map((_, i) => 
          i > 0 && closes[i] >= closes[i-1] 
            ? 'rgba(34, 197, 94, 0.6)' 
            : 'rgba(239, 68, 68, 0.6)'
        )
      },
      hovertemplate: 'Volume: %{y:,.0f}<extra></extra>'
    }

    const layout = {
      title: {
        text: `${symbol} - ${timeframe}`,
        font: { size: 18, color: 'rgb(156, 163, 175)' }
      },
      xaxis: {
        title: 'Date',
        type: 'date',
        rangeslider: { visible: false },
        showgrid: true,
        gridcolor: 'rgba(156, 163, 175, 0.2)',
        color: 'rgb(156, 163, 175)'
      },
      yaxis: {
        title: 'Price (₹)',
        side: 'left',
        showgrid: true,
        gridcolor: 'rgba(156, 163, 175, 0.2)',
        color: 'rgb(156, 163, 175)',
        tickformat: ',.2f'
      },
      yaxis2: {
        title: 'Volume',
        side: 'right',
        overlaying: 'y',
        showgrid: false,
        color: 'rgb(156, 163, 175)',
        tickformat: '.2s'
      },
      legend: {
        orientation: 'h',
        y: -0.2,
        x: 0,
        font: { color: 'rgb(156, 163, 175)' }
      },
      margin: { l: 50, r: 50, t: 50, b: 80 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'rgb(156, 163, 175)' },
      hovermode: 'x unified',
      crossfilter: { visible: true }
    }

    return { mainTraces, volumeTrace, layout }
  }, [data, stats, symbol, chartType, timeframe])

  const allTraces = [...mainTraces, volumeTrace]

  return (
    <div className="w-full animate-fade-in">
      <Plot
        data={allTraces}
        layout={layout}
        style={{ width: '100%', height: '500px' }}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: [
            'pan2d', 'select2d', 'lasso2d', 'resetScale2d',
            'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'hoverClosestCartesian',
            'hoverCompareCartesian', 'toggleSpikelines'
          ],
          displaylogo: false,
          toImageButtonOptions: {
            format: 'png',
            filename: `${symbol}_chart_${timeframe}`,
            height: 500,
            width: 1000,
            scale: 1
          }
        }}
      />
    </div>
  )
}