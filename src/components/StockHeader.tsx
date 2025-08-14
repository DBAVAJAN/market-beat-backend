import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies">;

interface StockHeaderProps {
  company: Company;
  data: StockData[];
}

export function StockHeader({ company, data }: StockHeaderProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 mb-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">Symbol: {company.symbol}</p>
          <p className="text-sm text-muted-foreground">No price data available</p>
        </div>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sortedData[0];
  const previous = sortedData[1];
  
  const change = previous ? latest.close - previous.close : 0;
  const changePercent = previous ? ((change / previous.close) * 100) : 0;
  
  const getChangeColor = () => {
    if (change > 0) return "text-gain";
    if (change < 0) return "text-loss";
    return "text-neutral";
  };

  const getChangeIcon = () => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getBadgeVariant = () => {
    if (change > 0) return "default";
    if (change < 0) return "destructive";
    return "secondary";
  };

  return (
    <Card className="p-6 mb-6 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <Badge variant="outline" className="font-mono">
              {company.symbol}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(latest.date).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex flex-col items-start lg:items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">
              ₹{latest.close.toFixed(2)}
            </span>
          </div>
          
          <div className={`flex items-center gap-2 ${getChangeColor()}`}>
            {getChangeIcon()}
            <Badge variant={getBadgeVariant()} className="font-mono">
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}