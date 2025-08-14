import { describe, it, expect, vi } from 'vitest'
import { loadMockData, formatMockDataForAPI } from '../utils/mockDataHelpers'

describe('Mock Data API', () => {
  describe('CSV data loading', () => {
    it('should load and parse CSV data correctly', async () => {
      const data = await loadMockData()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      // Check structure of first item
      const firstItem = data[0]
      expect(firstItem).toHaveProperty('date')
      expect(firstItem).toHaveProperty('open')
      expect(firstItem).toHaveProperty('high')
      expect(firstItem).toHaveProperty('low')
      expect(firstItem).toHaveProperty('close')
      expect(firstItem).toHaveProperty('volume')
    })

    it('should convert string values to numbers', async () => {
      const data = await loadMockData()
      const firstItem = data[0]
      
      expect(typeof firstItem.open).toBe('number')
      expect(typeof firstItem.high).toBe('number')
      expect(typeof firstItem.low).toBe('number')
      expect(typeof firstItem.close).toBe('number')
      expect(typeof firstItem.volume).toBe('number')
    })
  })

  describe('API format conversion', () => {
    it('should format data for stocks API', async () => {
      const mockData = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
        { date: '2024-01-02', open: 103, high: 108, low: 101, close: 106, volume: 1200000 }
      ]
      
      const formatted = formatMockDataForAPI(mockData, 'stocks')
      expect(formatted).toHaveLength(2)
      
      const firstItem = formatted[0]
      expect(firstItem).toHaveProperty('t', '2024-01-01')
      expect(firstItem).toHaveProperty('o', 100)
      expect(firstItem).toHaveProperty('h', 105)
      expect(firstItem).toHaveProperty('l', 98)
      expect(firstItem).toHaveProperty('c', 103)
      expect(firstItem).toHaveProperty('v', 1000000)
    })

    it('should format data for stats API', async () => {
      const mockData = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
        { date: '2024-01-02', open: 103, high: 108, low: 101, close: 106, volume: 1200000 },
        { date: '2024-01-03', open: 106, high: 110, low: 104, close: 108, volume: 900000 }
      ]
      
      const formatted = formatMockDataForAPI(mockData, 'stats')
      expect(formatted).toHaveProperty('fiftyTwoWeekHigh', 110)
      expect(formatted).toHaveProperty('fiftyTwoWeekLow', 98)
      expect(formatted).toHaveProperty('averageVolume', 1033333) // Average of the 3 volumes
      expect(formatted).toHaveProperty('asOf')
    })

    it('should format data for predict API', async () => {
      const mockData = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000000 }
      ]
      
      const formatted = formatMockDataForAPI(mockData, 'predict', 'AAPL')
      expect(formatted).toHaveProperty('symbol', 'AAPL')
      expect(formatted).toHaveProperty('predictionDate')
      expect(formatted).toHaveProperty('predictedClose')
      expect(formatted).toHaveProperty('lower')
      expect(formatted).toHaveProperty('upper')
      expect(formatted).toHaveProperty('model', 'mock_linear_regression')
    })
  })
})