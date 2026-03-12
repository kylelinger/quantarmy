# Changelog

All notable changes to QuantArmy will be documented here.
Format: [SemVer](https://semver.org) | [Keep a Changelog](https://keepachangelog.com)

---

## [Unreleased]

### Planned
- LLM skill adapter (GitHub import)
- V2 battle/debate mode
- Equity curve chart component
- Backend cloud deployment (Render)
- Company settings page

---

## [0.2.0-dev] — 2026-03-12

### Added

**24 Default Skill Cards** (3 per role × 8 roles)
- CEO: Consensus Judge, Capital Allocator, Thesis Validator
- CTO: Data Integrity Checker, Signal Reliability Auditor, Pipeline Health Monitor
- Strategist: PSAR Trend, RSI Mean Reversion, Breakout Momentum
- Risk Officer: Position Guard, Volatility Guard, Drawdown Scenario
- Collector: News Pulse, Social Sentiment, Event Tracker
- Analyst: Market Structure, Factor Snapshot, Backtest Lens
- Researcher: Comparable Cases, Narrative Tracker, Open Source Hunter
- Executor: Liquidity Check, Slippage Estimator, Execution Plan

**Symbol Detail Page** (`/company/watchlist/[symbol]`)
- TradingView embedded real-time chart (free, no API key needed)
- Auto-maps crypto symbols → `BINANCE:`, US stocks → `NASDAQ:`/`NYSE:`
- Dark theme, Chinese locale, MA + Volume studies
- CEO summary panel, user notes panel
- 8-role independent analysis grid (V1 product shape)

**V1 Product Shape**
- 8 roles operate as independent agents
- Each role gives its own analysis per symbol
- CEO summarizes but does not override
- Users see team disagreement and consensus naturally

**Demo Infrastructure**
- Shared mutable demo store (`demo-store.ts`) for roles + watchlist
- Skill equip route (`PUT /api/company/[id]/roles/[roleType]/skill`)
- All demo routes use shared store for consistent state
- Role page: framing section, default card count, current viewpoint display
- Skill market: "默认卡组" section header, active badge
- Watchlist: clickable symbol links to detail page

**Backend**
- `backend/app/skills/catalog.py` — centralized skill catalog (24 skills)
- `backend/app/skills/seed.py` — rewritten to seed from catalog with update support

### Changed
- Role page: backtest button now only shows for strategist role
- Skill market browse: improved layout with card grouping
- Watchlist item: symbol text is now a link to detail page

---

## [0.1.0-dev] — 2026-03-11

### Added

**Frontend**
- Full TypeScript types, API client, utilities
- Sidebar, Dashboard, RolePanel, SkillMarket, TradeLog components
- Company pages: overview, creation wizard, role detail
- Watchlist system with batch add, priority, analysis display

**Backend**
- FastAPI app with SQLite async DB
- Company CRUD, Role management, Skill registry APIs
- TradingEngine with tick loop pipeline
- BacktestEngine with walk-forward SL/TP simulation
- PSAR Trend Following skill (fully implemented)
- Risk Officer skill (position sizing, drawdown guard)
- WebSocket manager with per-company rooms
- Subprocess-based skill sandbox

**Documentation**
- ARCHITECTURE.md, SKILL_SPEC.md, API_SPEC.md
- CONTEXT.md, PROJECT_PLAN.md, CHANGELOG.md, README.md

**Deployment**
- Vercel frontend: `https://frontend-beige-kappa-51.vercel.app`
- GitHub repo: `https://github.com/kylelinger/quantarmy`
- Render config: `render.yaml`

### Architecture Decisions
- SQLite + aiosqlite (zero-config async DB)
- Subprocess skill isolation (no Docker)
- Unified `{ ok, data, error }` API response
- WebSocket rooms per company_id
- BaseSkill universal interface

---

## [0.0.1] — 2026-03-11

### Added
- Initial project structure, README, PROJECT_PLAN.md

---

## Versioning Policy

- **MAJOR**: Breaking API changes or fundamental architecture changes
- **MINOR**: New features (new skills, new roles, new pages)
- **PATCH**: Bug fixes, documentation, minor improvements
- **-dev**: Work in progress, not released
