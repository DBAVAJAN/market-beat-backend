import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
}

interface StockStats {
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  averageVolume: number
  asOf: string
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
      console.log('🎭 Using mock stats for symbol:', symbol)
      
      const mockStats = generateMockStats()
      return new Response(
        JSON.stringify({
          symbol,
          stats: mockStats,
          dataPoints: 252,
          period: 'Mock data (52 weeks)'
        }),
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

    // Calculate date 252 trading days ago (approximately 1 year)
    const today = new Date()
    const startDate = new Date()
    startDate.setDate(today.getDate() - 365) // Approximate 252 trading days
    const startDateStr = startDate.toISOString().split('T')[0]

    // Fetch last 252 trading days of data
    const { data: stockData, error: stockError } = await supabase
      .from('stock_data')
      .select('high, low, volume, date')
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

    if (!stockData || stockData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No stock data available for calculation' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calculate 52-week high and low
    const highs = stockData.map(d => parseFloat(d.high))
    const lows = stockData.map(d => parseFloat(d.low))
    const volumes = stockData.map(d => parseInt(d.volume))

    const fiftyTwoWeekHigh = Math.max(...highs)
    const fiftyTwoWeekLow = Math.min(...lows)
    
    // Calculate average volume
    const averageVolume = Math.round(volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length)

    // Get the most recent date as "as of" date
    const asOf = stockData[stockData.length - 1]?.date || today.toISOString().split('T')[0]

    const stats: StockStats = {
      fiftyTwoWeekHigh: Math.round(fiftyTwoWeekHigh * 100) / 100,
      fiftyTwoWeekLow: Math.round(fiftyTwoWeekLow * 100) / 100,
      averageVolume,
      asOf
    }

    return new Response(
      JSON.stringify({
        symbol,
        stats,
        dataPoints: stockData.length,
        period: `${startDateStr} to ${asOf}`
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

// Helper function to generate mock stats
function generateMockStats(): StockStats {
  const basePrice = 150
  const high = basePrice * (1.1 + Math.random() * 0.2) // 10-30% above base
  const low = basePrice * (0.7 + Math.random() * 0.2)  // 70-90% of base
  const volume = Math.floor(2000000 + Math.random() * 3000000) // 2M-5M
  
  return {
    fiftyTwoWeekHigh: Math.round(high * 100) / 100,
    fiftyTwoWeekLow: Math.round(low * 100) / 100,
    averageVolume: volume,
    asOf: new Date().toISOString().split('T')[0]
  }
}