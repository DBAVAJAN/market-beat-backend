import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
}

interface OHLCData {
  t: string // ISO8601
  o: number
  h: number
  l: number
  c: number
  v: number
}

function getDateRange(range: string): { startDate: Date, interval: string } {
  const now = new Date()
  let startDate = new Date()
  let interval = '1d'

  switch (range) {
    case '1D':
      startDate.setDate(now.getDate() - 1)
      interval = '5m'
      break
    case '1W':
      startDate.setDate(now.getDate() - 7)
      interval = '15m'
      break
    case '1M':
      startDate.setMonth(now.getMonth() - 1)
      interval = '1h'
      break
    case '6M':
      startDate.setMonth(now.getMonth() - 6)
      interval = '1d'
      break
    case '1Y':
      startDate.setFullYear(now.getFullYear() - 1)
      interval = '1d'
      break
    case 'MAX':
      startDate.setFullYear(now.getFullYear() - 5) // 5 years max
      interval = '1d'
      break
    default:
      startDate.setMonth(now.getMonth() - 1) // Default to 1M
      interval = '1h'
  }

  return { startDate, interval }
}

function aggregateToInterval(data: any[], interval: string): OHLCData[] {
  if (interval === '1d' || data.length === 0) {
    // Return daily data as-is
    return data.map(item => ({
      t: new Date(item.date).toISOString(),
      o: parseFloat(item.open),
      h: parseFloat(item.high),
      l: parseFloat(item.low),
      c: parseFloat(item.close),
      v: parseInt(item.volume)
    }))
  }

  // For intraday intervals, we'll simulate by creating multiple data points per day
  const result: OHLCData[] = []
  
  data.forEach(dayData => {
    const baseDate = new Date(dayData.date)
    const pointsPerDay = interval === '5m' ? 78 : interval === '15m' ? 26 : 7 // 5m=78, 15m=26, 1h=7 points per trading day
    
    for (let i = 0; i < pointsPerDay; i++) {
      const timeOffset = interval === '5m' ? i * 5 : interval === '15m' ? i * 15 : i * 60
      const pointDate = new Date(baseDate)
      pointDate.setHours(9, 15 + timeOffset, 0, 0) // Start at 9:15 AM
      
      if (pointDate.getHours() >= 15 && pointDate.getMinutes() >= 30) break // Market closes at 3:30 PM
      
      // Simulate intraday movement
      const dayRange = parseFloat(dayData.high) - parseFloat(dayData.low)
      const randomFactor = Math.random()
      
      result.push({
        t: pointDate.toISOString(),
        o: parseFloat(dayData.low) + (dayRange * randomFactor),
        h: parseFloat(dayData.low) + (dayRange * (randomFactor + 0.1)),
        l: parseFloat(dayData.low) + (dayRange * (randomFactor - 0.1)),
        c: parseFloat(dayData.low) + (dayRange * (randomFactor + 0.05)),
        v: Math.floor(parseInt(dayData.volume) / pointsPerDay)
      })
    }
  })

  return result
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const symbol = pathParts[pathParts.length - 1]
    const range = url.searchParams.get('range') || '1M'

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol parameter is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if we should use mock data
    const useMock = Deno.env.get('USE_MOCK') === '1'
    
    if (useMock) {
      console.log('🎭 Using mock data for symbol:', symbol)
      
      // Return mock OHLC data
      const mockData = generateMockOHLCData(range)
      return new Response(
        JSON.stringify(mockData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get company ID
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('symbol', symbol)
      .single()

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: `Company with symbol ${symbol} not found` }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { startDate } = getDateRange(range)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Fetch stock data
    const { data: stockData, error: stockError } = await supabase
      .from('stock_data')
      .select('*')
      .eq('company_id', company.id)
      .gte('date', startDateStr)
      .order('date', { ascending: true })

    if (stockError) {
      console.error('Database error:', stockError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stock data' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const ohlcData = aggregateToInterval(stockData || [], getDateRange(range).interval)

    return new Response(
      JSON.stringify({
        symbol,
        range,
        interval: getDateRange(range).interval,
        data: ohlcData,
        count: ohlcData.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to generate mock OHLC data
function generateMockOHLCData(range: string) {
  const basePrice = 150
  const volatility = 0.02
  let dataPoints = 30
  
  switch (range) {
    case '1D': dataPoints = 1; break
    case '1W': dataPoints = 7; break
    case '1M': dataPoints = 30; break
    case '6M': dataPoints = 180; break
    case '1Y': dataPoints = 365; break
    case 'MAX': dataPoints = 500; break
  }
  
  const data = []
  let currentPrice = basePrice
  
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (dataPoints - i - 1))
    
    const change = (Math.random() - 0.5) * volatility
    const open = currentPrice
    const close = open * (1 + change)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)
    const volume = Math.floor(1000000 + Math.random() * 2000000)
    
    data.push({
      t: date.toISOString().split('T')[0],
      o: Math.round(open * 100) / 100,
      h: Math.round(high * 100) / 100,
      l: Math.round(low * 100) / 100,
      c: Math.round(close * 100) / 100,
      v: volume
    })
    
    currentPrice = close
  }
  
  return data
}