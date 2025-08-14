interface StockData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface PredictionData {
  symbol: string
  predictionDate: string
  predictedClose: number
  lower: number
  upper: number
  model: string
}

export function calculateTimeframeSlice(data: StockData[], timeframe: string): StockData[] {
  if (!data || data.length === 0) return []
  
  const now = new Date()
  let cutoffDate: Date
  
  switch (timeframe) {
    case '1D':
      return data.slice(-1)
    case '1W':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '1M':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '6M':
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case '1Y':
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case 'MAX':
    default:
      return data
  }
  
  return data.filter(item => new Date(item.date) >= cutoffDate)
}

export function calculate52WeekStats(data: StockData[]): { high: number, low: number } {
  if (!data || data.length === 0) return { high: 0, low: 0 }
  
  const highs = data.map(d => d.high)
  const lows = data.map(d => d.low)
  
  return {
    high: Math.max(...highs),
    low: Math.min(...lows)
  }
}

export function calculateAverageVolume(data: StockData[]): number {
  if (!data || data.length === 0) return 0
  
  const totalVolume = data.reduce((sum, item) => sum + item.volume, 0)
  return Math.round(totalVolume / data.length)
}

export function validatePredictionSchema(prediction: any): boolean {
  const requiredFields = ['symbol', 'predictionDate', 'predictedClose', 'lower', 'upper', 'model']
  
  // Check if all required fields exist
  for (const field of requiredFields) {
    if (!(field in prediction)) return false
  }
  
  // Check types
  if (typeof prediction.symbol !== 'string') return false
  if (typeof prediction.predictionDate !== 'string') return false
  if (typeof prediction.predictedClose !== 'number') return false
  if (typeof prediction.lower !== 'number') return false
  if (typeof prediction.upper !== 'number') return false
  if (typeof prediction.model !== 'string') return false
  
  // Check date format (basic validation)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(prediction.predictionDate)) return false
  
  return true
}