-- Create a function to generate realistic stock data
CREATE OR REPLACE FUNCTION generate_stock_data()
RETURNS void AS $$
DECLARE
    company_record RECORD;
    base_date DATE := CURRENT_DATE - INTERVAL '29 days';
    current_date DATE;
    day_counter INTEGER;
    prev_close DECIMAL;
    open_price DECIMAL;
    close_price DECIMAL;
    high_price DECIMAL;
    low_price DECIMAL;
    volume_count BIGINT;
    
    -- Base prices for each company (realistic current levels)
    base_prices JSONB := '{
        "RELIANCE": 2500,
        "TCS": 3400,
        "INFY": 1550,
        "HDFCBANK": 1550,
        "ICICIBANK": 950,
        "SBIN": 570,
        "LT": 3400,
        "ITC": 470,
        "HINDUNILVR": 2400,
        "ASIANPAINT": 3000,
        "BAJFINANCE": 6800,
        "BHARTIARTL": 1200,
        "KOTAKBANK": 1700,
        "MARUTI": 11000,
        "WIPRO": 420
    }';
BEGIN
    -- Clear existing stock data
    DELETE FROM stock_data;
    
    -- Loop through each company
    FOR company_record IN SELECT * FROM companies LOOP
        -- Get base price for this company
        prev_close := (base_prices ->> company_record.symbol)::DECIMAL;
        
        -- Generate 30 days of data
        FOR day_counter IN 0..29 LOOP
            current_date := base_date + day_counter;
            
            -- Skip weekends
            IF EXTRACT(dow FROM current_date) NOT IN (0, 6) THEN
                -- Generate open price (within 2% of previous close)
                open_price := prev_close * (0.98 + random() * 0.04);
                
                -- Generate close price (within 4% of open)
                close_price := open_price * (0.96 + random() * 0.08);
                
                -- Generate high (max of open/close + up to 3%)
                high_price := GREATEST(open_price, close_price) * (1 + random() * 0.03);
                
                -- Generate low (min of open/close - up to 3%)
                low_price := LEAST(open_price, close_price) * (0.97 + random() * 0.03);
                
                -- Generate volume (200k to 5M)
                volume_count := (200000 + random() * 4800000)::BIGINT;
                
                -- Round prices to 2 decimals
                open_price := ROUND(open_price, 2);
                close_price := ROUND(close_price, 2);
                high_price := ROUND(high_price, 2);
                low_price := ROUND(low_price, 2);
                
                -- Insert the data
                INSERT INTO stock_data (company_id, date, open, high, low, close, volume)
                VALUES (
                    company_record.id,
                    current_date,
                    open_price,
                    high_price,
                    low_price,
                    close_price,
                    volume_count
                );
                
                -- Update previous close for next iteration
                prev_close := close_price;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Generated stock data for % companies', (SELECT COUNT(*) FROM companies);
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate data
SELECT generate_stock_data();

-- Drop the function as it's no longer needed
DROP FUNCTION generate_stock_data();