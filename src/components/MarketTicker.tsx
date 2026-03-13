import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

interface TickerStock {
  symbol: string;
  price: string;
  changePercent: string;
  up: boolean;
}

const MarketTicker = () => {
  const [stocks, setStocks] = useState<TickerStock[]>([
    { symbol: "NIFTY 50", price: "24,500.00", changePercent: "+0.45%", up: true },
    { symbol: "SENSEX", price: "80,200.00", changePercent: "+0.38%", up: true },
    { symbol: "RELIANCE", price: "2,945.00", changePercent: "+1.12%", up: true },
    { symbol: "TCS", price: "4,120.00", changePercent: "-0.34%", up: false },
    { symbol: "INFY", price: "1,890.00", changePercent: "+0.78%", up: true },
    { symbol: "HDFCBANK", price: "1,720.00", changePercent: "+0.56%", up: true },
    { symbol: "WIPRO", price: "570.00", changePercent: "-0.22%", up: false },
    { symbol: "ONGC", price: "298.00", changePercent: "+1.45%", up: true },
  ]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);
    socket.on("market-update", (data: any[]) => {
      if (data && data.length > 0) setStocks(data);
    });
    return () => { socket.disconnect(); };
  }, []);

  const items = [...stocks, ...stocks];

  return (
    <div className="w-full overflow-hidden border-y border-border bg-muted/50 py-3">
      <div className="ticker-scroll flex w-max gap-8">
        {items.map((stock, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-display font-bold text-foreground">{stock.symbol}</span>
            <span className="text-muted-foreground">₹{parseFloat(stock.price).toLocaleString("en-IN")}</span>
            <span className={`font-medium ${stock.up ? "text-gain" : "text-loss"}`}>
              {stock.changePercent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
