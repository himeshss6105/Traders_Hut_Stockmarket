# 🚀 Traders Hut — Complete Setup Guide

## What's Included
- `Frontend/` — React + Vite + TypeScript frontend (your project, upgraded)
- `Backend/`  — Node.js + Express + MongoDB + Yahoo Finance backend

## ✅ What's Done / Fixed

### Backend (Backend/server.js) — COMPLETELY REBUILT
- ✅ MongoDB Auth: Sign Up & Sign In with User model
- ✅ 50+ Indian stocks (full NIFTY 50 list with .NS symbols)
- ✅ Live WebSocket — market data every 10 seconds
- ✅ Search API — /api/search?q=RELIANCE (Indian stocks first)
- ✅ Stock Quote API — /api/quote/RELIANCE.NS (full stats)
- ✅ Historical data — /api/history?symbol=TCS.NS&range=1y
- ✅ Top Movers sorted by biggest % change

### Frontend (upgraded components)
- ✅ MarketTicker — live real NSE data via WebSocket
- ✅ MarketStats — real NIFTY 50 & SENSEX
- ✅ TopMovers — live Indian stocks sorted by % change
- ✅ StockSearch — live search dropdown + full stock detail card
- ✅ Hero buttons work (scroll to sections)

## 🛠 Step-by-Step Setup

### 1. Start MongoDB
```
mongod
```

### 2. Backend
```
cd Backend
npm install
node server.js
```
You should see:
✅ Connected to MongoDB → tradershut
🚀 Traders Hut backend on port 5000

### 3. Frontend
```
cd Frontend
npm install
npm run dev
```
Open: http://localhost:5173

## 🔌 API Reference
POST /api/auth/register   — Create account {name, email, password}
POST /api/auth/login      — Sign in {email, password}
GET  /api/quotes          — All 50+ live Indian stock quotes
GET  /api/top-movers      — Top 6 biggest movers
GET  /api/search?q=TCS    — Search stocks
GET  /api/quote/TCS.NS    — Single stock full details
GET  /api/history?symbol=TCS.NS&range=1y — Chart data
GET  /api/news            — India market news

History ranges: 1d, 5d, 1mo, 3mo, 1y, 5y

## 💡 Notes
- Yahoo Finance (yahoo-finance2) is FREE — no API key needed
- Data refreshes every 10 seconds via WebSocket
- If rate-limited, increase interval to 30000ms in server.js
