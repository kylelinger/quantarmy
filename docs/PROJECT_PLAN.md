# QuantArmy — Project Plan

> 量化军团：AI 量化研究团队模拟器

## Vision

QuantArmy is a "productized quant research team" — not auto-trading, but multi-perspective analysis for user decision-making. Users assemble an 8-role AI company that analyzes markets from different angles.

## Roadmap

### ✅ V1.0 — Independent Analysis (Released 2026-03-12)

Each role analyzes independently, CEO aggregates.

| Feature | Status | Notes |
|---------|--------|-------|
| 8-role AI analysis engine | ✅ Done | Client-side, real data |
| Multi-market data (Crypto/HK/A-shares) | ✅ Done | Binance + Sina, real-time |
| Paper trading ($100K sim) | ✅ Done | localStorage, long/short |
| Watchlist + search | ✅ Done | 98 assets, star-toggle |
| Symbol detail + TradingView chart | ✅ Done | tv.js widget API |
| Overview page | ✅ Done | System-wide dashboard |
| Dashboard (trading control) | ✅ Done | Equity curve, positions, history |
| 24 default skill cards | ✅ Done | 3 per role × 8 |
| Vercel deployment | ✅ Done | quantarmy.vercel.app |

### 🔄 V1.1 — Polish & Backend (In Progress)

| Feature | Status | Notes |
|---------|--------|-------|
| Backend deploy (Render) | ⬜ Todo | FastAPI + SQLite |
| Real-time price updates | ⬜ Todo | WebSocket or polling |
| Mobile responsiveness | ⬜ Todo | Sidebar 280px blocks mobile |
| Landing page v2 | ⬜ Todo | Better onboarding |
| demo-store.ts cleanup | ⬜ Todo | Replace remaining fake data |
| Type cleanup (hooks.ts) | ⬜ Todo | Remove `any` types |

### 🔮 V2.0 — Battle Mode (Planned)

Roles engage in structured debate before CEO decides.

| Feature | Status | Notes |
|---------|--------|-------|
| Challenge pairs (bull vs bear) | ⬜ Design | See V2_BATTLE_MODE.md |
| Weighted voting system | ⬜ Design | Confidence-weighted |
| Battle replay UI | ⬜ Design | Step-by-step visualization |
| Validity checking | ⬜ Design | CEO validates arguments |

### 🌟 V3.0 — Community (Future)

| Feature | Notes |
|---------|-------|
| User auth (JWT) | Multi-user support |
| Skill marketplace | Community-shared skills |
| GitHub skill import | Auto-parse + sandbox |
| Team templates | Pre-built configurations |
| Leaderboard | Paper trading rankings |

## 8 Roles

| # | Role | Icon | Responsibility |
|---|------|------|---------------|
| 1 | CEO | 👔 | Final decision, consensus aggregation |
| 2 | CTO | ⚙️ | Data quality audit, anomaly detection |
| 3 | Strategist | 📈 | Technical signals (PSAR, EMA, ADX, RSI) |
| 4 | Risk Officer | 🛡 | Risk scoring, position sizing, SL/TP |
| 5 | Collector | 📡 | Market data collection, orderbook analysis |
| 6 | Executor | ⚡ | Execution strategy, slippage estimation |
| 7 | Analyst | 📊 | Multi-TF analysis, S/R, patterns |
| 8 | Researcher | 🔬 | Statistical analysis, beta, seasonality |

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 15 + Tailwind 3.4 + TypeScript | ✅ Deployed |
| Charts | TradingView (tv.js) + lightweight-charts | ✅ Working |
| Analysis | Client-side TypeScript engine | ✅ Working |
| Trading | localStorage paper engine | ✅ Working |
| Backend | FastAPI + SQLite + aiosqlite | ⬜ Not deployed |
| Deploy | Vercel (frontend) + Render (backend, planned) | 🔄 Partial |

## Data Sources

| Market | Source | Real-time | API Key |
|--------|--------|-----------|---------|
| Crypto | Binance (`data-api.binance.vision`) | ✅ | None |
| HK Stocks | Sina Finance (`hq.sinajs.cn`) | ✅ | None |
| A-Shares | Sina Finance (`hq.sinajs.cn`) | ✅ | None |
| HK Klines | Yahoo Finance | Historical | None |

## Conventions

- **Git commits**: `<type>: <description>` (feat/fix/docs/refactor/chore)
- **Branching**: main / dev / feature/xxx / fix/xxx
- **Versioning**: SemVer
- **Deploy**: `npm run build` → `git commit` → `vercel --prod --yes` → `git push`
- **Naming**: English (files, variables, components)
- **No real money**: All trading is simulated
