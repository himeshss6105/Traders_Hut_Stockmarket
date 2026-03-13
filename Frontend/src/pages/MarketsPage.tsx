import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import SiteHeader from "@/components/SiteHeader";

const API = import.meta.env.VITE_API_URL + "/api";

interface Stock {
  symbol: string;
  name: string;
  sector?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: string | number;
}

export default function MarketsPage() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "gainers" | "losers">("all");

  useEffect(() => {
    // Load base list immediately
    fetch(`${API}/stocks/indian`)
      .then((r) => r.json())
      .then((data) => {
        setStocks(data.stocks || []);
        setSectors(["All", ...(data.sectors || [])]);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load live movers data
    fetch(`${API}/movers`)
      .then((r) => r.json())
      .then((data) => {
        if (data.all) {
          setStocks((prev) =>
            prev.map((s) => {
              const live = data.all.find((d: any) => d.fullSymbol === s.symbol);
              return live
                ? { ...s, price: parseFloat(live.price), change: parseFloat(live.change), changePercent: parseFloat(live.changePercent), volume: live.volume }
                : s;
            })
          );
        }
      })
      .catch(() => { });
  }, []);

  const sectorFiltered = selectedSector === "All" ? stocks : stocks.filter((s) => s.sector === selectedSector);

  const textFiltered = sectorFiltered.filter(
    (s) =>
      s.symbol.toLowerCase().includes(filter.toLowerCase()) ||
      s.name.toLowerCase().includes(filter.toLowerCase())
  );

  const displayed =
    tab === "gainers"
      ? [...textFiltered].filter((s) => (s.changePercent || 0) > 0).sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
      : tab === "losers"
        ? [...textFiltered].filter((s) => (s.changePercent || 0) < 0).sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
        : textFiltered;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">Indian Markets</h1>
          <p className="mt-1 text-muted-foreground">NSE & BSE listed stocks — {stocks.length} stocks across {sectors.length - 1} sectors</p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search stocks by name or symbol..."
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex rounded-lg border border-border bg-card p-1">
            {(["all", "gainers", "losers"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Sector Pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Filter className="h-4 w-4 text-muted-foreground mt-1.5" />
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSector(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedSector === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Symbol</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Company</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Sector</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Price</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Change</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Volume</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((s, i) => {
                  const up = (s.changePercent || 0) >= 0;
                  return (
                    <tr
                      key={s.symbol}
                      onClick={() => navigate(`/chart/${s.symbol}`)}
                      className={`border-b border-border/50 cursor-pointer hover:bg-secondary/40 transition-colors ${i % 2 === 0 ? "" : "bg-card/30"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{s.symbol.replace(".NS", "").replace(".BO", "").charAt(0)}</span>
                          </div>
                          <span className="font-display font-bold text-foreground">{s.symbol.replace(".NS", "").replace(".BO", "")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.name}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {s.sector && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">{s.sector}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {s.price ? `₹${s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${up ? "text-green-500" : "text-red-500"}`}>
                        {s.changePercent != null ? (
                          <span className="flex items-center justify-end gap-1">
                            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {up ? "+" : ""}{s.changePercent.toFixed(2)}%
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{s.volume || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {displayed.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">No stocks match your search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
