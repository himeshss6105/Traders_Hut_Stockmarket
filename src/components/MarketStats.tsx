import { useEffect, useState } from "react";
import { Activity, BarChart3, Globe, Zap } from "lucide-react";
import { io } from "socket.io-client";

const DEFAULT_STATS = [
  { icon: Activity, label: "NIFTY 50", value: "24,500.00", changePercent: "+0.45%", up: true },
  { icon: BarChart3, label: "SENSEX", value: "80,200.00", changePercent: "+0.38%", up: true },
  { icon: Globe, label: "NIFTY BANK", value: "51,200.00", changePercent: "-0.12%", up: false },
  { icon: Zap, label: "NIFTY IT", value: "40,100.00", changePercent: "+0.56%", up: true },
];

const MarketStats = () => {
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);
    socket.on("market-update", (data: any[]) => {
      if (!data?.length) return;
      const indices = data.filter(q => q.rawSymbol?.startsWith("^")).slice(0, 2);
      if (indices.length > 0) {
        setStats(prev => prev.map((s, i) => {
          const q = indices[i];
          if (!q) return s;
          return {
            ...s,
            label: q.symbol,
            value: parseFloat(q.price).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            changePercent: q.changePercent,
            up: q.up
          };
        }));
      }
    });
    return () => { socket.disconnect(); };
  }, []);

  return (
    <section className="border-b border-border bg-card/50 py-6">
      <div className="container mx-auto grid grid-cols-2 gap-4 px-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-display font-bold text-foreground">{stat.value}</p>
              <p className={`text-xs font-medium ${stat.up ? "text-gain" : "text-loss"}`}>{stat.changePercent}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MarketStats;
