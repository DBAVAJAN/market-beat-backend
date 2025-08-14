import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockCardProps {
  symbol: string;
  name: string;
  data: StockData[];
  onClick: () => void;
}

export const StockCard = ({ symbol, name, data, onClick }: StockCardProps) => {
  if (!data || data.length < 2) {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">{symbol}</CardTitle>
          <p className="text-xs text-muted-foreground truncate">{name}</p>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || 0;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;
  
  const isGain = change > 0;
  const isLoss = change < 0;
  const isNeutral = change === 0;

  const formatPrice = (price: number) => `₹${price.toFixed(2)}`;
  const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border bg-card hover:bg-accent/50"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium text-foreground">{symbol}</CardTitle>
            <p className="text-xs text-muted-foreground truncate">{name}</p>
          </div>
          {isGain && (
            <Badge variant="default" className="bg-gain text-gain-foreground">
              <TrendingUp className="w-3 h-3 mr-1" />
              {formatPercent(changePercent)}
            </Badge>
          )}
          {isLoss && (
            <Badge variant="default" className="bg-loss text-loss-foreground">
              <TrendingDown className="w-3 h-3 mr-1" />
              {formatPercent(changePercent)}
            </Badge>
          )}
          {isNeutral && (
            <Badge variant="default" className="bg-neutral text-neutral-foreground">
              <Minus className="w-3 h-3 mr-1" />
              {formatPercent(changePercent)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-foreground">
              {formatPrice(currentPrice)}
            </span>
            <span className={`text-sm font-medium ${
              isGain ? 'text-gain' : isLoss ? 'text-loss' : 'text-neutral'
            }`}>
              {formatChange(change)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Vol: {(data[data.length - 1]?.volume || 0).toLocaleString()}</span>
            <span>H: {formatPrice(data[data.length - 1]?.high || 0)}</span>
            <span>L: {formatPrice(data[data.length - 1]?.low || 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};