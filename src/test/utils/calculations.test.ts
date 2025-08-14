import { describe, it, expect } from 'vitest'
import { 
  calculateTimeframeSlice,
  calculate52WeekStats,
  calculateAverageVolume,
  validatePredictionSchema
} from '../utils/testHelpers'

describe('Stock Calculations', () => {
  const mockData = [
    { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
    { date: '2024-01-02', open: 103, high: 108, low: 101, close: 106, volume: 1200000 },
    { date: '2024-01-03', open: 106, high: 110, low: 104, close: 108, volume: 900000 },
    { date: '2024-01-04', open: 108, high: 112, low: 106, close: 110, volume: 1100000 },
    { date: '2024-01-05', open: 110, high: 115, low: 108, close: 113, volume: 1300000 },
  ]

  describe('timeframe slicing', () => {
    it('should slice data for 1D timeframe', () => {
      const result = calculateTimeframeSlice(mockData, '1D')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockData[mockData.length - 1])
    })

    it('should slice data for 1W timeframe', () => {
      const result = calculateTimeframeSlice(mockData, '1W')
      expect(result).toHaveLength(5) // All data within a week
    })

    it('should return all data for MAX timeframe', () => {
      const result = calculateTimeframeSlice(mockData, 'MAX')
      expect(result).toHaveLength(mockData.length)
    })

    it('should handle empty data', () => {
      const result = calculateTimeframeSlice([], '1M')
      expect(result).toHaveLength(0)
    })
  })

  describe('52-week high/low calculation', () => {
    it('should calculate correct 52-week high and low', () => {
      const stats = calculate52WeekStats(mockData)
      expect(stats.high).toBe(115)
      expect(stats.low).toBe(98)
    })

    it('should handle single data point', () => {
      const singleData = [mockData[0]]
      const stats = calculate52WeekStats(singleData)
      expect(stats.high).toBe(105)
      expect(stats.low).toBe(98)
    })

    it('should handle empty data', () => {
      const stats = calculate52WeekStats([])
      expect(stats.high).toBe(0)
      expect(stats.low).toBe(0)
    })
  })

  describe('average volume calculation', () => {
    it('should calculate correct average volume', () => {
      const avgVolume = calculateAverageVolume(mockData)
      expect(avgVolume).toBe(1100000) // (1000000 + 1200000 + 900000 + 1100000 + 1300000) / 5
    })

    it('should handle empty data', () => {
      const avgVolume = calculateAverageVolume([])
      expect(avgVolume).toBe(0)
    })

    it('should round to nearest integer', () => {
      const data = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000001 },
        { date: '2024-01-02', open: 103, high: 108, low: 101, close: 106, volume: 1000002 },
      ]
      const avgVolume = calculateAverageVolume(data)
      expect(avgVolume).toBe(1000002) // Rounded up from 1000001.5
    })
  })

  describe('prediction output schema validation', () => {
    it('should validate correct prediction schema', () => {
      const validPrediction = {
        symbol: 'AAPL',
        predictionDate: '2024-01-06',
        predictedClose: 115.50,
        lower: 110.25,
        upper: 120.75,
        model: 'linear_regression'
      }
      
      expect(validatePredictionSchema(validPrediction)).toBe(true)
    })

    it('should reject invalid prediction schema', () => {
      const invalidPrediction = {
        symbol: 'AAPL',
        // Missing predictionDate
        predictedClose: 115.50,
        lower: 110.25,
        upper: 120.75,
        model: 'linear_regression'
      }
      
      expect(validatePredictionSchema(invalidPrediction)).toBe(false)
    })

    it('should reject prediction with invalid types', () => {
      const invalidPrediction = {
        symbol: 'AAPL',
        predictionDate: '2024-01-06',
        predictedClose: '115.50', // Should be number
        lower: 110.25,
        upper: 120.75,
        model: 'linear_regression'
      }
      
      expect(validatePredictionSchema(invalidPrediction)).toBe(false)
    })
  })
})