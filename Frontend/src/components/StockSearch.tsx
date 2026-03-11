import { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

interface SearchResult {
  symbol: string;
  display: string;
  name: string;
  exchange: string;
  isIndian: boolean;
}

interface StockQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  up: boolean;
  volume: string;
  dayHigh: string;
  dayLow: string;
  open: string;
  prevClose: string;
  marketCap: string;
  pe: string;
  week52High: string;
  week52Low: string;
}

const API = "http://localhost:5000/api";

const StockSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setShowDropdown(true);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const selectStock = async (result: SearchResult) => {
    setShowDropdown(false);
    setQuery(result.display);
    setLoadingQuote(true);
    try {
      const res = await fetch(`${API}/quote/${encodeURIComponent(result.symbol)}`);
      const data = await res.json();
      if (!data.error) setSelectedStock(data);
    } catch {}
    finally { setLoadingQuote(false); }
  };

  return (
    <section id="search" className="py-16 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground mb-2">
            Search Any Stock
          </h2>
          <p className="text-muted-foreground">Real-time data for all Indian market stocks</p>
        </div>

        <div className="max-w-2xl mx-auto" ref={containerRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />}
            <input
              type="text"
              placeholder="Search stocks by name or symbol... (e.g. RELIANCE, TCS, Infosys)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              className="w-full pl-12 pr-12 py-4 text-base bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />

            {/* Dropdown */}
            {showDropdown && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                {results.map((r, i) => (
                  <button key={i} onMouseDown={() => selectStock(r)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-primary shrink-0">
                        {r.display.slice(0,2)}
                      </div>
                      <div>
                        <p className="font-display font-bold text-foreground text-sm">{r.display}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[280px]">{r.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.isIndian && (
                        <span className="text-xs bg-gain/10 text-gain px-2 py-0.5 rounded font-medium">🇮🇳</span>
                      )}
                      <span className="text-xs text-muted-foreground">{r.exchange}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stock Quote Card */}
        {loadingQuote && (
          <div className="max-w-2xl mx-auto mt-6 flex justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {selectedStock && !loadingQuote && (
          <div className="max-w-2xl mx-auto mt-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-3xl font-extrabold text-foreground">
                    {selectedStock.symbol.replace(".NS","").replace(".BO","")}
                  </h3>
                  <p className="text-muted-foreground">{selectedStock.name}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                  selectedStock.up ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"}`}>
                  {selectedStock.up ? <TrendingUp className="h-4 w-4"/> : <TrendingDown className="h-4 w-4"/>}
                  {selectedStock.changePercent}
                </div>
              </div>

              <div className="mb-6">
                <span className="font-display text-5xl font-extrabold text-foreground">
                  ₹{parseFloat(selectedStock.price).toLocaleString("en-IN", {minimumFractionDigits:2})}
                </span>
                <span className={`ml-3 text-lg font-medium ${selectedStock.up ? "text-gain" : "text-loss"}`}>
                  {selectedStock.change}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ["Open",       `₹${selectedStock.open}`],
                  ["Prev Close", `₹${selectedStock.prevClose}`],
                  ["Day High",   `₹${selectedStock.dayHigh}`],
                  ["Day Low",    `₹${selectedStock.dayLow}`],
                  ["Volume",     selectedStock.volume],
                  ["Market Cap", selectedStock.marketCap],
                  ["P/E Ratio",  selectedStock.pe || "N/A"],
                  ["52W High",   `₹${selectedStock.week52High}`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-display font-bold text-foreground text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StockSearch;
