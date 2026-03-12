# QuantArmy — Session Context

> Updated after each significant session.
> Latest entry on top.

---

## 2026-03-12 — Session 4: V1 Product Shape + 24 Skill Cards + Symbol Detail

**What happened:**
- Defined V1 product shape: 8 independent agents, each outputs own analysis independently
- Built complete 24-skill catalog (3 per role × 8 roles) — both backend `catalog.py` and frontend demo API
- Created symbol detail page `/company/watchlist/[symbol]` with embedded TradingView real-time chart
- TradingView widget: free, no API key, real-time K-line, dark theme, MA + Volume studies
- Symbol mapping: `XXXUSDT` → `BINANCE:XXXUSDT`, US stocks → `NASDAQ:` or `NYSE:`
- Shared demo store (`demo-store.ts`) so role skill switching and watchlist mutations persist across API calls
- All 8 roles now have demo last_output viewpoints per symbol (BTCUSDT fully populated)
- Role page enhanced: shows role framing, default card count, current viewpoint, backtest button only for strategist
- Skill market section improved: shows "默认卡组" header, active badge on equipped skill
- Watchlist symbol names are now clickable links to detail page
- All demo API routes use shared mutable store for consistency
- Frontend build passing ✅

**24 Default Skill Cards:**

| Role | Card 1 | Card 2 | Card 3 |
|---|---|---|---|
| CEO | Consensus Judge | Capital Allocator | Thesis Validator |
| CTO | Data Integrity Checker | Signal Reliability Auditor | Pipeline Health Monitor |
| Strategist | PSAR Trend | RSI Mean Reversion | Breakout Momentum |
| Risk Officer | Position Guard | Volatility Guard | Drawdown Scenario |
| Collector | News Pulse | Social Sentiment | Event Tracker |
| Analyst | Market Structure | Factor Snapshot | Backtest Lens |
| Researcher | Comparable Cases | Narrative Tracker | Open Source Hunter |
| Executor | Liquidity Check | Slippage Estimator | Execution Plan |

**Files changed this session:**
- `backend/app/skills/catalog.py` — NEW: 24 built-in skill definitions
- `backend/app/skills/seed.py` — REWRITTEN: seeds from catalog, updates existing
- `frontend/lib/demo-store.ts` — NEW: shared mutable demo state for roles + watchlist
- `frontend/app/api/skills/route.ts` — REWRITTEN: 24 demo skills with filtering
- `frontend/app/api/company/[id]/roles/route.ts` — REWRITTEN: uses demo-store
- `frontend/app/api/company/[id]/roles/[roleType]/skill/route.ts` — NEW: skill equip endpoint
- `frontend/app/api/company/[id]/watchlist/route.ts` — REWRITTEN: uses demo-store
- `frontend/app/api/company/[id]/watchlist/[itemId]/route.ts` — REWRITTEN: uses demo-store
- `frontend/app/company/watchlist/page.tsx` — Updated: symbol links to detail page
- `frontend/app/company/watchlist/[symbol]/page.tsx` — NEW: symbol detail page
- `frontend/components/Market/TradingViewChart.tsx` — NEW: TradingView embedded chart
- `frontend/app/company/[role]/page.tsx` — Enhanced: role framing, viewpoint, conditional backtest

**Current status:**
- ✅ 24 built-in skills defined (backend + frontend)
- ✅ Symbol detail page with real-time TradingView chart
- ✅ 8 roles with independent viewpoints per symbol
- ✅ Shared demo state for consistent API behavior
- ✅ Frontend build passing
- ⏳ Vercel deploy pending (push + auto-deploy)
- ❌ LLM skill adapter (GitHub import is still a stub)
- ❌ Backend cloud deployment (Render)
- ❌ V2 battle/debate system

**Next tasks:**
1. Push to GitHub + Vercel auto-deploy
2. Backend deployment to Render (via dashboard)
3. LLM adapter for GitHub skill import
4. V2 battle mode design
5. Equity curve chart component

---

## 2026-03-11 — Session 3: Full Pipeline Live

**What happened:**
- Connected TradingEngine to role pipeline: Strategist → Risk Officer → paper execution
- Implemented BacktestEngine: walk-forward backtest with SL/TP simulation, full metrics
- Built Risk Officer skill: max position sizing, drawdown halt, exposure cap, SL bounds
- Wired frontend to real API: CompanyContext provider, React hooks, WebSocket log feed
- Tested everything end-to-end

**Current status:**
- ✅ Backend fully functional (all APIs work, tested)
- ✅ TradingEngine: tick loop → fetch klines → strategist → risk officer → paper execute
- ✅ BacktestEngine: walk-forward, SL/TP, metrics, equity curve
- ✅ Frontend: all pages use real API hooks, WebSocket connected

---

## Active Decisions

| Decision | Value |
|---|---|
| Project name | quantarmy |
| V1 product | 8 independent agents, user picks symbols, roles analyze independently |
| V2 product | Battle/debate → CEO aggregates with validity check |
| Default skills | 3 per role × 8 roles = 24 total |
| Real-time chart | TradingView embedded widget (free, no key) |
| Demo state | Shared mutable store in demo-store.ts |
| Backtest interval mapping | 1w→1h, 1m→1h, 3m→4h, 6m→1d, 1y→1d |
| Skill cache key | skill_id + hash(config) |
| WS event cap | Last 200 events in client |
| Company state | localStorage + API |

## Known Issues
- [ ] Backend not deployed publicly yet (Render pending)
- [ ] GitHub import pipeline is a stub (needs LLM)
- [ ] Company settings page not built
- [ ] Equity curve chart needs charting library
