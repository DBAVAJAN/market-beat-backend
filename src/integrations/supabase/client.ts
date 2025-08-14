import { createClient } from "@supabase/supabase-js";

// Mock data for development - replace with real Supabase client when connected
export const mockCompanies = [
  { id: 1, name: 'Reliance Industries', symbol: 'RELIANCE.NS' },
  { id: 2, name: 'Tata Consultancy Services', symbol: 'TCS.NS' },
  { id: 3, name: 'Infosys', symbol: 'INFY.NS' },
  { id: 4, name: 'HDFC Bank', symbol: 'HDFCBANK.NS' },
  { id: 5, name: 'ICICI Bank', symbol: 'ICICIBANK.NS' },
  { id: 6, name: 'State Bank of India', symbol: 'SBIN.NS' },
  { id: 7, name: 'Larsen & Toubro', symbol: 'LT.NS' },
  { id: 8, name: 'ITC', symbol: 'ITC.NS' },
  { id: 9, name: 'Hindustan Unilever', symbol: 'HINDUNILVR.NS' },
  { id: 10, name: 'Asian Paints', symbol: 'ASIANPAINT.NS' }
];

const stockRanges: Record<string, { min: number; max: number }> = {
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
};

function generateRandomPrice(basePrice: number, volatility: number = 0.05): number {
  const change = (Math.random() - 0.5) * 2 * volatility;
  return Math.round((basePrice * (1 + change)) * 100) / 100;
}

function generateOHLCV(symbol: string, date: Date, previousClose?: number) {
  const range = stockRanges[symbol];
  const basePrice = previousClose || (range.min + range.max) / 2;
  
  const open = generateRandomPrice(basePrice, 0.02);
  const close = generateRandomPrice(open, 0.04);
  
  const high = Math.max(open, close) * (1 + Math.random() * 0.03);
  const low = Math.min(open, close) * (1 - Math.random() * 0.03);
  
  const volume = Math.floor(Math.random() * (5000000 - 200000) + 200000);
  
  return {
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume
  };
}

export function generateMockStockData() {
  const stockData: Record<string, any[]> = {};
  const endDate = new Date();
  
  mockCompanies.forEach(company => {
    const data = [];
    let previousClose: number | undefined;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      const ohlcv = generateOHLCV(company.symbol, date, previousClose);
      previousClose = ohlcv.close;
      
      data.push({
        date: date.toISOString().split('T')[0],
        ...ohlcv
      });
    }
    
    stockData[company.symbol] = data;
  });
  
  return stockData;
}

// Mock Supabase client for development
export const mockSupabase = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      order: (column: string, options?: any) => {
        if (table === 'companies') {
          return Promise.resolve({ data: mockCompanies, error: null });
        }
        return Promise.resolve({ data: [], error: null });
      },
      eq: (column: string, value: any) => ({
        order: (orderColumn: string, options?: any) => {
          const mockData = generateMockStockData();
          const company = mockCompanies.find(c => c.id === value);
          const data = company ? mockData[company.symbol] || [] : [];
          return Promise.resolve({ data, error: null });
        }
      })
    })
  }),
  functions: {
    invoke: (functionName: string) => {
      if (functionName === 'seed-stock-data') {
        return Promise.resolve({
          data: { success: true, message: 'Mock data generated successfully' },
          error: null
        });
      }
      return Promise.resolve({ data: null, error: null });
    }
  }
};

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Create the appropriate client
const createSupabaseClient = () => {
  if (isSupabaseConfigured()) {
    // Real Supabase client when environment variables are available
    return createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  } else {
    // Mock client for development
    console.log('🔧 Using mock data - Connect Supabase for real database');
    return mockSupabase as any;
  }
};

export const supabase = createSupabaseClient();