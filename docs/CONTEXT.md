# QuantArmy — Session Context

> Updated after each significant session.
> Latest entry on top.

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
