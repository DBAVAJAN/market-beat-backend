import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Stock price ranges for realistic data generation
const stockRanges = {
  'RELIANCE.NS': { min: 2400, max: 2600 },
  'TCS.NS': { min: 3200, max: 3600 },
  'INFY.NS': { min: 1450, max: 1650 },
  'HDFCBANK.NS': { min: 1450, max: 1650 },
  'ICICIBANK.NS': { min: 850, max: 1050 },
  'SBIN.NS': { min: 520, max: 620 },
  'LT.NS': { min: 3200, max: 3600 },
  'ITC.NS': { min: 420, max: 520 },
  'HINDUNILVR.NS': { min: 2200, max: 2600 },
  'ASIANPAINT.NS': { min: 2800, max: 3200 }
}

function generateRandomPrice(basePrice: number, volatility: number = 0.05): number {
  const change = (Math.random() - 0.5) * 2 * volatility
  return Math.round((basePrice * (1 + change)) * 100) / 100
}

function generateOHLCV(symbol: string, date: Date, previousClose?: number) {
  const range = stockRanges[symbol as keyof typeof stockRanges]
  const basePrice = previousClose || (range.min + range.max) / 2
  
  const open = generateRandomPrice(basePrice, 0.02)
  const close = generateRandomPrice(open, 0.04)
  
  const high = Math.max(open, close) * (1 + Math.random() * 0.03)
  const low = Math.min(open, close) * (1 - Math.random() * 0.03)
  
  const volume = Math.floor(Math.random() * (5000000 - 200000) + 200000)
  
  return {
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')

    if (companiesError) {
      throw companiesError
    }

    // Generate last 30 days of data for each company
    const stockData = []
    const endDate = new Date()
    
    for (const company of companies) {
      let previousClose: number | undefined
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(endDate)
        date.setDate(date.getDate() - i)
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (date.getDay() === 0 || date.getDay() === 6) {
          continue
        }
        
        const ohlcv = generateOHLCV(company.symbol, date, previousClose)
        previousClose = ohlcv.close
        
        stockData.push({
          company_id: company.id,
          date: date.toISOString().split('T')[0],
          ...ohlcv
        })
      }
    }

    // Insert stock data in batches
    const batchSize = 100
    for (let i = 0; i < stockData.length; i += batchSize) {
      const batch = stockData.slice(i, i + batchSize)
      const { error } = await supabase
        .from('stock_data')
        .upsert(batch, { 
          onConflict: 'company_id,date',
          ignoreDuplicates: false 
        })
      
      if (error) {
        console.error('Batch insert error:', error)
        throw error
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${stockData.length} stock data points for ${companies.length} companies`,
        companies: companies.length,
        dataPoints: stockData.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})