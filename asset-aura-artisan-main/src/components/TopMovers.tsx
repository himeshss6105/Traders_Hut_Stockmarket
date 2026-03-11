import StockCard from "./StockCard";

const movers = [
  { symbol: "NVDA", name: "NVIDIA Corp", price: "875.28", change: "+$28.96", changePercent: "+3.42%", up: true, volume: "42.1M" },
  { symbol: "AAPL", name: "Apple Inc", price: "189.84", change: "+$2.31", changePercent: "+1.23%", up: true, volume: "58.3M" },
  { symbol: "AMZN", name: "Amazon.com", price: "178.25", change: "+$3.76", changePercent: "+2.15%", up: true, volume: "33.7M" },
  { symbol: "META", name: "Meta Platforms", price: "505.75", change: "+$9.41", changePercent: "+1.89%", up: true, volume: "21.5M" },
  { symbol: "TSLA", name: "Tesla Inc", price: "248.42", change: "-$3.94", changePercent: "-1.56%", up: false, volume: "67.2M" },
  { symbol: "GOOGL", name: "Alphabet Inc", price: "141.56", change: "-$0.48", changePercent: "-0.34%", up: false, volume: "28.9M" },
];

const TopMovers = () => (
  <section className="border-t border-border bg-muted/30 py-20">
    <div className="container mx-auto px-4">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground md:text-5xl">
            Top Movers
          </h2>
          <p className="mt-2 text-muted-foreground">Today's most active stocks by volume and price change.</p>
        </div>
        <div className="hidden items-center gap-1 text-sm text-primary md:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Live
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {movers.map((stock) => (
          <StockCard key={stock.symbol} {...stock} />
        ))}
      </div>
    </div>
  </section>
);

export default TopMovers;
