import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StockCard } from "@/components/StockCard";
import { StockChart } from "@/components/StockChart";
import { MarketOverview } from "@/components/MarketOverview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BarChart3, RefreshCw } from "lucide-react";

interface Company {
  id: number;
  name: string;
  symbol: string;
}

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CompanyWithData {
  company: Company;
  data: StockData[];
}

const Index = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesWithData, setCompaniesWithData] = useState<CompanyWithData[]>([]);
  const [selectedStock, setSelectedStock] = useState<CompanyWithData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('symbol');

    if (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
      return;
    }

    setCompanies(data || []);
  };

  const fetchStockData = async () => {
    if (companies.length === 0) return;

    const promises = companies.map(async (company) => {
      const { data, error } = await supabase
        .from('stock_data')
        .select('*')
        .eq('company_id', company.id)
        .order('date', { ascending: true });

      if (error) {
        console.error(`Error fetching stock data for ${company.symbol}:`, error);
        return { company, data: [] };
      }

      return { company, data: data || [] };
    });

    const results = await Promise.all(promises);
    setCompaniesWithData(results);
    
    // Set first stock with data as selected by default
    const firstWithData = results.find(item => item.data.length > 0);
    if (firstWithData && !selectedStock) {
      setSelectedStock(firstWithData);
    }
  };

  const seedStockData = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-stock-data');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Stock data seeded successfully",
      });
      
      // Refresh data after seeding
      await fetchStockData();
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: "Error",
        description: "Failed to seed stock data",
        variant: "destructive",
      });
    }
    setSeeding(false);
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchCompanies();
      setLoading(false);
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      fetchStockData();
    }
  }, [companies]);

  const calculateMarketStats = () => {
    let gainers = 0;
    let losers = 0;
    let totalVolume = 0;
    let totalChange = 0;
    let validCompanies = 0;

    companiesWithData.forEach(({ data }) => {
      if (data.length >= 2) {
        const current = data[data.length - 1];
        const previous = data[data.length - 2];
        const change = current.close - previous.close;
        
        if (change > 0) gainers++;
        else if (change < 0) losers++;
        
        totalVolume += current.volume;
        totalChange += (change / previous.close) * 100;
        validCompanies++;
      }
    });

    return {
      totalCompanies: companies.length,
      gainers,
      losers,
      totalVolume,
      averageChange: validCompanies > 0 ? totalChange / validCompanies : 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading stock market data...</p>
        </div>
      </div>
    );
  }

  const hasData = companiesWithData.some(item => item.data.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Indian Stock Market</h1>
                <p className="text-sm text-muted-foreground">Live market dashboard</p>
              </div>
            </div>
            <Button 
              onClick={seedStockData} 
              disabled={seeding}
              variant="outline"
              className="gap-2"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {seeding ? 'Seeding...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {!hasData ? (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">No Stock Data Available</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Click the button below to generate sample stock data for the last 30 days.
              </p>
              <Button 
                onClick={seedStockData} 
                disabled={seeding}
                className="w-full gap-2"
              >
                {seeding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                {seeding ? 'Generating Data...' : 'Generate Stock Data'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Market Overview */}
            <MarketOverview stats={calculateMarketStats()} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Stock Grid */}
              <div className="xl:col-span-1">
                <h2 className="text-lg font-semibold text-foreground mb-4">Stocks</h2>
                <div className="grid grid-cols-1 gap-3">
                  {companiesWithData.map(({ company, data }) => (
                    <StockCard
                      key={company.id}
                      symbol={company.symbol}
                      name={company.name}
                      data={data}
                      onClick={() => setSelectedStock({ company, data })}
                    />
                  ))}
                </div>
              </div>

              {/* Chart Area */}
              <div className="xl:col-span-2">
                {selectedStock ? (
                  <StockChart
                    symbol={selectedStock.company.symbol}
                    name={selectedStock.company.name}
                    data={selectedStock.data}
                  />
                ) : (
                  <Card className="w-full h-96 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a stock to view its chart</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
