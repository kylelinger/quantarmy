# Changelog

All notable changes to QuantArmy will be documented here.
Format: [SemVer](https://semver.org) | [Keep a Changelog](https://keepachangelog.com)

---

## [Unreleased]

### Planned
- Risk Officer built-in skill
- Backtest engine
- LLM skill adapter (GitHub import)
- WebSocket live feed wire-up
- Frontend API integration (replace placeholder data)

---

## [0.1.0-dev] — 2026-03-11

### Added

**Frontend**
- `lib/types.ts` — All TypeScript types: Company, Role, Skill, Position, Trade, BacktestResult, Signal, WSEvent
- `lib/api.ts` — Full API client: companyApi, roleApi, skillApi, tradingApi, marketApi
- `lib/utils.ts` — Utilities: cn, formatCurrency, formatPercent, formatNumber, timeAgo, pnlColor
- `components/Sidebar` — Role navigation sidebar with online/idle/error status dots
- `components/Dashboard` — Company overview: equity metrics, positions table
- `components/RolePanel` — Role detail: active skill display, parameter editor, backtest stats, log viewer
- `components/SkillMarket` — Browse skills + GitHub import tab with import status flow
- `components/TradeLog` — Real-time log strip at bottom of layout
- `app/company/layout.tsx` — Shell layout: Sidebar (left) + content (right) + TradeLog (bottom)
- `app/company/page.tsx` — Dashboard (company overview)
- `app/company/new/page.tsx` — Company creation wizard (name, capital, market)
- `app/company/[role]/page.tsx` — Dynamic role page with RolePanel + SkillMarket

**Backend**
- `app/core/config.py` — Configuration constants
- `app/core/database.py` — SQLAlchemy async engine + session factory
- `app/models/company.py` — Company, Role, Position, Trade, Message ORM models
- `app/models/skill.py` — Skill, SkillImport ORM models
- `app/api/company.py` — Company CRUD API
- `app/api/roles.py` — Role management API
- `app/api/skills.py` — Skill registry + import API
- `app/api/trading.py` — Positions, history, start/stop API
- `app/api/market.py` — Market symbols, price, klines API
- `app/services/trading_engine.py` — Simulation trading engine with tick loop
- `app/services/skill_adapter.py` — LLM-powered GitHub repo adapter (skeleton)
- `app/services/data_pipeline.py` — Binance REST data fetcher
- `app/sandbox/runner.py` — Subprocess-based skill sandbox runner
- `app/ws/manager.py` — WebSocket connection manager (per-company rooms)
- `app/ws/router.py` — WebSocket endpoint with heartbeat
- `app/skills/base.py` — BaseSkill interface + TradeContext + SkillOutput
- `app/skills/builtin/psar_trend.py` — **PSAR Trend Following skill (fully implemented)**
  - Parabolic SAR with configurable AF
  - EMA trend filter
  - ADX regime guard (no trade in ranging markets)
  - ATR-based SL/TP
- `app/skills/seed.py` — Seeds built-in skills to DB on startup
- `main.py` — FastAPI app: lifespan, CORS, all routers
- `requirements.txt` — Backend dependencies

**Documentation**
- `docs/ARCHITECTURE.md` — Full system architecture with data flow diagrams
- `docs/SKILL_SPEC.md` — Complete skill development guide
- `docs/API_SPEC.md` — Full REST + WebSocket API reference
- `docs/CONTEXT.md` — Session context for AI agent continuity
- `docs/PROJECT_PLAN.md` — Product roadmap and feature prioritization
- `CHANGELOG.md` — This file
- `README.md` — Quick start guide

**Project Setup**
- Git repository initialized
- .gitignore for Python/Node/data files

### Architecture Decisions
- SQLite + aiosqlite for async DB operations (zero-config)
- Subprocess-based skill isolation (no Docker required)
- Unified `{ ok, data, error }` API response format
- WebSocket rooms per company_id
- BaseSkill as the universal interface for all skills

---

## [0.0.1] — 2026-03-11

### Added
- Initial project structure
- README + PROJECT_PLAN.md
- Git initialization

---

## Versioning Policy

- **MAJOR**: Breaking API changes or fundamental architecture changes
- **MINOR**: New features (new skills, new roles, new pages)
- **PATCH**: Bug fixes, documentation, minor improvements
- **-dev**: Work in progress, not released
