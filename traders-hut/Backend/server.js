import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import yahooFinance from "yahoo-finance2";
import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── MongoDB Connection ──────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tradershut";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB → tradershut"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ─── Schemas & Models ────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const WatchlistSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  symbols: [{ type: String }]
}, { timestamps: true });

const PortfolioHoldingSchema = new mongoose.Schema({
  symbol:       { type: String, required: true },
  shares:       { type: Number, required: true, min: 0 },
  averagePrice: { type: Number, required: true, min: 0 }
});

const PortfolioSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  holdings: [PortfolioHoldingSchema]
}, { timestamps: true });

const User      = mongoose.model("User",      UserSchema);
const Watchlist = mongoose.model("Watchlist", WatchlistSchema);
const Portfolio = mongoose.model("Portfolio", PortfolioSchema);

// ─── Password hashing ────────────────────────────────────────────────────────
function hashPassword(plain) {
  return crypto.createHash("sha256").update(plain + "traders_hut_salt_2024").digest("hex");
}

// ─── Indian Stock Symbols (NSE / BSE) ────────────────────────────────────────
const SYMBOLS = [
  "^NSEI", "^BSESN",
  "RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS",
  "SBIN.NS","BHARTIARTL.NS","ITC.NS","LT.NS","KOTAKBANK.NS",
  "WIPRO.NS","HCLTECH.NS","MARUTI.NS","AXISBANK.NS","ULTRACEMCO.NS",
  "SUNPHARMA.NS","TITAN.NS","NESTLEIND.NS","ASIANPAINT.NS","POWERGRID.NS",
  "NTPC.NS","BAJFINANCE.NS","BAJAJFINSV.NS","ONGC.NS","TATAMOTORS.NS",
  "TATASTEEL.NS","JSWSTEEL.NS","HINDALCO.NS","ADANIENT.NS","ADANIPORTS.NS",
  "HINDUNILVR.NS","DIVISLAB.NS","CIPLA.NS","DRREDDY.NS","EICHERMOT.NS",
  "GRASIM.NS","HEROMOTOCO.NS","INDUSINDBK.NS","MM.NS","COALINDIA.NS",
  "BPCL.NS","APOLLOHOSP.NS","TATACONSUM.NS","SBILIFE.NS","HDFCLIFE.NS",
  "TECHM.NS","UPL.NS","VEDL.NS","BRITANNIA.NS","PIDILITIND.NS"
];

const SYMBOL_DISPLAY = {
  "^NSEI":"NIFTY 50","^BSESN":"SENSEX","RELIANCE.NS":"RELIANCE","TCS.NS":"TCS",
  "HDFCBANK.NS":"HDFCBANK","INFY.NS":"INFY","ICICIBANK.NS":"ICICIBANK","SBIN.NS":"SBIN",
  "BHARTIARTL.NS":"BHARTIARTL","ITC.NS":"ITC","LT.NS":"L&T","KOTAKBANK.NS":"KOTAKBANK",
  "WIPRO.NS":"WIPRO","HCLTECH.NS":"HCLTECH","MARUTI.NS":"MARUTI","AXISBANK.NS":"AXISBANK",
  "ULTRACEMCO.NS":"ULTRACEMCO","SUNPHARMA.NS":"SUNPHARMA","TITAN.NS":"TITAN",
  "NESTLEIND.NS":"NESTLEIND","ASIANPAINT.NS":"ASIANPAINT","POWERGRID.NS":"POWERGRID",
  "NTPC.NS":"NTPC","BAJFINANCE.NS":"BAJFINANCE","BAJAJFINSV.NS":"BAJAJFINSV","ONGC.NS":"ONGC",
  "TATAMOTORS.NS":"TATAMOTORS","TATASTEEL.NS":"TATASTEEL","JSWSTEEL.NS":"JSWSTEEL",
  "HINDALCO.NS":"HINDALCO","ADANIENT.NS":"ADANIENT","ADANIPORTS.NS":"ADANIPORTS",
  "HINDUNILVR.NS":"HINDUNILVR","DIVISLAB.NS":"DIVISLAB","CIPLA.NS":"CIPLA",
  "DRREDDY.NS":"DRREDDY","EICHERMOT.NS":"EICHERMOT","GRASIM.NS":"GRASIM",
  "HEROMOTOCO.NS":"HEROMOTOCO","INDUSINDBK.NS":"INDUSINDBK","MM.NS":"M&M",
  "COALINDIA.NS":"COALINDIA","BPCL.NS":"BPCL","APOLLOHOSP.NS":"APOLLOHOSP",
  "TATACONSUM.NS":"TATACONSUM","SBILIFE.NS":"SBILIFE","HDFCLIFE.NS":"HDFCLIFE",
  "TECHM.NS":"TECHM","UPL.NS":"UPL","VEDL.NS":"VEDL","BRITANNIA.NS":"BRITANNIA",
  "PIDILITIND.NS":"PIDILITIND"
};

// ─── WebSocket Server ────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

let latestQuotes = [];
let latestTopMovers = [];

function formatVolume(vol) {
  if (!vol) return "N/A";
  if (vol >= 1e7) return `${(vol/1e7).toFixed(1)}Cr`;
  if (vol >= 1e5) return `${(vol/1e5).toFixed(1)}L`;
  return vol.toLocaleString("en-IN");
}

function formatMarketCap(mc) {
  if (!mc) return "N/A";
  if (mc >= 1e12) return `₹${(mc/1e12).toFixed(2)}T`;
  if (mc >= 1e9)  return `₹${(mc/1e9).toFixed(2)}B`;
  return `₹${(mc/1e6).toFixed(0)}M`;
}

async function fetchBatch(symbols) {
  try {
    const result = await yahooFinance.quote(symbols);
    return Array.isArray(result) ? result : [result];
  } catch { return []; }
}

async function fetchMarketData() {
  try {
    const mid = Math.ceil(SYMBOLS.length / 2);
    const [b1, b2] = await Promise.all([fetchBatch(SYMBOLS.slice(0,mid)), fetchBatch(SYMBOLS.slice(mid))]);
    const all = [...b1, ...b2];

    latestQuotes = all
      .filter(q => q && q.regularMarketPrice)
      .map(q => {
        const price     = q.regularMarketPrice ?? 0;
        const prevClose = q.regularMarketPreviousClose ?? price;
        const change    = price - prevClose;
        const pct       = prevClose ? (change/prevClose)*100 : 0;
        return {
          symbol:        SYMBOL_DISPLAY[q.symbol] || q.symbol.replace(".NS","").replace(".BO",""),
          rawSymbol:     q.symbol,
          name:          q.shortName || q.longName || SYMBOL_DISPLAY[q.symbol] || q.symbol,
          price:         price.toFixed(2),
          change:        `${change>=0?'+':''}₹${Math.abs(change).toFixed(2)}`,
          changePercent: `${pct>=0?'+':''}${pct.toFixed(2)}%`,
          up:            change >= 0,
          volume:        formatVolume(q.regularMarketVolume),
          dayHigh:       q.regularMarketDayHigh?.toFixed(2),
          dayLow:        q.regularMarketDayLow?.toFixed(2),
          marketCap:     formatMarketCap(q.marketCap),
          pe:            q.trailingPE?.toFixed(2)
        };
      });

    latestTopMovers = [...latestQuotes]
      .filter(q => !q.rawSymbol?.startsWith("^"))
      .sort((a,b) => Math.abs(parseFloat(b.changePercent)) - Math.abs(parseFloat(a.changePercent)))
      .slice(0,6);

    io.emit("market-update",  latestQuotes);
    io.emit("top-movers",     latestTopMovers);
    console.log(`[${new Date().toLocaleTimeString()}] Broadcasted ${latestQuotes.length} quotes`);
  } catch(e) {
    console.error("Market data error:", e.message);
  }
}

fetchMarketData();
setInterval(fetchMarketData, 10000);

io.on("connection", socket => {
  console.log("Client connected:", socket.id);
  if (latestQuotes.length)     socket.emit("market-update",  latestQuotes);
  if (latestTopMovers.length)  socket.emit("top-movers",     latestTopMovers);
  socket.on("disconnect", () => console.log("Disconnected:", socket.id));
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name||!email||!password) return res.status(400).json({error:"All fields required"});
  if (password.length < 6)      return res.status(400).json({error:"Password must be 6+ chars"});
  try {
    if (await User.findOne({email:email.toLowerCase()}))
      return res.status(409).json({error:"Email already registered"});
    const user = await new User({name,email,password:hashPassword(password)}).save();
    res.status(201).json({message:"Account created",user:{id:user._id,name:user.name,email:user.email}});
  } catch(e) { res.status(500).json({error:"Registration failed"}); }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email||!password) return res.status(400).json({error:"Email and password required"});
  try {
    const user = await User.findOne({email:email.toLowerCase()});
    if (!user || user.password !== hashPassword(password))
      return res.status(401).json({error:"Invalid email or password"});
    res.json({message:"Login successful",user:{id:user._id,name:user.name,email:user.email}});
  } catch(e) { res.status(500).json({error:"Login failed"}); }
});

// ─── MARKET ROUTES ────────────────────────────────────────────────────────────
app.get("/api/quotes",      (req,res) => res.json(latestQuotes));
app.get("/api/top-movers",  (req,res) => res.json(latestTopMovers));
app.get("/api/indices",     (req,res) => res.json(latestQuotes.filter(q=>q.rawSymbol?.startsWith("^"))));
app.get("/api/health",      (req,res) => res.json({status:"ok",timestamp:new Date()}));

app.get("/api/search", async (req,res) => {
  const {q} = req.query;
  if (!q?.trim()) return res.status(400).json({error:"Query required"});
  try {
    const r = await yahooFinance.search(q, {quotesCount:20,newsCount:0});
    const stocks = (r.quotes||[])
      .filter(s=>s.symbol&&s.quoteType==="EQUITY")
      .map(s=>({
        symbol:   s.symbol,
        display:  s.symbol.replace(".NS","").replace(".BO",""),
        name:     s.shortname||s.longname||s.symbol,
        exchange: s.exchDisp||(s.symbol.endsWith(".NS")?"NSE":s.symbol.endsWith(".BO")?"BSE":""),
        isIndian: s.symbol.endsWith(".NS")||s.symbol.endsWith(".BO")
      }));
    const sorted = [...stocks.filter(s=>s.isIndian),...stocks.filter(s=>!s.isIndian)];
    res.json(sorted.slice(0,12));
  } catch(e) { res.status(500).json({error:"Search failed"}); }
});

app.get("/api/quote/:symbol", async (req,res) => {
  try {
    const q = await yahooFinance.quote(req.params.symbol);
    if (!q) return res.status(404).json({error:"Not found"});
    const price=q.regularMarketPrice??0, prev=q.regularMarketPreviousClose??price;
    const change=price-prev, pct=prev?(change/prev)*100:0;
    res.json({
      symbol:q.symbol, name:q.shortName||q.longName||q.symbol,
      price:price.toFixed(2),
      change:`${change>=0?'+':''}₹${Math.abs(change).toFixed(2)}`,
      changePercent:`${pct>=0?'+':''}${pct.toFixed(2)}%`,
      up:change>=0, volume:formatVolume(q.regularMarketVolume),
      dayHigh:q.regularMarketDayHigh?.toFixed(2), dayLow:q.regularMarketDayLow?.toFixed(2),
      open:q.regularMarketOpen?.toFixed(2), prevClose:prev.toFixed(2),
      marketCap:formatMarketCap(q.marketCap), pe:q.trailingPE?.toFixed(2),
      week52High:q.fiftyTwoWeekHigh?.toFixed(2), week52Low:q.fiftyTwoWeekLow?.toFixed(2)
    });
  } catch(e) { res.status(500).json({error:"Failed to fetch quote"}); }
});

app.get("/api/history", async (req,res) => {
  const {symbol,range="1y"} = req.query;
  if (!symbol) return res.status(400).json({error:"Symbol required"});
  const rangeMap = {
    "1d":{period1:new Date(Date.now()-86400000),interval:"5m"},
    "5d":{period1:new Date(Date.now()-432000000),interval:"15m"},
    "1mo":{period1:new Date(Date.now()-2592000000),interval:"1d"},
    "3mo":{period1:new Date(Date.now()-7776000000),interval:"1d"},
    "1y":{period1:new Date(Date.now()-31536000000),interval:"1d"},
    "5y":{period1:new Date(Date.now()-157680000000),interval:"1wk"}
  };
  const opts = rangeMap[range]||rangeMap["1y"];
  try {
    const history = await yahooFinance.historical(symbol,{period1:opts.period1,interval:opts.interval});
    res.json(history.filter(i=>i.open&&i.close).map(i=>({
      time:Math.floor(i.date.getTime()/1000),open:i.open,high:i.high,low:i.low,close:i.close,volume:i.volume
    })));
  } catch(e) { res.status(500).json({error:"Failed to fetch history"}); }
});

// ─── WATCHLIST & PORTFOLIO ────────────────────────────────────────────────────
app.get("/api/watchlist/:userId", async (req,res) => {
  try { const wl=await Watchlist.findOne({userId:req.params.userId}); res.json(wl?wl.symbols:[]); }
  catch { res.status(500).json({error:"DB error"}); }
});
app.post("/api/watchlist", async (req,res) => {
  const {userId,symbol}=req.body;
  if (!userId||!symbol) return res.status(400).json({error:"Missing fields"});
  try {
    let wl=await Watchlist.findOne({userId});
    if (!wl) wl=new Watchlist({userId,symbols:[symbol]});
    else if (wl.symbols.includes(symbol)) wl.symbols=wl.symbols.filter(s=>s!==symbol);
    else wl.symbols.push(symbol);
    await wl.save(); res.json(wl.symbols);
  } catch { res.status(500).json({error:"Failed"}); }
});

app.get("/api/portfolio/:userId", async (req,res) => {
  try { const p=await Portfolio.findOne({userId:req.params.userId}); res.json(p?p.holdings:[]); }
  catch { res.status(500).json({error:"DB error"}); }
});
app.post("/api/portfolio", async (req,res) => {
  const {userId,holding}=req.body;
  try {
    let p=await Portfolio.findOne({userId});
    if (!p) p=new Portfolio({userId,holdings:[holding]});
    else { const i=p.holdings.findIndex(h=>h.symbol===holding.symbol);
      if (i!==-1){p.holdings[i].shares+=holding.shares;p.holdings[i].averagePrice=holding.averagePrice;}
      else p.holdings.push(holding); }
    await p.save(); res.json(p.holdings);
  } catch { res.status(500).json({error:"Failed"}); }
});

app.get("/api/news", async (req,res) => {
  try {
    const r=await yahooFinance.search("India Stock Market NSE NIFTY",{quotesCount:0,newsCount:20});
    res.json(r.news||[]);
  } catch { res.status(500).json({error:"Failed"}); }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Traders Hut backend on port ${PORT}`));
