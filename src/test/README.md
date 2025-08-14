# Test Suite

This directory contains the test suite for the stock market application.

## Setup

Tests are configured to use Vitest with jsdom environment for React component testing.

## Running Tests

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (for CI)
npm run test:run
```

## Mock Data

The application supports running with mock data for offline development:

1. Set environment variable `USE_MOCK=1` in your Supabase Edge Functions
2. The app will use generated mock data instead of real API calls
3. Mock data includes realistic OHLC patterns and statistics

## Test Structure

- `utils/` - Helper functions and calculation tests
- `integration/` - API contract and integration tests
- `setup.ts` - Test environment setup and mocks

## API Contracts

Tests verify that all APIs follow the expected response formats:

### GET /api/stocks/:symbol?range=1M
Returns array of OHLC data:
```typescript
[{
  t: string,    // date (YYYY-MM-DD)
  o: number,    // open price
  h: number,    // high price
  l: number,    // low price
  c: number,    // close price
  v: number     // volume
}]
```

### GET /api/stats/:symbol
Returns 52-week statistics:
```typescript
{
  symbol: string,
  stats: {
    fiftyTwoWeekHigh: number,
    fiftyTwoWeekLow: number,
    averageVolume: number,
    asOf: string
  },
  dataPoints: number,
  period: string
}
```

### GET /api/predict/:symbol
Returns next-day prediction:
```typescript
{
  symbol: string,
  predictionDate: string,     // YYYY-MM-DD
  predictedClose: number,
  lower: number,              // confidence interval lower bound
  upper: number,              // confidence interval upper bound
  model: string               // model name
}
```

## Mock Data File

`data/DEMO.csv` contains sample stock data with columns:
- date
- open
- high
- low
- close
- volume

This data is used when `USE_MOCK=1` is enabled.