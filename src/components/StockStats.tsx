import { TrendingUp, TrendingDown, BarChart3, Volume2, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-gradient-card shadow-card">
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
  
  // Calculate price change percentage
  const latestPrice = prices[0];
  const previousPrice = prices[1];
  const priceChange = previousPrice ? ((latestPrice - previousPrice) / previousPrice) * 100 : 0;

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
      gradient: "bg-gradient-to-br from-emerald-500/10 to-green-500/10",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      emoji: "📈"
    },
    {
      title: "Lowest Price", 
      value: `₹${lowest.toFixed(2)}`,
      icon: TrendingDown,
      gradient: "bg-gradient-to-br from-red-500/10 to-rose-500/10",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
      emoji: "📉"
    },
    {
      title: "Average Price",
      value: `₹${average.toFixed(2)}`,
      icon: BarChart3,
      gradient: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
      emoji: "💹"
    },
    {
      title: "Price Change %",
      value: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`,
      icon: Percent,
      gradient: priceChange >= 0 
        ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10"
        : "bg-gradient-to-br from-red-500/10 to-rose-500/10",
      iconColor: priceChange >= 0 ? "text-emerald-600" : "text-red-600",
      borderColor: priceChange >= 0 ? "border-emerald-200" : "border-red-200",
      emoji: "🔄"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`group hover:shadow-hover transition-all duration-300 cursor-pointer border ${stat.borderColor} ${stat.gradient} hover:scale-105 animate-fade-in`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              <span className="mr-2">{stat.emoji}</span>
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconColor} group-hover:scale-110 transition-transform duration-300`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.iconColor} group-hover:text-foreground transition-colors duration-300`}>
              {stat.value}
            </div>
            {stat.title === "Price Change %" && (
              <Badge 
                variant={priceChange >= 0 ? "default" : "destructive"} 
                className="mt-2 text-xs"
              >
                {priceChange >= 0 ? "Bullish" : "Bearish"}
              </Badge>
            )}
            {stat.title === "Average Price" && (
              <p className="text-xs text-muted-foreground mt-1">
                Total Volume: {formatVolume(totalVolume)}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}