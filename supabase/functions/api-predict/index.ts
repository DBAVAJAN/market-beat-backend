import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as tf from 'https://esm.sh/@tensorflow/tfjs@4.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
}

interface StockData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface PredictionResult {
  symbol: string
  predictionDate: string
  predictedClose: number
  lower: number
  upper: number
  model: string
  confidence: number
  features: {
    lastClose: number
    sma5: number
    sma20: number
    rsi14: number
    volatility: number
  }
}

// Simple cache to store predictions for 15 minutes
const predictionCache = new Map<string, { prediction: PredictionResult; timestamp: number }>()
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

function calculateSMA(prices: number[], period: number): number[] {
  const sma = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(prices[i]) // Fill early values with actual price
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      sma.push(sum / period)
    }
  }
  return sma
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi = []
  const gains = []
  const losses = []
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    gains.push(Math.max(change, 0))
    losses.push(Math.abs(Math.min(change, 0)))
  }
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(50) // Neutral RSI for early values
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
      
      if (avgLoss === 0) {
        rsi.push(100)
      } else {
        const rs = avgGain / avgLoss
        rsi.push(100 - (100 / (1 + rs)))
      }
    }
  }
  
  return rsi
}

function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0
  
  const recentPrices = prices.slice(-period)
  const returns = []
  
  for (let i = 1; i < recentPrices.length; i++) {
    returns.push(Math.log(recentPrices[i] / recentPrices[i - 1]))
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
  
  return Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility
}

function prepareFeatures(data: StockData[]): { features: number[][], targets: number[] } {
  const closes = data.map(d => d.close)
  const highs = data.map(d => d.high)
  const lows = data.map(d => d.low)
  const volumes = data.map(d => d.volume)
  
  const sma5 = calculateSMA(closes, 5)
  const sma20 = calculateSMA(closes, 20)
  const rsi = calculateRSI(closes, 14)
  
  const features: number[][] = []
  const targets: number[] = []
  
  // Start from day 21 to have enough data for all indicators
  for (let i = 21; i < data.length - 1; i++) {
    const volatility = calculateVolatility(closes.slice(0, i + 1), 20)
    
    features.push([
      closes[i],           // Current close (lag 0)
      closes[i - 1],       // Previous close (lag 1)
      closes[i - 5],       // Close 5 days ago (lag 5)
      sma5[i],            // 5-day SMA
      sma20[i],           // 20-day SMA
      rsi[i],             // RSI
      volatility,         // Volatility
      volumes[i] / 1000000, // Volume in millions
      (highs[i] - lows[i]) / closes[i] // Daily range ratio
    ])
    
    targets.push(closes[i + 1]) // Next day's close
  }
  
  return { features, targets }
}

function normalizeFeatures(features: number[][]): { normalized: number[][], means: number[], stds: number[] } {
  const means: number[] = []
  const stds: number[] = []
  const normalized: number[][] = []
  
  const numFeatures = features[0].length
  
  // Calculate means and standard deviations
  for (let j = 0; j < numFeatures; j++) {
    const column = features.map(row => row[j])
    const mean = column.reduce((sum, val) => sum + val, 0) / column.length
    const variance = column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / column.length
    const std = Math.sqrt(variance)
    
    means.push(mean)
    stds.push(std || 1) // Avoid division by zero
  }
  
  // Normalize features
  for (let i = 0; i < features.length; i++) {
    const normalizedRow: number[] = []
    for (let j = 0; j < numFeatures; j++) {
      normalizedRow.push((features[i][j] - means[j]) / stds[j])
    }
    normalized.push(normalizedRow)
  }
  
  return { normalized, means, stds }
}

async function trainLinearRegression(features: number[][], targets: number[]): Promise<{
  model: tf.LayersModel
  rmse: number
  means: number[]
  stds: number[]
}> {
  const { normalized, means, stds } = normalizeFeatures(features)
  
  // Convert to tensors
  const xs = tf.tensor2d(normalized)
  const ys = tf.tensor2d(targets, [targets.length, 1])
  
  // Create a simple neural network for regression
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [features[0].length], units: 16, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 8, activation: 'relu' }),
      tf.layers.dense({ units: 1 })
    ]
  })
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  })
  
  // Train the model
  await model.fit(xs, ys, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2,
    shuffle: true,
    verbose: 0
  })
  
  // Calculate RMSE
  const predictions = model.predict(xs) as tf.Tensor
  const mse = tf.losses.meanSquaredError(ys, predictions)
  const rmse = Math.sqrt(await mse.data()[0])
  
  // Clean up tensors
  xs.dispose()
  ys.dispose()
  predictions.dispose()
  mse.dispose()
  
  return { model, rmse, means, stds }
}

function getNextTradingDay(): string {
  const today = new Date()
  let nextDay = new Date(today)
  nextDay.setDate(today.getDate() + 1)
  
  // Skip weekends
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1)
  }
  
  return nextDay.toISOString().split('T')[0]
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

    // Check cache first
    const cacheKey = symbol
    const cached = predictionCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📋 Returning cached prediction for ${symbol}`)
      return new Response(
        JSON.stringify(cached.prediction),
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

    // Fetch last 2 years of data
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    const startDate = twoYearsAgo.toISOString().split('T')[0]

    const { data: stockData, error: stockError } = await supabase
      .from('stock_data')
      .select('date, open, high, low, close, volume')
      .eq('company_id', company.id)
      .gte('date', startDate)
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

    if (!stockData || stockData.length < 50) {
      return new Response(
        JSON.stringify({ error: 'Insufficient historical data for prediction' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🤖 Training model for ${symbol} with ${stockData.length} data points`)

    // Prepare features and train model
    const { features, targets } = prepareFeatures(stockData)
    
    if (features.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Insufficient data for reliable prediction' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { model, rmse, means, stds } = await trainLinearRegression(features, targets)

    // Prepare features for next day prediction
    const latestData = stockData.slice(-30) // Last 30 days for calculations
    const closes = latestData.map(d => d.close)
    const highs = latestData.map(d => d.high)
    const lows = latestData.map(d => d.low)
    const volumes = latestData.map(d => d.volume)
    
    const sma5 = calculateSMA(closes, 5)
    const sma20 = calculateSMA(closes, 20)
    const rsi = calculateRSI(closes, 14)
    const volatility = calculateVolatility(closes, 20)
    
    const lastIndex = latestData.length - 1
    const currentFeatures = [
      closes[lastIndex],           // Current close
      closes[lastIndex - 1],       // Previous close
      closes[lastIndex - 5] || closes[0], // Close 5 days ago
      sma5[lastIndex],            // 5-day SMA
      sma20[lastIndex],           // 20-day SMA
      rsi[lastIndex],             // RSI
      volatility,                 // Volatility
      volumes[lastIndex] / 1000000, // Volume in millions
      (highs[lastIndex] - lows[lastIndex]) / closes[lastIndex] // Daily range ratio
    ]

    // Normalize current features using training data stats
    const normalizedFeatures = currentFeatures.map((feature, i) => 
      (feature - means[i]) / stds[i]
    )

    // Make prediction
    const inputTensor = tf.tensor2d([normalizedFeatures])
    const predictionTensor = model.predict(inputTensor) as tf.Tensor
    const predictedClose = (await predictionTensor.data())[0]

    // Calculate confidence intervals (±1.5 * RMSE)
    const confidenceMultiplier = 1.5
    const lower = predictedClose - (confidenceMultiplier * rmse)
    const upper = predictedClose + (confidenceMultiplier * rmse)

    // Calculate confidence score (0-100)
    const confidence = Math.max(0, Math.min(100, 100 - (rmse / predictedClose * 100)))

    const prediction: PredictionResult = {
      symbol,
      predictionDate: getNextTradingDay(),
      predictedClose: Math.round(predictedClose * 100) / 100,
      lower: Math.round(lower * 100) / 100,
      upper: Math.round(upper * 100) / 100,
      model: 'neural_network_regression',
      confidence: Math.round(confidence * 100) / 100,
      features: {
        lastClose: closes[lastIndex],
        sma5: Math.round(sma5[lastIndex] * 100) / 100,
        sma20: Math.round(sma20[lastIndex] * 100) / 100,
        rsi14: Math.round(rsi[lastIndex] * 100) / 100,
        volatility: Math.round(volatility * 10000) / 10000
      }
    }

    // Cache the prediction
    predictionCache.set(cacheKey, { prediction, timestamp: Date.now() })

    // Clean up tensors
    inputTensor.dispose()
    predictionTensor.dispose()
    model.dispose()

    console.log(`🎯 Prediction for ${symbol}: ₹${prediction.predictedClose} (confidence: ${prediction.confidence}%)`)

    return new Response(
      JSON.stringify(prediction),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Prediction error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate prediction',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})