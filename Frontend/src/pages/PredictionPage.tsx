import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MarketTicker from "@/components/MarketTicker";

const POPULAR_STOCKS = [
  "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
  "SBIN.NS", "WIPRO.NS", "TATAMOTORS.NS", "ADANIENT.NS", "BAJFINANCE.NS"
];

const PredictionPage = () => {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handlePredict = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`http://localhost:5000/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (verdict: string) => {
    if (!verdict) return "text-gray-400";
    const v = verdict.toLowerCase();
    if (v.includes("buy") || v.includes("hold")) return "text-green-400";
    if (v.includes("sell") || v.includes("avoid")) return "text-red-400";
    return "text-yellow-400";
  };

  const verdictBg = (verdict: string) => {
    if (!verdict) return "border-gray-600";
    const v = verdict.toLowerCase();
    if (v.includes("buy") || v.includes("hold")) return "border-green-500 bg-green-500/10";
    if (v.includes("sell") || v.includes("avoid")) return "border-red-500 bg-red-500/10";
    return "border-yellow-500 bg-yellow-500/10";
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <SiteHeader />
      <MarketTicker />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1 text-green-400 text-sm mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            AI-Powered Analysis
          </div>
          <h1 className="text-5xl font-black mb-4">
            STOCK <span className="text-green-400">PREDICTOR</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Get AI-driven insights on any Indian stock — buy, hold, or sell recommendations
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-8">
          <label className="block text-sm text-gray-400 mb-2">Enter Stock Symbol</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePredict()}
              placeholder="e.g. RELIANCE.NS, TCS.NS, INFY.NS"
              className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
            <button
              onClick={handlePredict}
              disabled={loading || !symbol.trim()}
              className="bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold px-8 py-3 rounded-xl transition-all"
            >
              {loading ? "Analyzing..." : "Predict"}
            </button>
          </div>

          {/* Popular Stocks */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Popular:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_STOCKS.map(s => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-green-500 text-gray-300 px-3 py-1 rounded-full transition-all"
                >
                  {s.replace(".NS", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">AI is analyzing market data for <span className="text-green-400">{symbol}</span>...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-red-400 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-6 animate-fade-in">
            {/* Verdict Card */}
            <div className={`border-2 rounded-2xl p-8 text-center ${verdictBg(result.verdict)}`}>
              <p className="text-gray-400 text-sm mb-2">AI Verdict for {result.symbol}</p>
              <p className={`text-5xl font-black mb-2 ${verdictColor(result.verdict)}`}>
                {result.verdict}
              </p>
              <p className="text-gray-300 text-sm">Confidence: <span className="text-white font-bold">{result.confidence}</span></p>
            </div>

            {/* Stock Info */}
            {result.stockData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Current Price", value: `₹${result.stockData.price}` },
                  { label: "Day Change", value: result.stockData.change, color: result.stockData.up ? "text-green-400" : "text-red-400" },
                  { label: "52W High", value: `₹${result.stockData.week52High}` },
                  { label: "52W Low", value: `₹${result.stockData.week52Low}` },
                ].map((item, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                    <p className={`font-bold text-lg ${item.color || "text-white"}`}>{item.value || "N/A"}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Analysis */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              <h3 className="text-green-400 font-bold text-lg mb-4">📊 AI Analysis</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{result.analysis}</p>
            </div>

            {/* Key Points */}
            {result.keyPoints && result.keyPoints.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
                <h3 className="text-green-400 font-bold text-lg mb-4">⚡ Key Points</h3>
                <ul className="space-y-2">
                  {result.keyPoints.map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <span className="text-green-400 mt-1">→</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-center text-xs text-gray-600">
              ⚠️ This is AI-generated analysis for educational purposes only. Not financial advice. Always do your own research before investing.
            </p>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};

export default PredictionPage;
