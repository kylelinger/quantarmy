# Changelog

All notable changes to QuantArmy (量化军团) are documented here.

Format: [SemVer](https://semver.org/) · Types: Added, Changed, Fixed, Removed

---

## [1.0.0] — 2026-03-12

> 🎉 First stable release. 8-role AI analysis on real market data, paper trading, 3-market coverage.

### Added
- **8-Role AI Analysis Engine** (`frontend/lib/analysis/`)
  - Collector: 24h volume, bid/ask ratio, large trades, fund flow
  - Strategist: PSAR (slow AF), EMA 20/50/200, ADX, RSI, MACD
  - Risk Officer: ATR%, volatility percentile, position sizing, SL/TP
  - Analyst: multi-timeframe trend, S/R levels, candlestick patterns
  - Researcher: volatility stats, BTC beta, day-of-week seasonality
  - Executor: spread, slippage estimation, liquidity scoring
  - CTO: data completeness audit, anomaly detection
  - CEO: weighted consensus aggregation, action plan, invalidation
- **Multi-Market Data** — 3 markets, all real-time, zero API keys
  - Crypto: Binance API (`data-api.binance.vision`)
  - HK Stocks: Sina Finance real-time quotes + Yahoo Finance klines
  - A-Shares: Sina Finance real-time quotes + Sina JSONP klines
- **Paper Trading Engine** (`frontend/lib/paper-trading.ts`)
  - $100K simulated account, 0.1% fee model
  - Open long/short, close, adjust (SL/TP) positions
  - Equity curve tracking with lightweight-charts
  - Trade history with P&L calculation
  - Account reset functionality
  - localStorage persistence (`quantarmy_paper_account`)
- **Overview Page** (`/company/overview`)
  - System-wide dashboard: team status, watchlist, account, system info
  - 8-role grid with status indicators
  - Quick action links
- **Dashboard** (`/company`) — paper trading control center
  - Total equity, P&L, available funds, position ratio, win rate
  - Equity curve chart
  - Tabs: current positions / trade history / team status
  - Order modal with auto-fill market price
- **Watchlist System** (`/company/watchlist`)
  - Star-based toggle (⭐ add/remove)
  - Search with autocomplete: 38 crypto + 30 HK stocks + 30 A-shares
  - Market tabs: ₿ Crypto / 🇭🇰 HK / 🇨🇳 A-shares
  - Keyboard navigation (↑↓ Enter Esc)
- **Symbol Detail Page** (`/company/watchlist/[symbol]`)
  - TradingView real-time K-line chart (tv.js widget API)
  - 8-role analysis cards with structured data
  - CEO Decision Card: verdict, consensus, action plan
  - Key Metrics panel: PSAR, EMA, ADX, RSI, risk score
  - Quick order bar (做多/做空, preset amounts)
- **24 Default Skill Cards** (3 per role × 8 roles)
- **Landing Page** — bilingual hero, product flow, role grid
- **Toast Notification System** — success/error/info, 3.5s auto-dismiss
- **GitHub Skill Import** (stub) — `/api/skills/import`

### Changed
- Company name: `量化军团` (was `QuantArmy Demo`)
- Sidebar: Dashboard + Watchlist at top priority
- TradingView: tv.js widget API (was iframe, was script inject)

### Removed
- US stock market support (no free real-time API without key)
- Yahoo Finance for live quotes (replaced by Sina Finance)
- "停止交易" button from sidebar
- Priority emoji from watchlist cards

---

## [0.1.0-dev] — 2026-03-11

> Initial skeleton and infrastructure.

### Added
- Project initialized with Next.js 15 + Tailwind CSS 3.4 + shadcn/ui
- Backend skeleton: FastAPI + SQLite + WebSocket (not deployed)
- 8-role type system: CEO, CTO, Strategist, Risk Officer, Collector, Executor, Analyst, Researcher
- PSAR Trend Following skill (builtin)
- Risk Officer skill (builtin)
- Backtest engine (walk-forward, SL/TP, Sharpe/drawdown)
- Frontend deployed to Vercel
- Backend config for Render (not yet deployed)
- Documentation: ARCHITECTURE.md, API_SPEC.md, SKILL_SPEC.md, PROJECT_PLAN.md

---

## Links
- **Live**: https://quantarmy.vercel.app
- **GitHub**: https://github.com/kylelinger/quantarmy
