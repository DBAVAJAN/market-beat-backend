import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

interface MarketStats {
  totalCompanies: number;
  gainers: number;
  losers: number;
  totalVolume: number;
  averageChange: number;
}

interface MarketOverviewProps {
  stats: MarketStats;
}

export const MarketOverview = ({ stats }: MarketOverviewProps) => {
  const formatVolume = (volume: number) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}Cr`;
    }
    if (volume >= 100000) {
      return `${(volume / 100000).toFixed(1)}L`;
    }
    return volume.toLocaleString();
  };

  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Companies
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalCompanies}</div>
          <p className="text-xs text-muted-foreground">
            Active stocks
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gainers
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-gain" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gain">{stats.gainers}</div>
          <p className="text-xs text-muted-foreground">
            Stocks up today
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Losers
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-loss" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-loss">{stats.losers}</div>
          <p className="text-xs text-muted-foreground">
            Stocks down today
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Volume
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatVolume(stats.totalVolume)}</div>
          <p className="text-xs text-muted-foreground">
            Trading volume
          </p>
        </CardContent>
      </Card>
    </div>
  );
};