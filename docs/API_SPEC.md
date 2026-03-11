# QuantArmy API Specification

**Version**: 0.1.0 | **Base URL**: `http://localhost:8000`

All endpoints return:
```json
{ "ok": true, "data": <payload>, "error": null }
// or on error:
{ "ok": false, "data": null, "error": "message" }
```

---

## Company

### POST `/api/company`
Create a new company (creates all 8 roles automatically).

**Body:**
```json
{
  "name": "My Quant Fund",
  "initial_capital": 100000,
  "market": "crypto"
}
```
**Response:** Company object

---

### GET `/api/company/{id}`
Get company details.

**Response:**
```json
{
  "id": "abc12345",
  "name": "My Quant Fund",
  "initial_capital": 100000,
  "current_equity": 103241.50,
  "market": "crypto",
  "status": "active"
}
```

---

### POST `/api/company/{id}/reset`
Reset equity to initial capital, clear positions.

---

### DELETE `/api/company/{id}`
Delete company and all associated data.

---

## Roles

### GET `/api/company/{id}/roles`
List all 8 roles and their current skill assignments.

**Response:**
```json
[
  {
    "id": "r1",
    "role_type": "strategist",
    "active_skill_id": "sk1",
    "config": {"af_start": 0.01},
    "status": "active",
    "last_output": "HOLD: ADX=18.3 < 20"
  }
]
```

---

### GET `/api/company/{id}/roles/{role_type}`
Get a specific role.

---

### PUT `/api/company/{id}/roles/{role_type}/skill`
Assign a skill to a role.

**Body:**
```json
{
  "skill_id": "sk1",
  "config": {"af_start": 0.01, "size_pct": 0.2}
}
```

---

### PUT `/api/company/{id}/roles/{role_type}/config`
Update role config without changing skill.

**Body:**
```json
{ "config": {"af_start": 0.005} }
```

---

## Skills

### GET `/api/skills`
List available skills with optional filters.

**Query params:**
- `role_type` — filter by role (strategist, risk_officer, etc.)
- `source` — builtin | marketplace | github
- `search` — fuzzy name search

**Response:**
```json
[
  {
    "id": "sk1",
    "name": "PSAR Trend",
    "role_type": "strategist",
    "version": "1.0.0",
    "description": "...",
    "author": "QuantArmy",
    "source": "builtin",
    "parameters": [...],
    "backtest_result": {
      "trades": 84,
      "win_rate": 0.46,
      "profit_factor": 1.38,
      "max_drawdown": 0.12,
      "sharpe_ratio": 1.2,
      "total_return": 0.31
    }
  }
]
```

---

### GET `/api/skills/{id}`
Get skill detail.

---

### POST `/api/skills/import`
Start a GitHub import job.

**Body:**
```json
{
  "github_url": "https://github.com/user/repo",
  "role_type": "strategist"
}
```
**Response:**
```json
{ "import_id": "im1", "status": "analyzing" }
```

---

### GET `/api/skills/import/{import_id}`
Poll import status.

**Response:**
```json
{
  "status": "adapting",
  "progress": 45,
  "steps": [
    {"name": "clone", "status": "done"},
    {"name": "analyze", "status": "done"},
    {"name": "adapt", "status": "running"},
    {"name": "test", "status": "pending"}
  ],
  "skill_id": null,
  "error": null
}
```

---

### POST `/api/skills/{id}/backtest`
Run a backtest on a skill.

**Body:**
```json
{
  "symbol": "BTCUSDT",
  "period": "3m",
  "config": {"af_start": 0.01}
}
```
**Response:**
```json
{
  "trades": 84,
  "win_rate": 0.46,
  "profit_factor": 1.38,
  "max_drawdown": 0.12,
  "sharpe_ratio": 1.2,
  "total_return": 0.31
}
```

---

## Trading

### GET `/api/company/{id}/trading/positions`
Get current open positions.

**Response:**
```json
[
  {
    "id": "pos1",
    "symbol": "BTCUSDT",
    "side": "long",
    "size": 0.05,
    "entry_price": 82000.0,
    "current_price": 84500.0,
    "unrealized_pnl": 125.0,
    "opened_at": "2026-03-11T10:00:00Z"
  }
]
```

---

### GET `/api/company/{id}/trading/history`
Get trade history.

**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `symbol` — filter by symbol

---

### GET `/api/company/{id}/trading/performance`
Get aggregate performance metrics.

---

### POST `/api/company/{id}/trading/start`
Start the trading engine for this company.

---

### POST `/api/company/{id}/trading/stop`
Pause the trading engine.

---

## Market Data

### GET `/api/market/symbols?market=crypto`
List available symbols.

### GET `/api/market/price/{symbol}`
Latest price snapshot.

### GET `/api/market/klines/{symbol}?interval=5m&limit=500`
OHLCV kline data.

---

## WebSocket

### `WS /ws/{company_id}`
Real-time event stream for a company.

**Client → Server:**
```json
{ "type": "ping" }
```

**Server → Client events:**
```json
// New trade executed
{ "type": "trade", "data": { "symbol": "BTCUSDT", "side": "buy", "price": 84000, ... } }

// Equity updated
{ "type": "equity_update", "data": { "equity": 103241, "pnl": 3241 } }

// Role produced a signal
{ "type": "message", "data": { "from": "strategist", "to": "risk_officer", "signal": {...} } }

// Role log line
{ "type": "log", "data": { "role": "strategist", "level": "info", "message": "PSAR bull flip detected" } }

// Role status changed
{ "type": "skill_status", "data": { "role": "risk_officer", "status": "active", "last_output": "APPROVED" } }

// Heartbeat
{ "type": "heartbeat" }
```
