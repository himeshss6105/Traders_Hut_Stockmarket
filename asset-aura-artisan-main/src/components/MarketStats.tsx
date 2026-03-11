import { Activity, BarChart3, Globe, Zap } from "lucide-react";

const stats = [
  { icon: Activity, label: "S&P 500", value: "5,234.18", change: "+0.82%", up: true },
  { icon: BarChart3, label: "NASDAQ", value: "16,428.82", change: "+1.24%", up: true },
  { icon: Globe, label: "DOW JONES", value: "39,512.84", change: "-0.12%", up: false },
  { icon: Zap, label: "RUSSELL 2000", value: "2,078.36", change: "+0.56%", up: true },
];

const MarketStats = () => (
  <section className="border-b border-border bg-card/50 py-6">
    <div className="container mx-auto grid grid-cols-2 gap-4 px-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <stat.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="font-display font-bold text-foreground">{stat.value}</p>
            <p className={`text-xs font-medium ${stat.up ? "text-gain" : "text-loss"}`}>{stat.change}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default MarketStats;
