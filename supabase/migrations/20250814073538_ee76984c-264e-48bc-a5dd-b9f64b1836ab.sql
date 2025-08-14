-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_data table
CREATE TABLE public.stock_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open DECIMAL(10,2) NOT NULL,
  high DECIMAL(10,2) NOT NULL,
  low DECIMAL(10,2) NOT NULL,
  close DECIMAL(10,2) NOT NULL,
  volume BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_stock_data_company_date ON public.stock_data(company_id, date DESC);
CREATE INDEX idx_stock_data_date ON public.stock_data(date DESC);

-- Insert sample companies
INSERT INTO public.companies (symbol, name) VALUES
  ('RELIANCE', 'Reliance Industries Limited'),
  ('TCS', 'Tata Consultancy Services'),
  ('HDFCBANK', 'HDFC Bank Limited'),
  ('ICICIBANK', 'ICICI Bank Limited'),
  ('HINDUNILVR', 'Hindustan Unilever Limited'),
  ('INFY', 'Infosys Limited'),
  ('ITC', 'ITC Limited'),
  ('SBIN', 'State Bank of India'),
  ('BHARTIARTL', 'Bharti Airtel Limited'),
  ('BAJFINANCE', 'Bajaj Finance Limited');

-- Enable Row Level Security (for future use)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_data ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (public read access)
CREATE POLICY "Allow public read access on companies" 
ON public.companies FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on stock_data" 
ON public.stock_data FOR SELECT 
USING (true);