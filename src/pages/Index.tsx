import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { StockChart } from "@/components/StockChart";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { StockHeader } from "@/components/StockHeader";
import { StockStats } from "@/components/StockStats";
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
        toast({
          title: "Error",
          description: "Failed to seed stock data",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Stock data seeded successfully",
      });

      // Refresh the current company's data
      if (selectedCompany) {
        await fetchStockDataForCompany(selectedCompany);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error", 
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company);
    await fetchStockDataForCompany(company);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchStockDataForCompany(selectedCompany);
    }
  }, [selectedCompany]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">No Companies Available</h2>
          <p className="text-muted-foreground mb-6">
            It seems like there are no companies in the database. Please ensure the database migration has been completed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanySelect={handleCompanySelect}
        isLoading={loading}
      />

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out lg:ml-80",
        "min-h-screen"
      )}>
        <div className="p-4 lg:p-8">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Stock Market Dashboard</h1>
              <p className="text-muted-foreground">Real-time market overview and analysis</p>
            </div>
            <Button 
              onClick={seedStockData} 
              disabled={seeding}
              variant="outline"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {seeding ? "Generating..." : "Refresh Data"}
            </Button>
          </div>

          {selectedCompany ? (
            <div className="space-y-6">
              {/* Stock Header */}
              <StockHeader company={selectedCompany} data={selectedStockData} />

              {/* Main Chart Section */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  {dataLoading ? (
                    <div className="h-96 bg-card border rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading chart data...</p>
                      </div>
                    </div>
                  ) : selectedStockData.length > 0 ? (
                    <StockChart
                      symbol={selectedCompany.symbol}
                      name={selectedCompany.name}
                      data={selectedStockData}
                    />
                  ) : (
                    <div className="h-96 bg-card border rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">No stock data available for {selectedCompany.symbol}</p>
                        <Button onClick={seedStockData} disabled={seeding} size="sm">
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
                <div className="xl:col-span-1">
                  <StockStats data={selectedStockData} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-card border rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Select a company from the sidebar to view stock data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;