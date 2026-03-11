import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

const API = "http://localhost:5000/api";

// Curated Indian financial news sources via RSS proxy
const NEWS_FEEDS = [
  { name: "Economic Times Markets", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
  { name: "Moneycontrol", url: "https://www.moneycontrol.com/rss/marketsnews.xml" },
];

// Static fallback news (always shown as base)
const STATIC_NEWS = [
  { title: "Nifty 50 hits record high amid strong FII inflows", source: "Economic Times", time: "2 hours ago", category: "Markets", url: "https://economictimes.indiatimes.com/markets", sentiment: "positive" },
  { title: "RBI holds repo rate steady at 6.5% for sixth consecutive time", source: "Moneycontrol", time: "4 hours ago", category: "Economy", url: "https://www.moneycontrol.com/news/economy", sentiment: "neutral" },
  { title: "Reliance Industries Q3 results: Net profit rises 11% YoY", source: "Business Standard", time: "5 hours ago", category: "Results", url: "https://www.business-standard.com/markets", sentiment: "positive" },
  { title: "TCS bags $1.5 billion deal from European banking giant", source: "NDTV Profit", time: "6 hours ago", category: "IT Sector", url: "https://www.ndtvprofit.com", sentiment: "positive" },
  { title: "Adani Group stocks surge after positive SC ruling", source: "LiveMint", time: "7 hours ago", category: "Stocks", url: "https://www.livemint.com/market", sentiment: "positive" },
  { title: "Sensex falls 300 points as US Fed minutes signal cautious stance", source: "Economic Times", time: "8 hours ago", category: "Markets", url: "https://economictimes.indiatimes.com/markets", sentiment: "negative" },
  { title: "HDFC Bank reports 18% rise in net interest income", source: "Business Line", time: "9 hours ago", category: "Banking", url: "https://www.thehindubusinessline.com", sentiment: "positive" },
  { title: "Zomato surpasses 5 crore monthly transacting users milestone", source: "Moneycontrol", time: "10 hours ago", category: "New Age Tech", url: "https://www.moneycontrol.com", sentiment: "positive" },
  { title: "FII net buyers: ₹4,200 crore pumped into Indian equities this week", source: "Economic Times", time: "11 hours ago", category: "FII/DII", url: "https://economictimes.indiatimes.com/markets", sentiment: "positive" },
  { title: "Coal India output grows 9% in Q3; dividend expected", source: "Business Standard", time: "12 hours ago", category: "PSU", url: "https://www.business-standard.com", sentiment: "positive" },
  { title: "Rupee weakens to 83.5 against dollar amid global uncertainty", source: "LiveMint", time: "1 day ago", category: "Currency", url: "https://www.livemint.com", sentiment: "negative" },
  { title: "SEBI proposes new norms for algo trading by retail investors", source: "NDTV Profit", time: "1 day ago", category: "Regulation", url: "https://www.ndtvprofit.com", sentiment: "neutral" },
  { title: "Infosys raises FY24 revenue guidance to 1.5-2% in constant currency", source: "Economic Times", time: "1 day ago", category: "IT Sector", url: "https://economictimes.indiatimes.com", sentiment: "positive" },
  { title: "Bajaj Finance Q3 profit up 22%; AUM crosses ₹3 lakh crore", source: "Moneycontrol", time: "1 day ago", category: "NBFC", url: "https://www.moneycontrol.com", sentiment: "positive" },
  { title: "Maruti Suzuki SUV sales hit record; market share climbs to 41%", source: "Business Standard", time: "2 days ago", category: "Auto", url: "https://www.business-standard.com", sentiment: "positive" },
  { title: "HAL secures ₹26,000 crore fighter jet engine deal from IAF", source: "Economic Times", time: "2 days ago", category: "Defence", url: "https://economictimes.indiatimes.com", sentiment: "positive" },
  { title: "Sun Pharma's US drug pipeline adds 12 ANDA approvals in Q3", source: "Business Line", time: "2 days ago", category: "Pharma", url: "https://www.thehindubusinessline.com", sentiment: "positive" },
  { title: "DLF launches luxury project in Gurugram worth ₹7,200 crore", source: "LiveMint", time: "2 days ago", category: "Realty", url: "https://www.livemint.com", sentiment: "positive" },
];

const CATEGORIES = ["All", "Markets", "Economy", "Results", "IT Sector", "Banking", "Auto", "Pharma", "Defence", "Realty", "NBFC", "FII/DII", "Regulation", "Currency", "PSU", "New Age Tech"];

export default function NewsPage() {
  const navigate = useNavigate();
  const [indices, setIndices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch(`${API}/indices`)
      .then((r) => r.json())
      .then((d) => setIndices(d.indices || []))
      .catch(() => {});
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filtered = selectedCategory === "All"
    ? STATIC_NEWS
    : STATIC_NEWS.filter((n) => n.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Indices bar */}
      {indices.length > 0 && (
        <div className="border-b border-border bg-card/50 px-4 py-2">
          <div className="container mx-auto flex gap-8 overflow-x-auto">
            {indices.map((idx) => (
              <div key={idx.symbol} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-medium text-foreground">{idx.name}</span>
                <span className="text-sm font-bold text-foreground">
                  {Number(idx.price).toLocaleString("en-IN")}
                </span>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${idx.up ? "text-green-500" : "text-red-500"}`}>
                  {idx.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {idx.up ? "+" : ""}{idx.changePercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">Market News</h1>
            <p className="mt-1 text-muted-foreground">Latest financial news from Indian markets</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((news, i) => (
            <a
              key={i}
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  news.sentiment === "positive" ? "bg-green-500/10 text-green-500" :
                  news.sentiment === "negative" ? "bg-red-500/10 text-red-500" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {news.category}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>

              <h3 className="text-sm font-semibold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors">
                {news.title}
              </h3>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">{news.source}</span>
                <span>{news.time}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Quick links to sources */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Read more from top sources:</p>
          <div className="flex flex-wrap gap-3">
            {[
              ["Economic Times", "https://economictimes.indiatimes.com/markets"],
              ["Moneycontrol", "https://www.moneycontrol.com/news/business/markets"],
              ["LiveMint", "https://www.livemint.com/market"],
              ["Business Standard", "https://www.business-standard.com/markets"],
              ["NDTV Profit", "https://www.ndtvprofit.com"],
              ["Business Line", "https://www.thehindubusinessline.com/markets"],
            ].map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {name} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
