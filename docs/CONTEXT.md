# QuantArmy — Session Context

> This file is updated after each significant development session.
> The AI reads this at the start of every session to restore context.
> Format: latest entry at top.

---

## 2026-03-11 — Session 2: Full Skeleton Build

**What happened:**
- User (tutu) confirmed: tech stack OK, 8 roles OK, focus on Strategist first
- Built complete frontend skeleton:
  - `lib/types.ts` — all TypeScript types (Company, Role, Skill, Position, etc.)
  - `lib/api.ts` — full API client (companyApi, roleApi, skillApi, tradingApi, marketApi)
  - `lib/utils.ts` — formatCurrency, formatPercent, cn, pnlColor, timeAgo
  - `components/Sidebar` — role navigation sidebar with status indicators
  - `components/Dashboard` — equity metrics + positions table
  - `components/RolePanel` — role detail + parameter editor + backtest display
  - `components/SkillMarket` — browse + GitHub import tabs
  - `components/TradeLog` — real-time log strip (bottom of layout)
  - `app/company/layout.tsx` — sidebar + tradelog layout wrapper
  - `app/company/page.tsx` — dashboard overview
  - `app/company/[role]/page.tsx` — dynamic role page
  - `app/company/new/page.tsx` — company creation wizard
- Built complete backend skeleton:
  - `app/core/config.py` — all configuration constants
  - `app/core/database.py` — SQLAlchemy async setup
  - `app/models/company.py` — Company, Role, Position, Trade, Message models
  - `app/models/skill.py` — Skill, SkillImport models
  - `app/api/company.py` — company CRUD routes
  - `app/api/roles.py` — role management routes
  - `app/api/skills.py` — skill list/import/backtest routes
  - `app/api/trading.py` — positions/history/start/stop routes
  - `app/api/market.py` — symbols/price/klines routes
  - `app/services/trading_engine.py` — tick loop skeleton with pipeline structure
  - `app/services/skill_adapter.py` — LLM adapter pipeline skeleton
  - `app/services/data_pipeline.py` — Binance data fetcher
  - `app/sandbox/runner.py` — subprocess-based skill executor
  - `app/ws/manager.py` — WebSocket connection manager
  - `app/ws/router.py` — WS endpoint
  - `app/skills/base.py` — BaseSkill interface + TradeContext + SkillOutput
  - `app/skills/builtin/psar_trend.py` — **PSAR Trend Skill (fully implemented)**
  - `app/skills/seed.py` — built-in skill seeder
  - `main.py` — FastAPI app with lifespan + all routers
- Documentation updated: ARCHITECTURE.md, SKILL_SPEC.md, API_SPEC.md
- `requirements.txt` written

**Current status:**
- ✅ Frontend skeleton complete (all pages/components exist)
- ✅ Backend skeleton complete (all routes exist, return stubs)
- ✅ Strategist skill (PSAR Trend) fully implemented
- ❌ Frontend dependencies NOT installed yet (`pnpm install` needed)
- ❌ Backend virtualenv NOT created yet (`pip install -r requirements.txt` needed)
- ❌ Trading engine pipeline NOT connected (roles don't call skills yet)
- ❌ Backtest engine NOT implemented
- ❌ LLM adapter NOT implemented (skill import is a stub)
- ❌ Data pipeline NOT tested with live Binance API

**Next tasks (priority order):**
1. Install dependencies (frontend + backend)
2. Test backend startup (`uvicorn main:app --reload`)
3. Test frontend startup (`npm run dev`)
4. Connect trading engine: tick loop → role pipeline → skill execute
5. Implement backtest engine
6. Wire frontend API calls (replace placeholder data with real API)
7. Implement LLM skill adapter

---

## 2026-03-11 — Session 1: Planning

**What happened:**
- Brainstormed product concept with tutu
- Key decisions:
  - 8-role system: CEO, CTO, Strategist, Risk Officer, Collector, Executor, Analyst, Researcher
  - Pure simulation trading (no real exchange connections)
  - AI-powered GitHub import with LLM adaptation
  - SQLite for v0.1, PostgreSQL later
  - Next.js + FastAPI stack
- Created: README, .gitignore, docs/PROJECT_PLAN.md
- git init + first commit

**Current status:** Skeleton planning only

---

## Active Decisions

| Decision | Value | Rationale |
|---|---|---|
| Project name | quantarmy | English, catchy, clear |
| First role to implement | Strategist | Core value, most visible |
| First built-in skill | PSAR Trend | Battle-tested in AItrading production |
| DB | SQLite async | Zero config, good enough for v0.1 |
| Skill isolation | subprocess | No Docker dependency |
| Auth | None in v0.1 | Single user, localhost |
| LLM for import | TBD (configurable) | OpenAI/Anthropic/local |

---

## Known Issues / TODOs

- [ ] Frontend `pnpm install` not run
- [ ] Backend `pip install -r requirements.txt` not run
- [ ] Trading engine tick loop not connected to role pipeline
- [ ] Backtest engine needs implementation
- [ ] LLM adapter: choose model, implement generate_adapter()
- [ ] Risk Officer built-in skill (not yet implemented)
- [ ] Risk metrics (VaR, Sharpe) computation
- [ ] WebSocket broadcasting from trading engine tick
- [ ] Company state persistence between restarts (engine re-attach)
