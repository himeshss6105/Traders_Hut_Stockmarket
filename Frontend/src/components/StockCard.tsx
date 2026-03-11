import { TrendingUp, TrendingDown } from "lucide-react";

interface StockCardProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  up: boolean;
  volume: string;
}

const StockCard = ({ symbol, name, price, change, changePercent, up, volume }: StockCardProps) => (
  <div className="card-hover rounded-lg border border-border bg-card p-5">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">{symbol}</h3>
        <p className="text-sm text-muted-foreground">{name}</p>
      </div>
      <div className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${up ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"}`}>
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {changePercent}
      </div>
    </div>
    <div className="mb-3">
      {/* Mini chart placeholder */}
      <svg viewBox="0 0 200 50" className="w-full h-12">
        <path
          d={up
            ? "M0,40 Q20,35 40,30 T80,25 T120,15 T160,20 T200,10"
            : "M0,15 Q20,20 40,25 T80,30 T120,35 T160,28 T200,40"
          }
          fill="none"
          stroke={up ? "hsl(145,72%,46%)" : "hsl(0,72%,55%)"}
          strokeWidth="2"
        />
      </svg>
    </div>
    <div className="flex items-end justify-between">
      <span className="font-display text-2xl font-bold text-foreground">${price}</span>
      <div className="text-right">
        <span className={`text-sm font-medium ${up ? "text-gain" : "text-loss"}`}>{change}</span>
        <p className="text-xs text-muted-foreground">Vol: {volume}</p>
      </div>
    </div>
  </div>
);

export default StockCard;
