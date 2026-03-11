import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { Search, Plus, X, TrendingUp, TrendingDown, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API = "http://localhost:5000/api";
const PERIODS = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"];

export default function ChartPage() {
  const { symbol: paramSymbol } = useParams();
  const navigate = useNavigate();
  const { user, token, addToWatchlist, removeFromWatchlist } = useAuth();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const [activeSymbol, setActiveSymbol] = useState(paramSymbol || "RELIANCE.NS");
  const [period, setPeriod] = useState("1y");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [localWatchlist, setLocalWatchlist] = useState<string[]>(
    user?.watchlist || ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"]
  );

  // Init chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#0f1117" }, textColor: "#9ca3af" },
      grid: { vertLines: { color: "#1f2937" }, horzLines: { color: "#1f2937" } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#1f2937" },
      timeScale: { borderColor: "#1f2937", timeVisible: true },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 500,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", downColor: "#ef4444",
      borderUpColor: "#22c55e", borderDownColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    });
    observer.observe(chartContainerRef.current);
    return () => { observer.disconnect(); chart.remove(); };
  }, []);

  // Load candle data
  const loadChart = useCallback(async (sym: string, per: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/history/${sym}?period=${per}`);
      const data = await res.json();
      if (data.candles && seriesRef.current) {
        seriesRef.current.setData(data.candles);
        chartRef.current?.timeScale().fitContent();
      }
    } catch { toast.error("Failed to load chart data"); }
    setLoading(false);
  }, []);

  // Load quote
  const loadQuote = useCallback(async (sym: string) => {
    try {
      const res = await fetch(`${API}/quote/${sym}`);
      const data = await res.json();
      if (!data.error) setQuote(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadChart(activeSymbol, period);
    loadQuote(activeSymbol);
  }, [activeSymbol, period]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Load watchlist prices
  useEffect(() => {
    const wl = user?.watchlist || localWatchlist;
    if (!wl.length) return;
    Promise.allSettled(wl.map((s) => fetch(`${API}/quote/${s}`).then((r) => r.json())))
      .then((results) => {
        const data = results.map((r, i) => {
          if (r.status === "fulfilled" && r.value.price) return r.value;
          return { symbol: wl[i], name: wl[i], price: null };
        });
        setWatchlistData(data);
      });
  }, [user?.watchlist, localWatchlist, activeSymbol]);

  const selectSymbol = (sym: string) => {
    setActiveSymbol(sym);
    navigate(`/chart/${sym}`);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddToWatchlist = async (sym: string) => {
    if (user) {
      await addToWatchlist(sym);
      toast.success(`${sym} added to watchlist`);
    } else {
      if (!localWatchlist.includes(sym)) {
        setLocalWatchlist([...localWatchlist, sym]);
        toast.success(`${sym} added`);
      }
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemove = async (sym: string) => {
    if (user) { await removeFromWatchlist(sym); }
    else { setLocalWatchlist(localWatchlist.filter((s) => s !== sym)); }
  };

  const isInWatchlist = (sym: string) => (user?.watchlist || localWatchlist).includes(sym);

  const displayName = quote?.name || activeSymbol.replace(".NS", "").replace(".BO", "");
  const isUp = (quote?.changePercent || 0) >= 0;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Main Chart Area ── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Chart Header */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-card">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-foreground">{displayName}</h2>
                <span className="text-xs text-muted-foreground">{activeSymbol}</span>
              </div>
              {quote && (
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="font-display text-2xl font-bold text-foreground">
                    ₹{Number(quote.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-green-500" : "text-red-500"}`}>
                    {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {isUp ? "+" : ""}{quote.change?.toFixed(2)} ({isUp ? "+" : ""}{quote.changePercent?.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-1 ml-auto">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant={isInWatchlist(activeSymbol) ? "secondary" : "outline"}
              onClick={() => isInWatchlist(activeSymbol) ? handleRemove(activeSymbol) : handleAddToWatchlist(activeSymbol)}
              className="ml-2 gap-1"
            >
              <Star className={`h-3.5 w-3.5 ${isInWatchlist(activeSymbol) ? "fill-primary text-primary" : ""}`} />
              {isInWatchlist(activeSymbol) ? "Watching" : "Watch"}
            </Button>
          </div>

          {/* Chart */}
          <div className="relative flex-1">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full" />
          </div>

          {/* Stock Details Bar */}
          {quote && (
            <div className="flex gap-6 px-4 py-2 border-t border-border bg-card/50 text-xs text-muted-foreground overflow-x-auto">
              {[
                ["Open", `₹${Number(quote.open).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["High", `₹${Number(quote.high).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["Low", `₹${Number(quote.low).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["52W High", `₹${Number(quote.fiftyTwoWeekHigh).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["52W Low", `₹${Number(quote.fiftyTwoWeekLow).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["Volume", quote.volume?.toLocaleString("en-IN")],
                ["P/E", quote.pe?.toFixed(2) || "N/A"],
              ].map(([label, val]) => (
                <div key={label} className="flex flex-col whitespace-nowrap">
                  <span>{label}</span>
                  <span className="text-foreground font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Sidebar – Watchlist ── */}
        <div className="w-72 flex flex-col border-l border-border bg-card overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NSE/BSE stocks..."
                className="pl-9 bg-background border-border text-sm h-9"
              />
            </div>

            {/* Search results dropdown */}
            {(searchResults.length > 0 || searching) && searchQuery && (
              <div className="mt-1 rounded-lg border border-border bg-background shadow-xl z-20 max-h-64 overflow-y-auto">
                {searching && <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>}
                {searchResults.map((r) => (
                  <div key={r.symbol} className="flex items-center justify-between px-3 py-2 hover:bg-secondary cursor-pointer group">
                    <div onClick={() => selectSymbol(r.symbol)} className="flex-1">
                      <p className="text-sm font-medium text-foreground">{r.symbol.replace(".NS", "").replace(".BO", "")}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.name}</p>
                    </div>
                    <button
                      onClick={() => handleAddToWatchlist(r.symbol)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Watchlist header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Watchlist</span>
            {!user && <span className="text-xs text-muted-foreground">Sign in to save</span>}
          </div>

          {/* Watchlist items */}
          <div className="flex-1 overflow-y-auto">
            {(user?.watchlist || localWatchlist).map((sym) => {
              const data = watchlistData.find((d) => d.symbol === sym);
              const up = (data?.changePercent || 0) >= 0;
              const isActive = sym === activeSymbol;
              return (
                <div
                  key={sym}
                  onClick={() => selectSymbol(sym)}
                  className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-secondary/50 border-b border-border/50 group transition-colors ${
                    isActive ? "bg-primary/10 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                      {sym.replace(".NS", "").replace(".BO", "")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{data?.name || "Loading..."}</p>
                  </div>
                  <div className="text-right ml-2">
                    {data?.price ? (
                      <>
                        <p className="text-sm font-medium text-foreground">
                          ₹{Number(data.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs font-medium ${up ? "text-green-500" : "text-red-500"}`}>
                          {up ? "+" : ""}{data.changePercent?.toFixed(2)}%
                        </p>
                      </>
                    ) : <p className="text-xs text-muted-foreground">Loading</p>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(sym); }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {(user?.watchlist || localWatchlist).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Star className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Search and add stocks to your watchlist</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
