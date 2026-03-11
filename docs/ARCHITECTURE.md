# QuantArmy — System Architecture

**Version**: 0.1.0 | **Updated**: 2026-03-11

---

## Overview

QuantArmy is a web-based AI quantitative trading team simulator. Users assemble an 8-role AI company, assign "skills" (trading strategies, risk models, data pipelines) to each role, and run the team in a fully simulated paper trading environment.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (User)                           │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │   Sidebar    │  │           Main Content Panel              │ │
│  │  Role List   │  │  Dashboard / Role Config / Skill Market  │ │
│  │  (8 roles)   │  │                                          │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
│              ↕ REST API + WebSocket                              │
└─────────────────────────────────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   FastAPI Backend        │
              │  ┌───────────────────┐  │
              │  │  Trading Engine   │  │
              │  │  (tick loop)      │  │
              │  └────────┬──────────┘  │
              │           │             │
              │  ┌────────▼──────────┐  │
              │  │  Role Pipeline    │  │
              │  │ Collector→Strategy│  │
              │  │ →RiskOfficer→CEO  │  │
              │  │ →Executor→Analyst │  │
              │  └────────┬──────────┘  │
              │           │             │
              │  ┌────────▼──────────┐  │
              │  │  Skill Sandbox    │  │
              │  │  (subprocess iso) │  │
              │  └───────────────────┘  │
              │  ┌───────────────────┐  │
              │  │  SQLite DB        │  │
              │  └───────────────────┘  │
              └─────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  Market Data Sources    │
              │  Binance REST/WS        │
              │  Yahoo Finance          │
              └─────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router) | SSR, file-based routing, React 19 |
| Styling | Tailwind CSS v4 + custom dark theme | Rapid UI, consistent design tokens |
| UI Components | shadcn/ui (Radix primitives) | Accessible, unstyled base components |
| Backend | Python FastAPI | Async, typed, high-performance |
| Database | SQLite + SQLAlchemy async | Zero-config, embeddable, upgradeable to PostgreSQL |
| Real-time | WebSocket (FastAPI native) | Live trade feed, role logs |
| Skill Isolation | subprocess (Python) | No Docker dependency; OS-level process isolation |
| Market Data | Binance Vision API (crypto), Yahoo Finance (stocks) | No auth required |

---

## Directory Structure

```
quantarmy/
├── frontend/                  # Next.js application
│   ├── app/                   # App Router pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing (→ create company or dashboard)
│   │   └── company/
│   │       ├── layout.tsx     # Sidebar + TradeLog layout
│   │       ├── page.tsx       # Dashboard (company overview)
│   │       ├── new/page.tsx   # Create company wizard
│   │       ├── [role]/page.tsx # Role config + skill market
│   │       └── settings/      # Company settings
│   ├── components/
│   │   ├── Sidebar/           # Navigation sidebar with role list
│   │   ├── Dashboard/         # Equity, positions, metrics
│   │   ├── RolePanel/         # Role detail + parameter editor
│   │   ├── SkillMarket/       # Browse/import skills
│   │   └── TradeLog/          # Real-time log panel (bottom strip)
│   ├── lib/
│   │   ├── types.ts           # All TypeScript types
│   │   ├── api.ts             # API client functions
│   │   └── utils.ts           # cn, formatCurrency, etc.
│   └── package.json
│
├── backend/                   # FastAPI application
│   ├── main.py                # App entry point
│   └── app/
│       ├── core/
│       │   ├── config.py      # Environment config + constants
│       │   └── database.py    # SQLAlchemy async setup
│       ├── models/
│       │   ├── company.py     # Company, Role, Position, Trade, Message
│       │   └── skill.py       # Skill, SkillImport
│       ├── api/
│       │   ├── company.py     # /api/company CRUD
│       │   ├── roles.py       # /api/company/{id}/roles
│       │   ├── skills.py      # /api/skills CRUD + import
│       │   ├── trading.py     # /api/company/{id}/trading
│       │   └── market.py      # /api/market data
│       ├── services/
│       │   ├── trading_engine.py  # Main tick loop + role pipeline
│       │   ├── skill_adapter.py   # LLM-powered GitHub → skill adapter
│       │   └── data_pipeline.py   # Market data fetching
│       ├── skills/
│       │   ├── base.py        # BaseSkill + TradeContext + SkillOutput
│       │   ├── seed.py        # Seeds built-in skills to DB on startup
│       │   └── builtin/
│       │       └── psar_trend.py  # PSAR Trend Following (battle-tested)
│       ├── sandbox/
│       │   └── runner.py      # Subprocess-based skill executor
│       └── ws/
│           ├── manager.py     # WebSocket connection manager
│           └── router.py      # WS endpoint
│
├── data/                      # SQLite database (gitignored)
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # This file
│   ├── API_SPEC.md            # Full API reference
│   ├── SKILL_SPEC.md          # How to write skills
│   ├── PROJECT_PLAN.md        # Product roadmap
│   ├── STRATEGY_KB.md         # Trading strategy knowledge base
│   └── CONTEXT.md             # Session context file
├── CHANGELOG.md               # Version history
└── README.md                  # Quick start
```

---

## Data Flow: One Trading Tick

```
Every 60s (configurable):

1. DATA PIPELINE
   Binance/Yahoo → OHLCV klines for all watched symbols

2. COLLECTOR SKILL
   Input:  raw price data + news feed
   Output: InfoSignals (bullish/bearish sentiment, anomalies)

3. STRATEGIST SKILL
   Input:  OHLCV + InfoSignals
   Output: TradeSignal (LONG/SHORT/CLOSE/HOLD + size + SL/TP)

4. RISK OFFICER SKILL
   Input:  TradeSignal + current portfolio state
   Output: ApprovedOrder (may resize, reject, or tighten SL)

5. CEO SKILL (optional override layer)
   Input:  ApprovedOrder + company-level risk budget
   Output: FinalOrder or VETO

6. EXECUTOR SKILL
   Input:  FinalOrder + current price
   Output: Fill (simulated execution with slippage model)

7. ANALYST SKILL
   Input:  Fills + portfolio snapshot
   Output: Report (logged, stored, broadcasted via WebSocket)

8. WEBSOCKET BROADCAST
   Client receives: trade event, equity update, role logs
```

---

## Skill Interface

All skills implement `BaseSkill`:

```python
class MySkill(BaseSkill):
    name = "My Strategy"
    version = "1.0.0"
    role_type = "strategist"

    async def initialize(self, config: dict) -> None:
        ...  # Load models, set up state

    async def execute(self, ctx: TradeContext) -> SkillOutput:
        ...  # Your logic here
        return SkillOutput(action="LONG", size_pct=0.2, reason="Signal triggered")
```

`TradeContext` provides:
- Full OHLCV history (200+ candles)
- Current portfolio state (equity, positions, cash)
- Signals from other roles (InfoSignals from Collector, RiskParams from Risk Officer)
- Skill configuration dict

`SkillOutput` specifies:
- `action`: LONG | SHORT | CLOSE | HOLD
- `size_pct`: fraction of equity to use
- `stop_loss_pct`, `take_profit_pct`: optional
- `reason`: human-readable explanation (logged + displayed)

---

## Role Message Bus

Roles communicate via a typed message protocol stored in the `messages` table:

```
from_role → to_role : msg_type : payload

Collector  → Strategist  : "signal"  : {type: "news", sentiment: 0.8, ...}
Strategist → RiskOfficer : "signal"  : {action: "LONG", symbol: "BTCUSDT", ...}
RiskOfficer→ Executor    : "signal"  : {action: "LONG", size: 0.15, sl: 0.025, ...}
Executor   → Analyst     : "report"  : {fill: {...}, slippage: 0.001, ...}
Analyst    → CEO         : "report"  : {daily_pnl: 0.03, drawdown: 0.05, ...}
```

---

## Skill Import Pipeline (GitHub → QuantArmy)

```
User submits GitHub URL
        ↓
[1] Clone repo (git clone --depth 1)
        ↓
[2] LLM analyzes code:
    - Identifies strategy type (trend/MR/ML/arbitrage)
    - Extracts entry/exit logic
    - Maps signals to QuantArmy conventions
        ↓
[3] LLM generates adapter:
    - Wraps original code with BaseSkill interface
    - Handles data format conversion
    - Adds error handling
        ↓
[4] Sandbox test:
    - 30s timeout
    - Feed test TradeContext
    - Validate SkillOutput format
        ↓
[5] Optional quick backtest:
    - 30 days of BTC 5m data
    - Report metrics
        ↓
[6] Skill stored in DB → user can equip
```

---

## Database Schema

**companies** — Company config + state  
**roles** — 8 roles per company, links to active skill  
**positions** — Open positions  
**trades** — Trade history  
**messages** — Role message bus log  
**skills** — Skill registry (builtin + marketplace + imported)  
**skill_imports** — Import job tracking  

---

## API Surface

Base URL: `/api`  
WebSocket: `ws://localhost:8000/ws/{company_id}`

Key endpoints:
```
POST   /api/company                      Create company
GET    /api/company/{id}                 Get company
GET    /api/company/{id}/roles           List all roles
PUT    /api/company/{id}/roles/{type}/skill  Equip a skill
GET    /api/skills?role_type=strategist  List skills
POST   /api/skills/import               Import from GitHub
POST   /api/company/{id}/trading/start  Start trading
GET    /api/company/{id}/trading/positions  Current positions
GET    /api/market/symbols              Available symbols
```

Full reference: see `docs/API_SPEC.md`

---

## Security & Isolation

- **Skill Sandbox**: skills run in subprocesses, no network access, 30s timeout, 256MB memory cap
- **No Auth (v0.1)**: single-user, localhost. JWT planned for v0.2
- **No real funds**: all trading is 100% simulated. No exchange API keys, no real orders
- **Imported code**: LLM-generated adapter is the only code that runs, not the raw repo code
