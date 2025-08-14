import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

interface StockChartProps {
  symbol: string;
  name: string;
  data: StockData[];
}

export const StockChart = ({ symbol, name, data }: StockChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{symbol} - {name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || data[0]?.close || 0;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;
  
  const isGain = change > 0;
  const isLoss = change < 0;
  const isNeutral = change === 0;

  const formatPrice = (price: number) => `₹${price.toFixed(2)}`;
  const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">Open: {formatPrice(data.open)}</p>
            <p className="text-muted-foreground">High: {formatPrice(data.high)}</p>
            <p className="text-muted-foreground">Low: {formatPrice(data.low)}</p>
            <p className="text-foreground font-medium">Close: {formatPrice(data.close)}</p>
            <p className="text-muted-foreground">Volume: {data.volume.toLocaleString()}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">{symbol}</CardTitle>
            <p className="text-sm text-muted-foreground">{name}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(currentPrice)}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  isGain ? 'text-gain' : isLoss ? 'text-loss' : 'text-neutral'
                }`}>
                  {formatChange(change)}
                </span>
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
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke={isGain ? "hsl(var(--gain))" : isLoss ? "hsl(var(--loss))" : "hsl(var(--neutral))"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};