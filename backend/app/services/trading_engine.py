"""Simulation Trading Engine — orchestrates the role pipeline."""
import asyncio
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Any

from app.core.config import TICK_INTERVAL_SECONDS


@dataclass
class Signal:
    type: str          # trade | risk | info | decision
    action: str        # BUY | SELL | HOLD | CLOSE | ALERT
    symbol: str | None = None
    confidence: float = 0.0
    reason: str = ""
    from_role: str = ""
    metadata: dict = field(default_factory=dict)


@dataclass
class OrderRequest:
    symbol: str
    side: str          # buy | sell
    size: float
    size_type: str     # notional | quantity
    order_type: str    # market | limit
    limit_price: float | None = None
    stop_loss: float | None = None
    take_profit: float | None = None
    reason: str = ""


@dataclass
class TickResult:
    tick: int
    timestamp: datetime
    signals: list[Signal]
    orders: list[OrderRequest]
    fills: list[dict]
    logs: list[str]


class TradingEngine:
    """Orchestrates the role pipeline for a company.
    
    Each tick:
    1. Collector gathers info → produces signals
    2. Strategist analyzes market + info → produces trade signals
    3. Risk Officer reviews trade signals → approves/adjusts orders
    4. CEO makes final decisions (optional)
    5. Executor fills approved orders
    6. Analyst records and reports
    """

    def __init__(self, company_id: str):
        self.company_id = company_id
        self.running = False
        self.tick_count = 0
        self._task: asyncio.Task | None = None

    async def start(self):
        """Start the trading loop."""
        if self.running:
            return
        self.running = True
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        """Stop the trading loop."""
        self.running = False
        if self._task:
            self._task.cancel()
            self._task = None

    async def _run_loop(self):
        """Main tick loop."""
        while self.running:
            try:
                result = await self._tick()
                # TODO: broadcast result via WebSocket
                await asyncio.sleep(TICK_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                break
            except Exception as e:
                # Log error but keep running
                print(f"[TradingEngine] Tick error for {self.company_id}: {e}")
                await asyncio.sleep(TICK_INTERVAL_SECONDS)

    async def _tick(self) -> TickResult:
        """Execute one tick of the pipeline."""
        self.tick_count += 1
        now = datetime.now(timezone.utc)

        signals: list[Signal] = []
        orders: list[OrderRequest] = []
        fills: list[dict] = []
        logs: list[str] = [f"Tick #{self.tick_count}"]

        # TODO: implement the full pipeline
        # 1. Get market data
        # 2. Run collector skill → info signals
        # 3. Run strategist skill with info → trade signals
        # 4. Run risk officer skill → approved orders
        # 5. Run CEO skill → final approval
        # 6. Execute orders → fills
        # 7. Run analyst skill → reports

        return TickResult(
            tick=self.tick_count,
            timestamp=now,
            signals=signals,
            orders=orders,
            fills=fills,
            logs=logs,
        )


# Active engines per company
_engines: dict[str, TradingEngine] = {}


def get_engine(company_id: str) -> TradingEngine:
    if company_id not in _engines:
        _engines[company_id] = TradingEngine(company_id)
    return _engines[company_id]
