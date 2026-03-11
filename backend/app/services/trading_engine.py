"""Simulation Trading Engine — orchestrates the full role pipeline."""
import asyncio
import importlib
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import TICK_INTERVAL_SECONDS
from app.core.database import async_session
from app.models.company import Company, Role, Position, Trade, Message
from app.models.skill import Skill
from app.skills.base import BaseSkill, TradeContext, SkillOutput
from app.services.data_pipeline import data_pipeline
from app.ws.manager import ws_manager


@dataclass
class TickResult:
    tick: int
    timestamp: datetime
    signals: list[dict] = field(default_factory=list)
    fills: list[dict] = field(default_factory=list)
    logs: list[str] = field(default_factory=list)


# Registry: skill_id → BaseSkill instance (cached)
_skill_instances: dict[str, BaseSkill] = {}

# Built-in skill class lookup
_BUILTIN_CLASSES: dict[str, type] = {}


def register_builtin(name: str, cls: type):
    _BUILTIN_CLASSES[name] = cls


def _load_builtins():
    from app.skills.builtin.psar_trend import PSARTrendSkill
    from app.skills.builtin.risk_officer import RiskOfficerSkill
    register_builtin("PSAR Trend", PSARTrendSkill)
    register_builtin("Basic Risk Officer", RiskOfficerSkill)


_load_builtins()


async def _get_skill_instance(skill_db: Skill, config: dict) -> BaseSkill | None:
    """Get or create a BaseSkill instance from DB skill record."""
    cache_key = f"{skill_db.id}:{hash(str(sorted(config.items())))}"
    if cache_key in _skill_instances:
        return _skill_instances[cache_key]

    # Built-in skill
    if skill_db.source == "builtin" and skill_db.name in _BUILTIN_CLASSES:
        instance = _BUILTIN_CLASSES[skill_db.name]()
        await instance.initialize(config)
        _skill_instances[cache_key] = instance
        return instance

    # Imported skill with adapter code
    if skill_db.adapter_code:
        try:
            ns: dict = {}
            exec(skill_db.adapter_code, ns)
            for v in ns.values():
                if isinstance(v, type) and issubclass(v, BaseSkill) and v is not BaseSkill:
                    instance = v()
                    await instance.initialize(config)
                    _skill_instances[cache_key] = instance
                    return instance
        except Exception as e:
            print(f"[Engine] Failed to load adapted skill {skill_db.name}: {e}")
    return None


class TradingEngine:
    """Orchestrates the role pipeline for a company.

    Each tick:
    1. Fetch market data for watched symbols
    2. Run strategist skill → TradeSignals
    3. Run risk_officer skill → Approved/Adjusted orders
    4. Execute approved orders (paper broker)
    5. Update equity + positions
    6. Broadcast via WebSocket
    """

    WATCHED_SYMBOLS_CRYPTO = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"]
    WATCHED_SYMBOLS_STOCK = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]

    def __init__(self, company_id: str):
        self.company_id = company_id
        self.running = False
        self.tick_count = 0
        self._task: asyncio.Task | None = None

    async def start(self):
        if self.running:
            return
        self.running = True
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            self._task = None

    async def _run_loop(self):
        while self.running:
            try:
                result = await self._tick()
                # Broadcast tick result
                await ws_manager.broadcast(self.company_id, {
                    "type": "tick",
                    "data": {
                        "tick": result.tick,
                        "timestamp": result.timestamp.isoformat(),
                        "signals": result.signals,
                        "fills": result.fills,
                        "logs": result.logs,
                    },
                })
                await asyncio.sleep(TICK_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                break
            except Exception as e:
                log_msg = f"[Engine] Tick error for {self.company_id}: {e}"
                print(log_msg)
                await ws_manager.broadcast(self.company_id, {
                    "type": "log",
                    "data": {"role": "cto", "level": "error", "message": str(e)},
                })
                await asyncio.sleep(TICK_INTERVAL_SECONDS)

    async def _tick(self) -> TickResult:
        self.tick_count += 1
        now = datetime.now(timezone.utc)
        result = TickResult(tick=self.tick_count, timestamp=now)
        result.logs.append(f"Tick #{self.tick_count}")

        async with async_session() as db:
            # Load company
            company = (await db.execute(select(Company).where(Company.id == self.company_id))).scalar_one_or_none()
            if not company or company.status != "active":
                result.logs.append("Company not active, skipping")
                return result

            # Load roles
            roles = {r.role_type: r for r in (await db.execute(select(Role).where(Role.company_id == self.company_id))).scalars().all()}

            # Load current positions
            positions_db = (await db.execute(select(Position).where(Position.company_id == self.company_id))).scalars().all()
            positions_list = [
                {"symbol": p.symbol, "side": p.side, "size": p.size, "entry_price": p.entry_price, "id": p.id}
                for p in positions_db
            ]

            # Determine watched symbols
            symbols = self.WATCHED_SYMBOLS_CRYPTO if company.market == "crypto" else self.WATCHED_SYMBOLS_STOCK

            # --- For each symbol, run the pipeline ---
            for symbol in symbols:
                try:
                    await self._run_symbol_pipeline(db, company, roles, positions_list, positions_db, symbol, result)
                except Exception as e:
                    result.logs.append(f"[{symbol}] Pipeline error: {e}")

            # Update equity: cash + sum(position values)
            total_position_value = 0.0
            for p in positions_db:
                total_position_value += p.size * p.current_price
            cash = company.current_equity - total_position_value  # simplified
            await db.commit()

            # Broadcast equity
            await ws_manager.broadcast(self.company_id, {
                "type": "equity_update",
                "data": {"equity": company.current_equity, "pnl": company.current_equity - company.initial_capital},
            })

        return result

    async def _run_symbol_pipeline(
        self, db: AsyncSession, company: Company, roles: dict,
        positions_list: list[dict], positions_db: list, symbol: str, result: TickResult
    ):
        """Run strategist → risk_officer → execute for one symbol."""

        # 1. Fetch market data
        klines = await data_pipeline.get_klines(symbol, interval="5m", limit=300)
        if len(klines) < 50:
            return  # Not enough data

        closes = [k.close for k in klines]
        opens = [k.open for k in klines]
        highs = [k.high for k in klines]
        lows = [k.low for k in klines]
        volumes = [k.volume for k in klines]
        current_price = closes[-1]

        # Update position current prices
        for p in positions_db:
            if p.symbol == symbol:
                old_price = p.current_price
                p.current_price = current_price
                if p.side == "long":
                    p.unrealized_pnl = (current_price - p.entry_price) * p.size
                else:
                    p.unrealized_pnl = (p.entry_price - current_price) * p.size

        # Build trade context
        ctx = TradeContext(
            symbol=symbol,
            closes=closes, opens=opens, highs=highs, lows=lows, volumes=volumes,
            interval="5m",
            current_price=current_price,
            equity=company.current_equity,
            cash=company.current_equity - sum(p.size * p.current_price for p in positions_db),
            positions=positions_list,
        )

        # 2. Run strategist skill
        strategist_role = roles.get("strategist")
        if not strategist_role or not strategist_role.active_skill_id:
            return

        strat_skill_db = (await db.execute(select(Skill).where(Skill.id == strategist_role.active_skill_id))).scalar_one_or_none()
        if not strat_skill_db:
            return

        strat_instance = await _get_skill_instance(strat_skill_db, strategist_role.config)
        if not strat_instance:
            return

        signal = await strat_instance.execute(ctx)
        result.signals.append({"symbol": symbol, "action": signal.action, "reason": signal.reason, "from": "strategist"})
        result.logs.append(f"[{symbol}] Strategist: {signal.action} — {signal.reason}")

        # Log message
        msg = Message(company_id=company.id, from_role="strategist", to_role="risk_officer", msg_type="signal",
                      payload={"action": signal.action, "symbol": symbol, "size_pct": signal.size_pct, "reason": signal.reason})
        db.add(msg)

        # Broadcast signal
        await ws_manager.broadcast(self.company_id, {
            "type": "message",
            "data": {"from": "strategist", "to": "risk_officer", "signal": {"action": signal.action, "symbol": symbol, "reason": signal.reason}},
        })

        if signal.action == "HOLD":
            return

        # 3. Run risk officer skill (if equipped)
        risk_role = roles.get("risk_officer")
        approved_signal = signal  # default: pass through

        if risk_role and risk_role.active_skill_id:
            risk_skill_db = (await db.execute(select(Skill).where(Skill.id == risk_role.active_skill_id))).scalar_one_or_none()
            if risk_skill_db:
                risk_instance = await _get_skill_instance(risk_skill_db, risk_role.config)
                if risk_instance:
                    # Inject strategist signal into context
                    ctx.info_signals = [{"action": signal.action, "symbol": symbol, "size_pct": signal.size_pct,
                                         "stop_loss_pct": signal.stop_loss_pct, "take_profit_pct": signal.take_profit_pct,
                                         "reason": signal.reason}]
                    risk_output = await risk_instance.execute(ctx)
                    result.logs.append(f"[{symbol}] RiskOfficer: {risk_output.action} — {risk_output.reason}")
                    result.signals.append({"symbol": symbol, "action": risk_output.action, "reason": risk_output.reason, "from": "risk_officer"})

                    if risk_output.action == "HOLD":
                        result.logs.append(f"[{symbol}] Risk Officer VETOED trade")
                        return
                    approved_signal = risk_output

        # 4. Execute the trade
        await self._execute_order(db, company, positions_db, positions_list, approved_signal, current_price, result)

    async def _execute_order(
        self, db: AsyncSession, company: Company, positions_db: list,
        positions_list: list[dict], signal: SkillOutput, price: float, result: TickResult
    ):
        """Paper-execute an order."""
        symbol = signal.symbol
        if not symbol:
            return

        if signal.action == "CLOSE":
            # Find and close position
            for p in positions_db:
                if p.symbol == symbol:
                    # Calculate realized PnL
                    if p.side == "long":
                        pnl = (price - p.entry_price) * p.size
                    else:
                        pnl = (p.entry_price - price) * p.size

                    company.current_equity += pnl

                    # Record trade
                    trade = Trade(
                        company_id=company.id, symbol=symbol,
                        side="sell" if p.side == "long" else "buy",
                        size=p.size, price=price, fee=p.size * price * 0.001,
                        strategy=p.strategy, signal_reason=signal.reason,
                    )
                    db.add(trade)
                    await db.delete(p)

                    fill = {"symbol": symbol, "side": "close", "price": price, "pnl": pnl, "reason": signal.reason}
                    result.fills.append(fill)
                    result.logs.append(f"[{symbol}] CLOSE @ {price:.2f} PnL={pnl:.2f}")

                    await ws_manager.broadcast(self.company_id, {"type": "trade", "data": fill})
                    break

        elif signal.action in ("LONG", "SHORT"):
            # Check if already has position for this symbol
            if any(p.symbol == symbol for p in positions_db):
                result.logs.append(f"[{symbol}] Already has position, skipping")
                return

            # Position sizing
            notional = company.current_equity * signal.size_pct
            size = notional / price

            # Check max positions
            if len(positions_db) >= 20:
                result.logs.append(f"[{symbol}] Max positions (20) reached, skipping")
                return

            side = "long" if signal.action == "LONG" else "short"
            position = Position(
                company_id=company.id, symbol=symbol, side=side,
                size=size, entry_price=price, current_price=price,
                unrealized_pnl=0.0, strategy="strategist",
            )
            db.add(position)
            positions_db.append(position)

            # Record trade
            trade = Trade(
                company_id=company.id, symbol=symbol,
                side="buy" if side == "long" else "sell",
                size=size, price=price, fee=notional * 0.001,
                strategy="strategist", signal_reason=signal.reason,
            )
            db.add(trade)

            fill = {"symbol": symbol, "side": side, "price": price, "size": size, "reason": signal.reason}
            result.fills.append(fill)
            result.logs.append(f"[{symbol}] {signal.action} @ {price:.2f} size={size:.6f}")

            await ws_manager.broadcast(self.company_id, {"type": "trade", "data": fill})


# --- Engine Registry ---
_engines: dict[str, TradingEngine] = {}


def get_engine(company_id: str) -> TradingEngine:
    if company_id not in _engines:
        _engines[company_id] = TradingEngine(company_id)
    return _engines[company_id]


async def start_engine(company_id: str):
    engine = get_engine(company_id)
    await engine.start()
    return engine


async def stop_engine(company_id: str):
    if company_id in _engines:
        await _engines[company_id].stop()
