# QuantArmy — Session Context

> Updated after each significant session.
> Latest entry on top.

---

## 2026-03-13 — V2 Symbol Detail Page + Debate Tabs

**Milestone: Symbol detail page upgraded from V1 demo analysis to live V2 multi-agent output.**

### What shipped:
- Symbol detail page now runs **`runV2Analysis(symbol, onProgress)`** instead of V1 `runFullAnalysis`
- Added **5-phase progress flow**
  - collecting
  - analyzing
  - debating
  - deciding
  - storing
- Added **CEO decision card** driven by V2 output
  - verdict
  - confidence
  - consensus score
  - bullish/bearish/neutral vote counts
  - entry / stop loss / take profit
  - dissent / invalidation
- Added **7 non-CEO agent cards** with:
  - stance / direction / confidence
  - skill summaries
  - expandable reasoning
  - related debate entries
  - revised-view marker after concession
- Added **debate visualization into the detail page**
  - initial version: right-side collapsible panel
  - final version chosen by CEO: **independent tabs below the K-line chart**
- Added **detail page tab structure** below chart:
  - `🧠 团队分析`
  - `⚔️ 辩论记录`
  - `🧬 Agent 记忆`
- Added **full-width debate tab** with:
  - debate stat cards
  - before/after stance comparison
  - round-by-round challenge / rebuttal timeline
- Added **Agent memory tab** using localStorage-backed `getAgentMemory(role)`
- `detectMarket()` now supports **`us_stock`** for pure-letter tickers

### Architecture decisions:
- V2.0 debate remains **rule-based only** (no LLM dependency)
- Memory persistence remains **localStorage**, capped at **200 records per agent**
- CEO does **not** debate; CEO aggregates weighted consensus only
- CTO may challenge any role and can veto when data quality `< 50`
- Concession reduces challenged agent confidence by **25%**
- Symbol detail page now serves as the main **V2 explainability surface**

### Deployment / verification:
- Commit `a04f318` — live V2 engine wired into symbol detail page
- Commit `a743bca` — detail page refactored to tabbed layout under K-line chart
- Production alias verified:
  - `https://frontend-beige-kappa-51.vercel.app/company/watchlist/BTCUSDT`
- Verified visible tabs:
  - 团队分析
  - 辩论记录
  - Agent 记忆

### Key files:
- `frontend/app/company/watchlist/[symbol]/page.tsx`
- `frontend/lib/v2/orchestrator.ts`
- `frontend/lib/v2/types.ts`
- `frontend/lib/v2/debate/engine.ts`
- `frontend/lib/v2/memory/store.ts`
- `frontend/lib/market-adapter.ts`

### What's next:
- Optionally verify V2 detail page on more symbols / markets
- Consider whether a default-open debate tab is better UX
- Keep docs aligned with V2 reality

---

## 2026-03-12 — v1.0.0 Release

**Milestone: First stable release with real market data + 8-role analysis.**

### What shipped:
- 8-role AI analysis engine running on real Binance + Sina Finance data
- 3-market coverage: Crypto, HK Stocks, A-Shares (all real-time, zero API keys)
- Paper trading: $100K sim account, long/short, SL/TP, equity curve
- Overview page: system-wide dashboard (team, watchlist, account)
- Symbol detail page: TradingView chart + 8 structured analysis cards + CEO decision
- Watchlist: star-toggle, autocomplete search, 98 assets (38 crypto + 30 HK + 30 A-shares)
- 24 default skill cards (3 per role)
- Toast notifications, code split (7 trading components)
- Domain: quantarmy.vercel.app

### Architecture decisions:
- All analysis runs client-side (no backend needed for V1)
- Market data proxied through Next.js API routes (server-side, avoids CORS)
- US stocks removed (no free real-time source without API key)
- Sina Finance replaces Yahoo Finance for HK/A-share quotes (real-time vs 15min delay)
- HK klines still via Yahoo Finance (historical data OK)
- Paper trading in localStorage (no server persistence in V1)

### Key files:
- `frontend/lib/analysis/` — 8-role analysis engine (11 files, ~2000 lines)
- `frontend/lib/paper-trading.ts` — paper trading engine
- `frontend/lib/market-adapter.ts` — multi-market data adapter
- `frontend/app/company/overview/page.tsx` — overview hub
- `frontend/app/company/watchlist/[symbol]/page.tsx` — symbol detail + analysis

### What's next (V1.1):
- Backend deploy to Render
- Real-time price updates (WebSocket or polling)
- Mobile responsiveness (sidebar fixed 280px, unusable on phones)
- Landing page improvements
- V2 battle/debate system design

---

## 2026-03-11 — Sessions 1-4: Project Bootstrap

**What happened:**
- Project initialized with Next.js 15 + Tailwind 3.4
- Backend skeleton: FastAPI + SQLite + WebSocket
- Frontend skeleton: all pages, components, types, API client
- Deployed to Vercel: `frontend-beige-kappa-51.vercel.app`
- GitHub repo: `github.com/kylelinger/quantarmy`

---

## Quick Reference

| Item | Value |
|------|-------|
| Version | 1.0.0 |
| Live URL | https://quantarmy.vercel.app |
| GitHub | https://github.com/kylelinger/quantarmy |
| Framework | Next.js 15.5 + Tailwind 3.4.19 |
| Markets | Crypto (Binance) · HK (Sina) · A-shares (Sina) |
| Analysis | 8 roles, client-side, real data |
| Trading | Paper only, localStorage, $100K |
| Backend | Not deployed (planned: Render) |
| Tailwind | v3.4.19 |
| Deploy | `vercel --prod --yes` (manual) |
