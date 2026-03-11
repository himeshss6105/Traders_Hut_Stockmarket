const stocks = [
  { symbol: "AAPL", price: "189.84", change: "+1.23%", up: true },
  { symbol: "MSFT", price: "378.91", change: "+0.87%", up: true },
  { symbol: "GOOGL", price: "141.56", change: "-0.34%", up: false },
  { symbol: "AMZN", price: "178.25", change: "+2.15%", up: true },
  { symbol: "NVDA", price: "875.28", change: "+3.42%", up: true },
  { symbol: "TSLA", price: "248.42", change: "-1.56%", up: false },
  { symbol: "META", price: "505.75", change: "+1.89%", up: true },
  { symbol: "JPM", price: "196.32", change: "+0.45%", up: false },
  { symbol: "V", price: "278.15", change: "+0.92%", up: true },
  { symbol: "BRK.B", price: "412.80", change: "+0.33%", up: true },
];

const MarketTicker = () => {
  const items = [...stocks, ...stocks];

  return (
    <div className="w-full overflow-hidden border-y border-border bg-muted/50 py-3">
      <div className="ticker-scroll flex w-max gap-8">
        {items.map((stock, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-display font-bold text-foreground">{stock.symbol}</span>
            <span className="text-muted-foreground">${stock.price}</span>
            <span className={stock.up ? "text-gain font-medium" : "text-loss font-medium"}>
              {stock.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
