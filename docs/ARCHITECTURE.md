# QuantArmy Architecture — v2.0

> Last updated: 2026-03-13

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  Next.js 15 + Tailwind 3.4 + TypeScript                │
│                                                         │
│  Pages:                                                 │
│    /                    Landing page                    │
│    /company/overview    System overview (hub)           │
│    /company             Paper trading dashboard         │
│    /company/watchlist   Watchlist management            │
│    /company/watchlist/  Symbol detail + 8-role analysis │
│    /company/[role]      Individual role page            │
│                                                         │
│  API Routes (serverless):                              │
│    /api/market/*        Binance + Sina proxy            │
│    /api/company/*       Demo data (localStorage)        │
│    /api/skills/*        Skill catalog + import          │
│                                                         │
│  Analysis Engine (client-side):                        │
│    lib/analysis/        8-role computation              │
│    lib/paper-trading.ts Paper trading engine            │
│    lib/market-adapter.ts Multi-market adapter           │
└──────────────┬──────────────────────────────────────────┘
               │ fetch (server-side proxy)
               ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Binance API            │  │   Sina Finance API       │
│   data-api.binance.vision│  │   hq.sinajs.cn           │
│   Crypto: real-time      │  │   HK/A-shares: real-time │
│   Klines, depth, trades  │  │   quotes.sina.cn (klines)│
└──────────────────────────┘  └──────────────────────────┘
                              ┌──────────────────────────┐
                              │   Yahoo Finance          │
                              │   HK klines (historical) │
                              └──────────────────────────┘
```

## Frontend Architecture

### Tech Stack
- **Framework**: Next.js 15.5 (App Router)
- **Styling**: Tailwind CSS 3.4.19
- **Charts**: TradingView Widget (tv.js), lightweight-charts v5
- **State**: React hooks + localStorage
- **Language**: TypeScript (strict)
- **Deploy**: Vercel (serverless)

### Directory Structure
```
frontend/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── company/
│   │   ├── overview/page.tsx             # System overview (hub)
│   │   ├── page.tsx                      # Paper trading dashboard
│   │   ├── layout.tsx                    # Sidebar layout wrapper
│   │   ├── watchlist/
│   │   │   ├── page.tsx                  # Watchlist management
│   │   │   └── [symbol]/page.tsx         # Symbol detail + analysis
│   │   ├── [role]/page.tsx               # Individual role page
│   │   ├── new/page.tsx                  # Company creation
│   │   └── settings/                     # Settings (stub)
│   └── api/
│       ├── market/
│       │   ├── klines/route.ts           # K-line data (Binance + Sina + Yahoo)
│       │   ├── ticker24h/route.ts        # 24h ticker (Binance + Sina)
│       │   ├── depth/route.ts            # Orderbook depth (Binance only)
│       │   ├── trades/route.ts           # Recent trades (Binance only)
│       │   └── price/route.ts            # Current price
│       ├── company/                      # Demo company/role/watchlist APIs
│       └── skills/                       # Skill catalog + GitHub import
├── components/
│   ├── Dashboard/Dashboard.tsx           # Paper trading dashboard
│   ├── Market/
│   │   ├── TradingViewChart.tsx           # TradingView K-line widget
│   │   └── EquityCurve.tsx               # Equity curve (lightweight-charts)
│   ├── Sidebar/SidebarConnected.tsx       # Main sidebar navigation
│   ├── Trading/
│   │   ├── OrderModal.tsx                 # Open position dialog
│   │   ├── CloseModal.tsx                 # Close position dialog
│   │   ├── AdjustModal.tsx                # Adjust SL/TP dialog
│   │   ├── PositionsPanel.tsx             # Current positions table
│   │   ├── HistoryPanel.tsx               # Trade history table
│   │   ├── TeamPanel.tsx                  # Team status grid
│   │   ├── MetricCard.tsx                 # Dashboard metric card
│   │   └── Toast.tsx                      # Toast notification
│   ├── TradeLog/PaperTradeLog.tsx         # Bottom trade log bar
│   ├── RolePanel/RolePanel.tsx            # Role detail panel
│   └── SkillMarket/SkillMarket.tsx        # Skill marketplace
└── lib/
    ├── analysis/                          # 8-Role Analysis Engine
    │   ├── index.ts                       # runFullAnalysis() entry point
    │   ├── types.ts                       # AnalysisInput, FullAnalysis types
    │   ├── indicators.ts                  # Technical indicators (PSAR, EMA, ADX, RSI, MACD, ATR, Bollinger)
    │   ├── collector.ts                   # Data quality + orderbook analysis
    │   ├── strategist.ts                  # Technical signal generation
    │   ├── risk-officer.ts                # Risk scoring + position sizing
    │   ├── analyst.ts                     # Multi-TF trend + S/R + patterns
    │   ├── researcher.ts                  # Statistical analysis + beta
    │   ├── executor.ts                    # Liquidity + slippage estimation
    │   ├── cto.ts                         # Data audit + anomaly detection
    │   └── ceo.ts                         # Consensus aggregation + action plan
    ├── market-adapter.ts                  # Market detection + unified adapter
    ├── paper-trading.ts                   # Paper trading engine (localStorage)
    ├── hooks.ts                           # React data hooks
    ├── types.ts                           # Role/Company type definitions
    ├── utils.ts                           # Utility functions
    ├── api.ts                             # API client
    └── demo-store.ts                      # Demo data (being replaced)
```

### 8-Role Analysis Pipeline

```
Market Data (Binance/Sina/Yahoo)
    │
    ▼
┌─────────┐  ┌───────────┐  ┌────────────┐
│Collector │  │Researcher │  │  Executor  │
│(data)    │  │(stats)    │  │(liquidity) │
└────┬─────┘  └─────┬─────┘  └─────┬──────┘
     │              │              │
     ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Strategist│  │ Analyst  │  │Risk Ofcr │
│(signals) │  │(patterns)│  │(risk)    │
└────┬─────┘  └─────┬────┘  └─────┬────┘
     │              │              │
     ▼              ▼              ▼
┌─────────────────────────────────────┐
│            CTO (audit)              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    CEO (consensus → action plan)    │
└─────────────────────────────────────┘
```

Each role runs independently (V1). CEO aggregates all outputs into a final verdict (LONG / SHORT / WAIT) with weighted scoring.

### Data Flow

1. **User opens symbol detail page**
2. `runFullAnalysis(symbol)` called
3. Fetches market data via API routes:
   - `/api/market/klines` (1h, 4h, 1d timeframes)
   - `/api/market/depth` (crypto only)
   - `/api/market/trades` (crypto only)
   - `/api/market/ticker24h`
4. Each role processes data independently
5. CEO aggregates all role outputs
6. UI renders structured analysis cards

### Market Data Sources

| Market | Quotes | Klines | Depth | Trades |
|--------|--------|--------|-------|--------|
| Crypto (USDT) | Binance | Binance | Binance | Binance |
| HK Stocks (.HK) | Sina Finance | Yahoo Finance | — | — |
| A-Shares (.SS/.SZ) | Sina Finance | Sina JSONP | — | — |

**Key API Details:**
- Binance: `https://data-api.binance.vision` (not api.binance.com, which returns 451)
- Sina quotes: `https://hq.sinajs.cn/list=...` (GBK encoding, needs `Referer` header)
- Sina klines: `https://quotes.sina.cn/cn/api/jsonp_v2.php/.../CN_MarketDataService.getKLineData`
- Yahoo Finance: `https://query1.finance.yahoo.com/v8/finance/chart/`
- 4h klines: Yahoo doesn't support 4h natively; fetch 1h and aggregate

### Paper Trading

- **Engine**: `frontend/lib/paper-trading.ts`
- **Storage**: localStorage key `quantarmy_paper_account`
- **Initial capital**: $100,000
- **Fee**: 0.1% per trade
- **Operations**: `openPosition()`, `closePosition()`, `adjustPosition()`, `resetAccount()`
- **Queries**: `getPortfolio()`, `getPortfolioSummary()`, `getTotalEquity()`

### Navigation

```
Logo ("量化军团") → /company/overview (hub)
📊 仪表盘        → /company (paper trading)
📋 自选标的       → /company/watchlist
[8 role links]   → /company/[role]
⚙️ 设置          → /company/settings
```

## Backend Architecture (Not Yet Deployed)

The Python FastAPI backend exists at `backend/` but is not currently deployed. All functionality runs through Next.js API routes (serverless on Vercel).

### Backend Stack (planned)
- **Framework**: FastAPI
- **Database**: SQLite (async, aiosqlite)
- **Skills**: Subprocess sandbox (30s timeout, 256MB limit)
- **WebSocket**: Per-company rooms
- **Deploy target**: Render (free plan)

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://quantarmy.vercel.app |
| Backend | Render (planned) | TBD |
| Code | GitHub | https://github.com/kylelinger/quantarmy |

### Deploy Process
```bash
cd frontend
npm run build        # Verify build passes
cd ..
git add -A && git commit -m "<type>: <desc>"
cd frontend && vercel --prod --yes   # Deploy to Vercel
cd .. && git push origin main        # Push to GitHub
```

Note: `git push` does NOT auto-trigger Vercel deploy. Must run `vercel --prod` explicitly.
