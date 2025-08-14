interface StockData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function loadMockData(): Promise<StockData[]> {
  // In a real environment, this would read from the CSV file
  // For testing, we'll return mock data
  return [
    { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
    { date: '2024-01-02', open: 103, high: 108, low: 101, close: 106, volume: 1200000 },
    { date: '2024-01-03', open: 106, high: 110, low: 104, close: 108, volume: 900000 },
    { date: '2024-01-04', open: 108, high: 112, low: 106, close: 110, volume: 1100000 },
    { date: '2024-01-05', open: 110, high: 115, low: 108, close: 113, volume: 1300000 },
  ]
}

export function formatMockDataForAPI(
  data: StockData[], 
  apiType: 'stocks' | 'stats' | 'predict',
  symbol?: string
): any {
  switch (apiType) {
    case 'stocks':
      return data.map(item => ({
        t: item.date,
        o: item.open,
        h: item.high,
        l: item.low,
        c: item.close,
        v: item.volume
      }))
    
    case 'stats':
      if (data.length === 0) {
        return {
          fiftyTwoWeekHigh: 0,
          fiftyTwoWeekLow: 0,
          averageVolume: 0,
          asOf: new Date().toISOString().split('T')[0]
        }
      }
      
      const highs = data.map(d => d.high)
      const lows = data.map(d => d.low)
      const volumes = data.map(d => d.volume)
      
      return {
        fiftyTwoWeekHigh: Math.max(...highs),
        fiftyTwoWeekLow: Math.min(...lows),
        averageVolume: Math.round(volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length),
        asOf: data[data.length - 1]?.date || new Date().toISOString().split('T')[0]
      }
    
    case 'predict':
      const lastClose = data.length > 0 ? data[data.length - 1].close : 100
      const volatility = 0.05 // 5% volatility for mock prediction
      const predicted = lastClose * (1 + (Math.random() - 0.5) * 0.1) // ±5% random change
      
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + 1)
      
      return {
        symbol: symbol || 'MOCK',
        predictionDate: nextDate.toISOString().split('T')[0],
        predictedClose: Math.round(predicted * 100) / 100,
        lower: Math.round((predicted * (1 - volatility)) * 100) / 100,
        upper: Math.round((predicted * (1 + volatility)) * 100) / 100,
        model: 'mock_linear_regression'
      }
    
    default:
      return data
  }
}