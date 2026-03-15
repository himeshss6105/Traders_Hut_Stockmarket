import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ── Cache ─────────────────────────────────────────────────────────────────────
const cache = new Map();
function getCached(key, ttl = 60000) {
  const e = cache.get(key);
  if (e && Date.now() - e.time < ttl) return e.data;
  return null;
}
function setCache(key, data) { cache.set(key, { data, time: Date.now() }); }

// ── Fetch helper ──────────────────────────────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
    }
  });
  return res.json();
}

// ── Yahoo Finance v8 API (direct, no library) ─────────────────────────────────
async function getQuote(symbol) {
  const cached = getCached(`quote_${symbol}`);
  if (cached) return cached;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  const data = await fetchJSON(url);
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("No data");
  const result = {
    symbol,
    name: meta.longName || meta.shortName || symbol,
    price: meta.regularMarketPrice,
    change: meta.regularMarketPrice - meta.chartPreviousClose,
    changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
    open: meta.regularMarketOpen || meta.chartPreviousClose,
    high: meta.regularMarketDayHigh || meta.regularMarketPrice,
    low: meta.regularMarketDayLow || meta.regularMarketPrice,
    volume: meta.regularMarketVolume,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    marketCap: null,
    pe: null,
    currency: meta.currency,
  };
  setCache(`quote_${symbol}`, result);
  return result;
}

async function getHistory(symbol, period = "1y") {
  const cached = getCached(`history_${symbol}_${period}`, 5 * 60000);
  if (cached) return cached;
  const periodMap = {
    "1d": { range: "1d", interval: "5m" },
    "5d": { range: "5d", interval: "30m" },
    "1mo": { range: "1mo", interval: "1d" },
    "3mo": { range: "3mo", interval: "1d" },
    "6mo": { range: "6mo", interval: "1d" },
    "1y": { range: "1y", interval: "1d" },
    "2y": { range: "2y", interval: "1wk" },
    "5y": { range: "5y", interval: "1wk" },
  };
  const cfg = periodMap[period] || periodMap["1y"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${cfg.interval}&range=${cfg.range}`;
  const data = await fetchJSON(url);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("No chart data");
  const timestamps = result.timestamp || [];
  const ohlcv = result.indicators?.quote?.[0] || {};
  const candles = timestamps.map((t, i) => ({
    time: t,
    open: parseFloat((ohlcv.open?.[i] || 0).toFixed(2)),
    high: parseFloat((ohlcv.high?.[i] || 0).toFixed(2)),
    low: parseFloat((ohlcv.low?.[i] || 0).toFixed(2)),
    close: parseFloat((ohlcv.close?.[i] || 0).toFixed(2)),
    volume: ohlcv.volume?.[i] || 0,
  })).filter(c => c.open && c.high && c.low && c.close);
  setCache(`history_${symbol}_${period}`, candles, 5 * 60000);
  return candles;
}

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tradershut")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  profession: { type: String, default: "" },
  incomeRange: { type: String, default: "" },
  watchlist: { type: [String], default: ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"] },
  createdAt: { type: Date, default: Date.now },
});
UserSchema.pre("save", async function () {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 12);
});
const User = mongoose.model("User", UserSchema);


const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || "traders_hut_secret"); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
};

const INDIAN_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys", sector: "IT" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG" },
  { symbol: "ITC.NS", name: "ITC", sector: "FMCG" },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "NBFC" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking" },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "IT" },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "FMCG" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Banking" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Auto" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Pharma" },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Cement" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT" },
  { symbol: "NTPC.NS", name: "NTPC", sector: "Power" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation", sector: "Power" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", sector: "Energy" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", sector: "NBFC" },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "FMCG" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", sector: "Conglomerate" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports", sector: "Infrastructure" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Auto" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Metal" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metal" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", sector: "IT" },
  { symbol: "CIPLA.NS", name: "Cipla", sector: "Pharma" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", sector: "Pharma" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", sector: "Pharma" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", sector: "Metal" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank", sector: "Banking" },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", sector: "Auto" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Auto" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", sector: "FMCG" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", sector: "Auto" },
  { symbol: "COALINDIA.NS", name: "Coal India", sector: "Energy" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum", sector: "Energy" },
  { symbol: "IOC.NS", name: "Indian Oil Corporation", sector: "Energy" },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", sector: "FMCG" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals", sector: "Healthcare" },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance", sector: "Insurance" },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance", sector: "Insurance" },
  { symbol: "ZOMATO.NS", name: "Zomato", sector: "New Age Tech" },
  { symbol: "PAYTM.NS", name: "Paytm", sector: "New Age Tech" },
  { symbol: "NYKAA.NS", name: "Nykaa", sector: "New Age Tech" },
  { symbol: "IRCTC.NS", name: "IRCTC", sector: "PSU" },
  { symbol: "HAL.NS", name: "Hindustan Aeronautics", sector: "Defence" },
  { symbol: "BEL.NS", name: "Bharat Electronics", sector: "Defence" },
  { symbol: "IRFC.NS", name: "Indian Railway Finance Corp", sector: "PSU" },
  { symbol: "PNB.NS", name: "Punjab National Bank", sector: "Banking" },
  { symbol: "BANKBARODA.NS", name: "Bank of Baroda", sector: "Banking" },
  { symbol: "DLF.NS", name: "DLF", sector: "Realty" },
  { symbol: "GODREJPROP.NS", name: "Godrej Properties", sector: "Realty" },
  { symbol: "DIXON.NS", name: "Dixon Technologies", sector: "Electronics" },
  { symbol: "TATAPOWER.NS", name: "Tata Power", sector: "Power" },
  { symbol: "ADANIGREEN.NS", name: "Adani Green Energy", sector: "Power" },
  { symbol: "RECLTD.NS", name: "REC", sector: "NBFC" },
  { symbol: "PFC.NS", name: "Power Finance Corporation", sector: "NBFC" },
  { symbol: "GAIL.NS", name: "GAIL India", sector: "Energy" },
  { symbol: "MPHASIS.NS", name: "Mphasis", sector: "IT" },
  { symbol: "PERSISTENT.NS", name: "Persistent Systems", sector: "IT" },
  { symbol: "COFORGE.NS", name: "Coforge", sector: "IT" },
  { symbol: "LTIM.NS", name: "LTIMindtree", sector: "IT" },
  { symbol: "TATAELXSI.NS", name: "Tata Elxsi", sector: "IT" },
  { symbol: "ZYDUSLIFE.NS", name: "Zydus Lifesciences", sector: "Pharma" },
  { symbol: "LUPIN.NS", name: "Lupin", sector: "Pharma" },
  { symbol: "AUROPHARMA.NS", name: "Aurobindo Pharma", sector: "Pharma" },
  { symbol: "BIOCON.NS", name: "Biocon", sector: "Pharma" },
  { symbol: "MRF.NS", name: "MRF", sector: "Auto" },
  { symbol: "APOLLOTYRE.NS", name: "Apollo Tyres", sector: "Auto" },
  { symbol: "CHOLAFIN.NS", name: "Cholamandalam Investment", sector: "NBFC" },
  { symbol: "SHRIRAMFIN.NS", name: "Shriram Finance", sector: "NBFC" },
  { symbol: "NHPC.NS", name: "NHPC", sector: "Power" },
  { symbol: "VEDL.NS", name: "Vedanta", sector: "Metal" },
  { symbol: "NMDC.NS", name: "NMDC", sector: "Metal" },
  { symbol: "SAIL.NS", name: "Steel Authority of India", sector: "Metal" },
  { symbol: "INDIAMART.NS", name: "IndiaMART InterMESH", sector: "New Age Tech" },
  { symbol: "NAUKRI.NS", name: "Info Edge (Naukri)", sector: "New Age Tech" },
  { symbol: "HAVELLS.NS", name: "Havells India", sector: "Electronics" },
  { symbol: "DABUR.NS", name: "Dabur India", sector: "FMCG" },
  { symbol: "MARICO.NS", name: "Marico", sector: "FMCG" },
  { symbol: "GODREJCP.NS", name: "Godrej Consumer Products", sector: "FMCG" },
  { symbol: "PIDILITIND.NS", name: "Pidilite Industries", sector: "Chemical" },
  { symbol: "SIEMENS.NS", name: "Siemens", sector: "Electronics" },
  { symbol: "MUTHOOTFIN.NS", name: "Muthoot Finance", sector: "NBFC" },
  { symbol: "PRESTIGE.NS", name: "Prestige Estates", sector: "Realty" },
  { symbol: "OBEROIRLTY.NS", name: "Oberoi Realty", sector: "Realty" },
  { symbol: "BOSCHLTD.NS", name: "Bosch", sector: "Auto" },
  { symbol: "GRASIM.NS", name: "Grasim Industries", sector: "Cement" },
  { symbol: "CONCOR.NS", name: "Container Corporation", sector: "Logistics" },
  { symbol: "MAXHEALTH.NS", name: "Max Healthcare", sector: "Healthcare" },
  { symbol: "FORTIS.NS", name: "Fortis Healthcare", sector: "Healthcare" },
];

// ── Auth Routes ───────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, profession, incomeRange } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) return res.status(400).json({ error: "Password must be 8+ chars with uppercase, lowercase, number and special character" }); if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
    const user = await User.create({ name, email, password, profession: profession || "", incomeRange: incomeRange || "" });
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET || "traders_hut_secret", { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, watchlist: user.watchlist } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET || "traders_hut_secret", { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, watchlist: user.watchlist } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/auth/me", auth, async (req, res) => {
  try { const user = await User.findById(req.user.id).select("-password"); res.json(user); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Watchlist ─────────────────────────────────────────────────────────────────
app.get("/api/watchlist", auth, async (req, res) => {
  try { const user = await User.findById(req.user.id).select("watchlist"); res.json({ watchlist: user.watchlist }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/watchlist/add", auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.watchlist.includes(symbol)) { user.watchlist.push(symbol); await user.save(); }
    res.json({ watchlist: user.watchlist });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/watchlist/remove", auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    const user = await User.findById(req.user.id);
    user.watchlist = user.watchlist.filter((s) => s !== symbol);
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Search ────────────────────────────────────────────────────────────────────
app.get("/api/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ results: [] });
  const query = q.toUpperCase();
  const results = INDIAN_STOCKS.filter(
    (s) => s.symbol.toUpperCase().includes(query) || s.name.toUpperCase().includes(query)
  ).slice(0, 12);
  res.json({ results });
});

// ── Stocks List ───────────────────────────────────────────────────────────────
app.get("/api/stocks/indian", (req, res) => {
  const { sector } = req.query;
  const stocks = sector ? INDIAN_STOCKS.filter((s) => s.sector === sector) : INDIAN_STOCKS;
  const sectors = [...new Set(INDIAN_STOCKS.map((s) => s.sector))].sort();
  res.json({ stocks, sectors });
});

// ── Live Quote ────────────────────────────────────────────────────────────────
app.get("/api/quote/:symbol", async (req, res) => {
  try {
    const data = await getQuote(req.params.symbol);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Chart History ─────────────────────────────────────────────────────────────
app.get("/api/history/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = "1y" } = req.query;
    const candles = await getHistory(symbol, period);
    res.json({ symbol, period, candles });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Indices ───────────────────────────────────────────────────────────────────
app.get("/api/indices", async (req, res) => {
  try {
    const symbols = ["^NSEI", "^BSESN", "^NSEBANK", "^CNXIT"];
    const names = ["NIFTY 50", "SENSEX", "BANK NIFTY", "NIFTY IT"];
    const quotes = await Promise.allSettled(symbols.map((s) => getQuote(s)));
    const result = quotes.map((q, i) => {
      if (q.status === "fulfilled") {
        const d = q.value;
        return { symbol: symbols[i], name: names[i], price: d.price?.toFixed(2), change: d.change?.toFixed(2), changePercent: d.changePercent?.toFixed(2), up: (d.changePercent || 0) >= 0 };
      }
      return { symbol: symbols[i], name: names[i], price: "N/A", change: "0", changePercent: "0", up: true };
    });
    res.json({ indices: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Top Movers ────────────────────────────────────────────────────────────────
app.get("/api/movers", async (req, res) => {
  try {
    const topSymbols = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "BAJFINANCE.NS", "WIPRO.NS", "LT.NS", "TATAMOTORS.NS", "ADANIENT.NS", "ZOMATO.NS", "HCLTECH.NS", "KOTAKBANK.NS"];
    const quotes = await Promise.allSettled(topSymbols.map((s) => getQuote(s)));
    const stocks = quotes.map((q, i) => {
      if (q.status === "fulfilled") {
        const d = q.value;
        return { symbol: topSymbols[i].replace(".NS", ""), fullSymbol: topSymbols[i], name: d.name || topSymbols[i], price: d.price?.toFixed(2), change: (d.change >= 0 ? "+" : "") + d.change?.toFixed(2), changePercent: (d.changePercent >= 0 ? "+" : "") + d.changePercent?.toFixed(2) + "%", up: (d.changePercent || 0) >= 0, volume: d.volume || 0 };
      }
      return null;
    }).filter(Boolean);
    const gainers = [...stocks].sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent)).slice(0, 6);
    const losers = [...stocks].sort((a, b) => parseFloat(a.changePercent) - parseFloat(b.changePercent)).slice(0, 6);
    res.json({ gainers, losers, all: stocks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// Admin: Get All Users
app.get("/api/admin/users", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "Himeshss@060105")
    return res.status(401).json({ error: "Unauthorized" });
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: "Failed to fetch users" }); }
});

// AI Stock Prediction
app.post("/api/predict", async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: "Symbol required" });
  try {
    const q = await getQuote(symbol);
    if (!q || !q.price) return res.status(404).json({ error: "Stock not found. Try adding .NS e.g. RELIANCE.NS" });

    const stockData = {
      symbol,
      name: q.name || symbol,
      price: q.price?.toFixed(2),
      change: `${q.change >= 0 ? "+" : ""}₹${Math.abs(q.change || 0).toFixed(2)}`,
      changePercent: `${q.changePercent >= 0 ? "+" : ""}${(q.changePercent || 0).toFixed(2)}%`,
      up: (q.changePercent || 0) >= 0,
      dayHigh: q.high?.toFixed(2),
      dayLow: q.low?.toFixed(2),
      week52High: q.fiftyTwoWeekHigh?.toFixed(2),
      week52Low: q.fiftyTwoWeekLow?.toFixed(2),
      pe: q.pe?.toFixed(2),
    };

    const prompt = `You are an expert Indian stock market analyst. Analyze this stock and give a prediction.

Stock: ${stockData.name} (${stockData.symbol})
Current Price: ₹${stockData.price}
Day Change: ${stockData.change} (${stockData.changePercent})
Day High: ₹${stockData.dayHigh} | Day Low: ₹${stockData.dayLow}
52W High: ₹${stockData.week52High} | 52W Low: ₹${stockData.week52Low}
P/E Ratio: ${stockData.pe || "N/A"}

Respond ONLY in this exact JSON format, no extra text, no markdown:
{
  "verdict": "BUY or HOLD or SELL",
  "confidence": "High or Medium or Low",
  "analysis": "2-3 sentences explaining why based on the data",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const prediction = JSON.parse(cleanText);
    res.json({ ...prediction, symbol, stockData });
  } catch (err) {
    console.error("Prediction error:", err.message);
    res.status(500).json({ error: "Prediction failed: " + err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Traders Hut backend running on port ${PORT}`));
