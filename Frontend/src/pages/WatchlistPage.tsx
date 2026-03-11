import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, TrendingUp, TrendingDown, X, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API = "http://localhost:5000/api";

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { user, addToWatchlist, removeFromWatchlist } = useAuth();

  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [localWatchlist, setLocalWatchlist] = useState<string[]>(
    user?.watchlist || ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BAJFINANCE.NS"]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentList = user?.watchlist || localWatchlist;

  useEffect(() => {
    if (!currentList.length) { setLoading(false); return; }
    setLoading(true);
    Promise.allSettled(currentList.map((s) => fetch(`${API}/quote/${s}`).then((r) => r.json())))
      .then((results) => {
        const data = results.map((r, i) => {
          if (r.status === "fulfilled" && r.value.price) return r.value;
          return { symbol: currentList[i], name: currentList[i], price: null };
        });
        setWatchlistData(data);
        setLoading(false);
      });
  }, [user?.watchlist, localWatchlist.length]);

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

  const handleAdd = async (sym: string) => {
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
    setWatchlistData((prev) => prev.filter((d) => d.symbol !== sym));
    toast.success(`${sym} removed`);
  };

  const totalValue = watchlistData.reduce((sum, d) => sum + (d.price || 0), 0);
  const gainers = watchlistData.filter((d) => (d.changePercent || 0) > 0).length;
  const losers = watchlistData.filter((d) => (d.changePercent || 0) < 0).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">My Watchlist</h1>
            <p className="mt-1 text-muted-foreground">
              {currentList.length} stocks tracked · {gainers} gaining · {losers} declining
            </p>
          </div>
          {!user && (
            <div className="text-xs text-muted-foreground bg-secondary px-3 py-2 rounded-lg">
              Sign in to save your watchlist permanently
            </div>
          )}
        </div>

        {/* Search to add stocks */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search and add stocks..."
            className="pl-9 bg-card border-border"
          />
          {(searchResults.length > 0 || searching) && searchQuery && (
            <div className="absolute top-full mt-1 w-full rounded-lg border border-border bg-card shadow-xl z-20 max-h-64 overflow-y-auto">
              {searching && <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>}
              {searchResults.map((r) => (
                <div key={r.symbol} className="flex items-center justify-between px-3 py-2.5 hover:bg-secondary cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.symbol.replace(".NS", "").replace(".BO", "")}</p>
                    <p className="text-xs text-muted-foreground">{r.name}</p>
                  </div>
                  <button
                    onClick={() => handleAdd(r.symbol)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats cards */}
        {watchlistData.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Stocks</p>
              <p className="text-2xl font-bold text-foreground">{currentList.length}</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">Gainers</p>
              <p className="text-2xl font-bold text-green-500">{gainers}</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">Losers</p>
              <p className="text-2xl font-bold text-red-500">{losers}</p>
            </div>
          </div>
        )}

        {/* Watchlist table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground">Search and add stocks to track them here</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Symbol</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Company</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Price</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Change</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">High</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Low</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Chart</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((sym, i) => {
                  const d = watchlistData.find((x) => x.symbol === sym);
                  const up = (d?.changePercent || 0) >= 0;
                  return (
                    <tr
                      key={sym}
                      className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? "" : "bg-card/30"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{sym.replace(".NS", "").replace(".BO", "").charAt(0)}</span>
                          </div>
                          <span className="font-bold text-foreground">{sym.replace(".NS", "").replace(".BO", "")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{d?.name || "—"}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {d?.price ? `₹${Number(d.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${up ? "text-green-500" : "text-red-500"}`}>
                        {d?.changePercent != null ? (
                          <span className="flex items-center justify-end gap-1">
                            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {up ? "+" : ""}{d.changePercent?.toFixed(2)}%
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell text-xs">
                        {d?.high ? `₹${Number(d.high).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell text-xs">
                        {d?.low ? `₹${Number(d.low).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/chart/${sym}`)}
                          className="px-2 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          View Chart
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemove(sym)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
