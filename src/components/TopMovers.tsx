import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { io } from "socket.io-client";

interface StockData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  up: boolean;
  volume: string;
  marketCap?: string;
  pe?: string;
}

const DEFAULT_MOVERS: StockData[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: "2945.00", change: "+₹32.50", changePercent: "+1.12%", up: true, volume: "2.4L" },
  { symbol: "TCS", name: "Tata Consultancy", price: "4120.00", change: "-₹14.20", changePercent: "-0.34%", up: false, volume: "1.1L" },
  { symbol: "INFY", name: "Infosys Ltd", price: "1890.00", change: "+₹14.60", changePercent: "+0.78%", up: true, volume: "3.2L" },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: "1720.00", change: "+₹9.60", changePercent: "+0.56%", up: true, volume: "5.8L" },
  { symbol: "ONGC", name: "Oil & Natural Gas", price: "298.00", change: "+₹4.26", changePercent: "+1.45%", up: true, volume: "8.1L" },
  { symbol: "WIPRO", name: "Wipro Ltd", price: "570.00", change: "-₹1.26", changePercent: "-0.22%", up: false, volume: "2.7L" },
];

const TopMovers = () => {
  const [movers, setMovers] = useState<StockData[]>(DEFAULT_MOVERS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);
    socket.on("top-movers", (data: StockData[]) => {
      if (data?.length) { setMovers(data.slice(0, 6)); setIsLive(true); }
    });
    // Fallback: also listen to market-update and compute locally
    socket.on("market-update", (data: any[]) => {
      if (!data?.length || isLive) return;
      const stocks = data.filter(q => !q.rawSymbol?.startsWith("^"));
      const sorted = [...stocks].sort((a, b) => Math.abs(parseFloat(b.changePercent)) - Math.abs(parseFloat(a.changePercent)));
      setMovers(sorted.slice(0, 6));
    });
    return () => { socket.disconnect(); };
  }, [isLive]);

  return (
    <section id="markets" className="border-t border-border bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground md:text-5xl">
              Top Movers
            </h2>
            <p className="mt-2 text-muted-foreground">Indian market's most active stocks today.</p>
          </div>
          <div className="hidden items-center gap-1 text-sm text-primary md:flex">
            <span className={`h-2 w-2 rounded-full ${isLive ? "animate-pulse bg-primary" : "bg-muted-foreground"}`} />
            {isLive ? "Live" : "Loading..."}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {movers.map((stock, i) => (
            <div key={i} className="card-hover rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{stock.symbol}</h3>
                  <p className="text-sm text-muted-foreground truncate max-w-[160px]">{stock.name}</p>
                </div>
                <div className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${stock.up ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"}`}>
                  {stock.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {stock.changePercent}
                </div>
              </div>

              {/* Mini sparkline */}
              <svg viewBox="0 0 200 50" className="w-full h-12 mb-3">
                <path
                  d={stock.up
                    ? "M0,40 Q20,35 40,30 T80,25 T120,15 T160,20 T200,10"
                    : "M0,15 Q20,20 40,25 T80,30 T120,35 T160,28 T200,40"}
                  fill="none"
                  stroke={stock.up ? "hsl(145,72%,46%)" : "hsl(0,72%,55%)"}
                  strokeWidth="2"
                />
              </svg>

              <div className="flex items-end justify-between">
                <span className="font-display text-2xl font-bold text-foreground">
                  ₹{parseFloat(stock.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <div className="text-right">
                  <span className={`text-sm font-medium ${stock.up ? "text-gain" : "text-loss"}`}>{stock.change}</span>
                  <p className="text-xs text-muted-foreground">Vol: {stock.volume}</p>
                </div>
              </div>

              {(stock.marketCap || stock.pe) && (
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                  {stock.marketCap && (
                    <div><p className="text-xs text-muted-foreground">Mkt Cap</p><p className="text-xs font-medium text-foreground">{stock.marketCap}</p></div>
                  )}
                  {stock.pe && (
                    <div><p className="text-xs text-muted-foreground">P/E</p><p className="text-xs font-medium text-foreground">{stock.pe}</p></div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopMovers;
