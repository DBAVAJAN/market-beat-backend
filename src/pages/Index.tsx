import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { StockChart } from "@/components/StockChart";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { StockHeader } from "@/components/StockHeader";
import { StockStats } from "@/components/StockStats";
import { TopNavigation } from "@/components/TopNavigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies">;

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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedStockData, setSelectedStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [fetchingRealTime, setFetchingRealTime] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isShowingCachedData, setIsShowingCachedData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("symbol");

      if (error) {
        console.error("Error fetching companies:", error);
        toast({
          title: "Error",
          description: "Failed to fetch companies",
          variant: "destructive",
        });
        return;
      }

      setCompanies(data || []);
      
      // Auto-select first company
      if (data && data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockDataForCompany = async (company: Company) => {
    setDataLoading(true);
    try {
      const { data: stockData, error } = await supabase
        .from("stock_data")
        .select("*")
        .eq("company_id", company.id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) {
        console.error(`Error fetching stock data for ${company.symbol}:`, error);
        setSelectedStockData([]);
        return;
      }

      const formattedData = stockData?.map(item => ({
        date: item.date,
        open: Number(item.open),
        high: Number(item.high), 
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume)
      })) || [];

      setSelectedStockData(formattedData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setSelectedStockData([]);
      toast({
        title: "Error",
        description: "Failed to fetch stock data",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const seedStockData = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-stock-data');
      
      if (error) {
        console.error("Error seeding data:", error);
        console.error("Error details:", error);
        toast({
          title: "Error",
          description: `Failed to seed stock data: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Seed response:", data);
      toast({
        title: "Success",
        description: data?.message || "Stock data seeded successfully",
      });

      // Refresh the current company's data
      if (selectedCompany) {
        await fetchStockDataForCompany(selectedCompany);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error", 
        description: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const fetchRealTimeData = async () => {
    setFetchingRealTime(true);
    setApiError(null);
    
    try {
      console.log('🔄 Attempting to fetch real-time data from Finnhub API...');
      
      const { data, error } = await supabase.functions.invoke('fetch-stock-data');
      
      if (error) {
        console.error("❌ Finnhub API Error:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          timestamp: new Date().toISOString()
        });
        
        // Set error state but don't show destructive toast - we'll show cached data
        setApiError(error.message || 'API request failed');
        setIsShowingCachedData(true);
        
        // Show warning toast instead of error
        toast({
          title: "API Temporarily Unavailable",
          description: "Showing last cached data. Will retry automatically.",
          variant: "default",
        });
        
        // Still refresh current company data from cache
        if (selectedCompany) {
          await fetchStockDataForCompany(selectedCompany);
        }
        return;
      }

      console.log("✅ Real-time data fetched successfully:", data);
      setLastUpdate(new Date());
      setIsShowingCachedData(false);
      setApiError(null);
      
      toast({
        title: "Real-time Data Updated",
        description: data?.message || "Live market data refreshed successfully",
      });

      // Refresh the current company's data
      if (selectedCompany) {
        await fetchStockDataForCompany(selectedCompany);
      }
    } catch (error) {
      console.error("💥 Network/Connection Error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      setApiError(error instanceof Error ? error.message : 'Network error');
      setIsShowingCachedData(true);
      
      toast({
        title: "Connection Error", 
        description: "Network issue detected. Showing cached data.",
        variant: "default",
      });
      
      // Still try to show cached data
      if (selectedCompany) {
        await fetchStockDataForCompany(selectedCompany);
      }
    } finally {
      setFetchingRealTime(false);
    }
  };

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company);
    await fetchStockDataForCompany(company);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  };

  const handleMenuToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchStockDataForCompany(selectedCompany);
    }
  }, [selectedCompany]);

  // Auto-refresh real-time data every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Initial real-time data fetch
  useEffect(() => {
    if (companies.length > 0) {
      fetchRealTimeData();
    }
  }, [companies]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 animate-glow">
            <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Market Beat</h2>
          <p className="text-muted-foreground">Loading premium market data...</p>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center max-w-md mx-auto animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">No Companies Available</h2>
          <p className="text-muted-foreground mb-6">
            It seems like there are no companies in the database. Please ensure the database migration has been completed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Cache Data Banner */}
      {isShowingCachedData && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                📊 Showing cached data - API temporarily unavailable
              </span>
              {lastUpdate && (
                <span className="text-xs opacity-70">
                  (Last updated: {lastUpdate.toLocaleTimeString()})
                </span>
              )}
            </div>
            <button
              onClick={() => setIsShowingCachedData(false)}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <TopNavigation
        onMenuToggle={handleMenuToggle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Sidebar */}
      <DashboardSidebar
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanySelect={handleCompanySelect}
        isLoading={loading}
        isCollapsed={sidebarCollapsed}
        onToggle={handleMenuToggle}
        searchQuery={searchQuery}
      />

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isShowingCachedData ? "pt-20" : "pt-16", // Account for cache banner
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-80"
      )}>
        <div className="p-4 lg:p-8">
          {/* Header with refresh buttons */}
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Premium Dashboard
              </h1>
              <p className="text-muted-foreground">
                Real-time market data via Finnhub API
                {lastUpdate && !isShowingCachedData && (
                  <span className="ml-2 text-xs opacity-60">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                {isShowingCachedData && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                    (Cached data - API issue detected)
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchRealTimeData} 
                disabled={fetchingRealTime}
                variant="outline"
                size="sm"
                className="border-primary/20 hover:border-primary/40"
              >
                {fetchingRealTime ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {fetchingRealTime ? "Fetching..." : "Real-time Data"}
              </Button>
              <Button 
                onClick={seedStockData} 
                disabled={seeding}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-hover"
              >
                {seeding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {seeding ? "Generating..." : "Mock Data"}
              </Button>
            </div>
          </div>

          {selectedCompany ? (
            <div className="space-y-6">
              {/* Stock Header */}
              <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                <StockHeader company={selectedCompany} data={selectedStockData} />
              </div>

              {/* Main Chart and Stats Section */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
                  {dataLoading ? (
                    <div className="h-96 bg-gradient-card border rounded-xl flex items-center justify-center shadow-card">
                      <div className="text-center animate-fade-in">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                        <p className="text-muted-foreground">Loading premium chart data...</p>
                      </div>
                    </div>
                  ) : selectedStockData.length > 0 ? (
                    <StockChart
                      symbol={selectedCompany.symbol}
                      name={selectedCompany.name}
                      data={selectedStockData}
                    />
                  ) : (
                    <div className="h-96 bg-gradient-card border rounded-xl flex items-center justify-center shadow-card">
                      <div className="text-center animate-fade-in">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center mx-auto mb-4">
                          <span className="text-xl">📈</span>
                        </div>
                        <p className="text-muted-foreground mb-4">No stock data available for {selectedCompany.symbol}</p>
                        <Button 
                          onClick={seedStockData} 
                          disabled={seeding} 
                          size="sm"
                          className="bg-gradient-to-r from-primary to-primary/90"
                        >
                          {seeding ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Generate Data
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Section */}
                <div className="xl:col-span-1 animate-fade-in" style={{ animationDelay: "300ms" }}>
                  <StockStats data={selectedStockData} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-gradient-card border rounded-xl flex items-center justify-center shadow-card animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👆</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Select a Company</h3>
                <p className="text-muted-foreground">Choose a company from the sidebar to view premium analytics</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;