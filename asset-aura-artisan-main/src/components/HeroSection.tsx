import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => (
  <section className="hero-gradient relative overflow-hidden py-20 md:py-32">
    {/* Background grid pattern */}
    <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
      backgroundSize: '60px 60px'
    }} />
    
    <div className="container relative mx-auto px-4 text-center">
      <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gain" />
        <span className="text-sm text-muted-foreground">Markets are live</span>
      </div>

      <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-foreground md:text-7xl lg:text-8xl">
        Master The
        <span className="text-primary"> Market</span>
        <br />
        In Real Time
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        Track every tick, spot trends before they move, and make data-driven decisions with institutional-grade analytics.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button size="lg" className="gap-2 bg-primary font-display font-bold text-primary-foreground hover:bg-primary/90">
          Start Trading <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="lg" variant="outline" className="gap-2 border-border font-display font-bold text-foreground hover:bg-secondary">
          <TrendingUp className="h-4 w-4" /> View Markets
        </Button>
      </div>

      {/* Floating stats */}
      <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6">
        {[
          { label: "Daily Volume", value: "$8.2B+" },
          { label: "Active Traders", value: "120K+" },
          { label: "Uptime", value: "99.99%" },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HeroSection;
