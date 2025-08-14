import { TrendingUp, TrendingDown, BarChart3, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockStatsProps {
  data: StockData[];
}

export function StockStats({ data }: StockStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-20" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const prices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  
  const highest = Math.max(...prices);
  const lowest = Math.min(...prices);
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);

  const formatVolume = (volume: number) => {
    if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
    if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  const stats = [
    {
      title: "Highest Price",
      value: `₹${highest.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-gain"
    },
    {
      title: "Lowest Price", 
      value: `₹${lowest.toFixed(2)}`,
      icon: TrendingDown,
      color: "text-loss"
    },
    {
      title: "Average Price",
      value: `₹${average.toFixed(2)}`,
      icon: BarChart3,
      color: "text-primary"
    },
    {
      title: "Total Volume",
      value: formatVolume(totalVolume),
      icon: Volume2,
      color: "text-muted-foreground"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-card hover:shadow-trading transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}