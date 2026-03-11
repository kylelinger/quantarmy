"""BaseSkill — every skill (built-in or imported) must implement this interface."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class TradeContext:
    """Passed to a skill on every tick."""
    # Market snapshot
    symbol: str
    closes: list[float]       # Sorted oldest → newest, length ≥ 200
    opens: list[float]
    highs: list[float]
    lows: list[float]
    volumes: list[float]
    interval: str             # "1m" | "5m" | "15m" | "1h" | "4h" | "1d"
    current_price: float

    # Portfolio state
    equity: float
    cash: float
    positions: list[dict]     # [{symbol, side, size, entry_price, ...}]

    # Signals from other roles
    info_signals: list[dict] = field(default_factory=list)   # from Collector
    risk_params: dict = field(default_factory=dict)           # from Risk Officer

    # Skill configuration
    config: dict = field(default_factory=dict)


@dataclass
class SkillOutput:
    """Returned by a skill after each tick."""
    action: str               # LONG | SHORT | CLOSE | HOLD
    symbol: str | None = None
    size_pct: float = 0.0     # % of equity to use (0.0 – 1.0)
    stop_loss_pct: float | None = None
    take_profit_pct: float | None = None
    reason: str = ""
    signals: list[dict] = field(default_factory=list)  # extra signals for other roles
    metadata: dict = field(default_factory=dict)


class BaseSkill(ABC):
    """All QuantArmy skills must inherit from this class.

    Required methods:
    - initialize(config): called once on startup
    - execute(context): called on every market tick, returns SkillOutput
    
    Optional:
    - on_fill(fill): called when an order is filled
    - on_stop(): called when trading stops
    """

    # Metadata — override in subclasses
    name: str = "BaseSkill"
    version: str = "0.1.0"
    role_type: str = "strategist"
    description: str = "Base skill"
    parameters: list[dict] = []

    async def initialize(self, config: dict) -> None:
        """Called once when the skill is first loaded. Override for setup."""
        pass

    @abstractmethod
    async def execute(self, ctx: TradeContext) -> SkillOutput:
        """Called on every tick. Must return a SkillOutput."""
        ...

    async def on_fill(self, fill: dict) -> None:
        """Called when one of our orders is filled. Override for tracking."""
        pass

    async def on_stop(self) -> None:
        """Called when trading stops. Override for cleanup."""
        pass

    # --- Utility helpers ---

    def has_position(self, ctx: TradeContext, symbol: str | None = None) -> bool:
        """Check if there's an open position."""
        target = symbol or ctx.symbol
        return any(p["symbol"] == target for p in ctx.positions)

    def get_position(self, ctx: TradeContext, symbol: str | None = None) -> dict | None:
        """Get open position for a symbol."""
        target = symbol or ctx.symbol
        return next((p for p in ctx.positions if p["symbol"] == target), None)

    def atr(self, highs: list[float], lows: list[float], closes: list[float], period: int = 14) -> float:
        """Calculate Average True Range."""
        if len(closes) < period + 1:
            return 0.0
        trs = []
        for i in range(-period, 0):
            tr = max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i - 1]),
                abs(lows[i] - closes[i - 1]),
            )
            trs.append(tr)
        return sum(trs) / len(trs)

    def ema(self, values: list[float], period: int) -> float:
        """Calculate EMA (last value)."""
        if len(values) < period:
            return values[-1] if values else 0.0
        k = 2 / (period + 1)
        ema_val = sum(values[:period]) / period
        for v in values[period:]:
            ema_val = v * k + ema_val * (1 - k)
        return ema_val

    def sma(self, values: list[float], period: int) -> float:
        """Calculate Simple Moving Average."""
        if len(values) < period:
            return sum(values) / len(values)
        return sum(values[-period:]) / period

    def rsi(self, closes: list[float], period: int = 14) -> float:
        """Calculate RSI."""
        if len(closes) < period + 1:
            return 50.0
        deltas = [closes[i] - closes[i - 1] for i in range(-period, 0)]
        gains = [d for d in deltas if d > 0]
        losses = [-d for d in deltas if d < 0]
        avg_gain = sum(gains) / period
        avg_loss = sum(losses) / period
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))
