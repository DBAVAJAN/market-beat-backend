import { vi } from 'vitest'

// Mock environment variables
vi.stubEnv('USE_MOCK', '0')

// Mock fetch for edge function calls
global.fetch = vi.fn()

// Mock Plotly
vi.mock('react-plotly.js', () => ({
  default: () => null
}))

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}))