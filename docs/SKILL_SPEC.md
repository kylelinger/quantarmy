# QuantArmy Skill Specification

**Version**: 0.1.0 | **Updated**: 2026-03-11

A **Skill** is a Python class that implements `BaseSkill`. Every role in QuantArmy can be assigned a skill. Skills are the building blocks of your AI trading team.

---

## 1. Quick Start

```python
from app.skills.base import BaseSkill, TradeContext, SkillOutput

class MyStrategy(BaseSkill):
    name = "My Strategy"
    version = "1.0.0"
    role_type = "strategist"
    description = "Buys on golden cross, sells on death cross"
    parameters = [
        {"name": "fast_period", "type": "int", "default": 20, "description": "Fast EMA period"},
        {"name": "slow_period", "type": "int", "default": 50, "description": "Slow EMA period"},
    ]

    async def initialize(self, config: dict) -> None:
        self.fast = int(config.get("fast_period", 20))
        self.slow = int(config.get("slow_period", 50))

    async def execute(self, ctx: TradeContext) -> SkillOutput:
        fast_ema = self.ema(ctx.closes, self.fast)
        slow_ema = self.ema(ctx.closes, self.slow)

        if fast_ema > slow_ema and not self.has_position(ctx):
            return SkillOutput(
                action="LONG",
                symbol=ctx.symbol,
                size_pct=0.2,
                stop_loss_pct=0.02,
                reason=f"Golden cross: EMA{self.fast}={fast_ema:.2f} > EMA{self.slow}={slow_ema:.2f}"
            )

        if fast_ema < slow_ema and self.has_position(ctx):
            return SkillOutput(action="CLOSE", symbol=ctx.symbol, reason="Death cross")

        return SkillOutput(action="HOLD", reason="No signal")
```

---

## 2. TradeContext Reference

Every `execute()` call receives a `TradeContext`:

| Field | Type | Description |
|---|---|---|
| `symbol` | str | Current symbol being evaluated (e.g. "BTCUSDT") |
| `closes` | list[float] | Close prices, oldest→newest, min 200 candles |
| `opens` | list[float] | Open prices |
| `highs` | list[float] | High prices |
| `lows` | list[float] | Low prices |
| `volumes` | list[float] | Volume data |
| `interval` | str | Timeframe: "1m", "5m", "15m", "1h", "4h", "1d" |
| `current_price` | float | Latest price |
| `equity` | float | Total portfolio value |
| `cash` | float | Available cash |
| `positions` | list[dict] | Open positions: [{symbol, side, size, entry_price, ...}] |
| `info_signals` | list[dict] | Signals from Collector role |
| `risk_params` | dict | Parameters from Risk Officer (max_size_pct, etc.) |
| `config` | dict | Your skill's configuration values |

---

## 3. SkillOutput Reference

`execute()` must return a `SkillOutput`:

| Field | Type | Required | Description |
|---|---|---|---|
| `action` | str | ✅ | "LONG" \| "SHORT" \| "CLOSE" \| "HOLD" |
| `symbol` | str | For LONG/SHORT/CLOSE | Target symbol |
| `size_pct` | float | For LONG/SHORT | Fraction of equity (0.0–1.0). 0.2 = 20% |
| `stop_loss_pct` | float | Recommended | Stop loss as % of entry price |
| `take_profit_pct` | float | Optional | Take profit as % of entry price |
| `reason` | str | Recommended | Human-readable reason (shown in UI + logs) |
| `signals` | list[dict] | Optional | Extra signals for other roles to consume |
| `metadata` | dict | Optional | Debug data (logged but not acted upon) |

### Action Semantics

- **LONG**: Open a long position using `size_pct` of equity
- **SHORT**: Open a short position using `size_pct` of equity
- **CLOSE**: Close the open position for this symbol
- **HOLD**: Do nothing this tick

---

## 4. Built-in Utility Methods (from BaseSkill)

```python
# Position helpers
self.has_position(ctx, symbol=None)     → bool
self.get_position(ctx, symbol=None)     → dict | None

# Technical indicators
self.atr(highs, lows, closes, period=14)  → float
self.ema(values, period)                   → float   # last value
self.sma(values, period)                   → float   # last value
self.rsi(closes, period=14)               → float
```

---

## 5. Role Types

| Role Type | Purpose | Input | Output |
|---|---|---|---|
| `strategist` | Entry/exit decisions | OHLCV + info signals | Trade signal (LONG/SHORT/CLOSE/HOLD) |
| `risk_officer` | Position sizing + risk | Trade signal + portfolio | Approved order (may resize/veto) |
| `collector` | Market intelligence | News/social/onchain feeds | InfoSignals (sentiment, events) |
| `executor` | Order simulation | Approved orders | Fills (with slippage model) |
| `analyst` | Performance reporting | Fills + portfolio | Reports (PnL, metrics, alerts) |
| `researcher` | Strategy discovery | KB + market data | New strategy proposals |
| `ceo` | Final decisions | Everything | Go/no-go on trades |
| `cto` | System monitoring | Logs + errors | Alerts + system changes |

---

## 6. Parameter Schema

```python
parameters = [
    {
        "name": "period",           # Internal key used in config dict
        "type": "int",              # int | float | str | bool | select
        "default": 14,              # Default value
        "min_value": 5,             # Optional: for int/float
        "max_value": 50,            # Optional: for int/float
        "description": "RSI period", # Shown in UI
        "options": None,            # Required for type="select"
    },
    {
        "name": "mode",
        "type": "select",
        "default": "trend",
        "options": ["trend", "mr", "breakout"],
        "description": "Strategy mode",
    },
]
```

---

## 7. GitHub Import Compatibility

When you import a strategy from GitHub, QuantArmy's LLM adapter will:

1. **Detect** what the code does (scan for buy/sell signals, indicator computations)
2. **Map** the strategy's data inputs to `TradeContext` fields
3. **Wrap** the strategy's output into `SkillOutput`
4. **Handle** initialization/teardown via `initialize()` / `on_stop()`

**Import-friendly code characteristics:**
- Clear function/class structure with buy/sell signal logic
- Standard indicator names (EMA, RSI, MACD, Bollinger, ATR, etc.)
- Numeric outputs rather than side effects
- Python 3.9+ compatible

**Import-hostile characteristics (will fail):**
- Live brokerage API calls (we sandbox with no network)
- GUI/matplotlib dependencies in the main logic
- External database connections
- C extensions without pure-Python fallback

---

## 8. Backtest Requirements for Marketplace

To publish a skill to the marketplace, it must pass:
- ≥ 10 trades in backtest
- Win rate ≥ 40%
- Profit factor ≥ 1.2
- Passes on ≥ 3/5 test symbols

---

## 9. Built-in Skills Reference

### PSAR Trend (strategist)
**Source**: Internal (battle-tested in AItrading production)  
**Parameters**: af_start, af_step, af_max, ema_period, adx_min, size_pct, sl_atr_mult, tp_atr_mult  
**Logic**: PSAR flip + EMA filter + ADX trend regime guard  
**Recommended timeframes**: 5m, 1h  
**Known edge**: AF 0.01/0.01/0.10 (slow) significantly outperforms default 0.02/0.02/0.20

More built-in skills coming in v0.2.
