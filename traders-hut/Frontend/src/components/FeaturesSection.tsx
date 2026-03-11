import { BarChart3, Bell, LineChart, Shield, Smartphone, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Real-Time Data",
    desc: "Sub-second market data streaming. Never miss a price movement with our ultra-low latency feed.",
  },
  {
    icon: LineChart,
    title: "Advanced Charts",
    desc: "Professional-grade charting with 50+ technical indicators and drawing tools.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    desc: "Set custom price alerts and get notified instantly across all your devices.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    desc: "Bank-grade encryption with 99.99% uptime. Your data is always protected.",
  },
  {
    icon: BarChart3,
    title: "Portfolio Tracking",
    desc: "Track your entire portfolio performance with detailed P&L breakdowns.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    desc: "Full trading experience on any device. Trade from anywhere, anytime.",
  },
];

const FeaturesSection = () => (
  <section className="py-20 md:py-28">
    <div className="container mx-auto px-4">
      <div className="mb-14 text-center">
        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground md:text-5xl">
          Built For <span className="text-primary">Serious</span> Traders
        </h2>
        <p className="mt-4 text-muted-foreground">
          Everything you need to dominate the markets, in one platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card-hover group rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-xl font-bold text-foreground">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
