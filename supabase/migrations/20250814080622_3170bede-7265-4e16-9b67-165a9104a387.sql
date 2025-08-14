-- Insert mock stock data for the last 30 days for all companies
-- First, let's create a temporary function to generate the data

WITH RECURSIVE date_series AS (
  SELECT CURRENT_DATE - INTERVAL '29 days' AS trade_date
  UNION ALL
  SELECT trade_date + INTERVAL '1 day'
  FROM date_series
  WHERE trade_date < CURRENT_DATE
),
trading_days AS (
  SELECT trade_date
  FROM date_series
  WHERE EXTRACT(dow FROM trade_date) NOT IN (0, 6) -- Exclude weekends
),
company_base_prices AS (
  SELECT 
    c.id,
    c.symbol,
    CASE c.symbol
      WHEN 'RELIANCE' THEN 2500
      WHEN 'TCS' THEN 3400
      WHEN 'INFY' THEN 1550
      WHEN 'HDFCBANK' THEN 1550
      WHEN 'ICICIBANK' THEN 950
      WHEN 'SBIN' THEN 570
      WHEN 'LT' THEN 3400
      WHEN 'ITC' THEN 470
      WHEN 'HINDUNILVR' THEN 2400
      WHEN 'ASIANPAINT' THEN 3000
      WHEN 'BAJFINANCE' THEN 6800
      WHEN 'BHARTIARTL' THEN 1200
      WHEN 'KOTAKBANK' THEN 1700
      WHEN 'MARUTI' THEN 11000
      WHEN 'WIPRO' THEN 420
      ELSE 1000
    END as base_price
  FROM companies c
),
stock_data_generated AS (
  SELECT 
    cbp.id as company_id,
    td.trade_date as date,
    -- Generate realistic OHLC data
    ROUND((cbp.base_price * (0.98 + random() * 0.04))::numeric, 2) as open,
    ROUND((cbp.base_price * (1.01 + random() * 0.03))::numeric, 2) as high,
    ROUND((cbp.base_price * (0.97 + random() * 0.03))::numeric, 2) as low,
    ROUND((cbp.base_price * (0.96 + random() * 0.08))::numeric, 2) as close,
    (200000 + random() * 4800000)::bigint as volume
  FROM company_base_prices cbp
  CROSS JOIN trading_days td
)
INSERT INTO stock_data (company_id, date, open, high, low, close, volume)
SELECT 
  company_id,
  date,
  open,
  GREATEST(open, close, high) as high, -- Ensure high is actually highest
  LEAST(open, close, low) as low,     -- Ensure low is actually lowest
  close,
  volume
FROM stock_data_generated;