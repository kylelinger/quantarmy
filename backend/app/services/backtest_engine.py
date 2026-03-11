"""Backtest Engine — runs a skill against historical data and computes metrics."""
import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.skills.base import BaseSkill, TradeContext, SkillOutput
from app.services.data_pipeline import data_pipeline, OHLCV


@dataclass
class BacktestTrade:
    symbol: str
    side: str         # long | short
    entry_price: float
    exit_price: float
    size: float
    pnl: float
    pnl_pct: float
    reason_open: str
    reason_close: str
    bar_open: int
    bar_close: int


@dataclass
class BacktestResult:
    trades: int = 0
    wins: int = 0
    losses: int = 0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    total_return: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    avg_trade_pnl: float = 0.0
    max_consecutive_losses: int = 0
    trade_list: list[BacktestTrade] = field(default_factory=list)
    equity_curve: list[float] = field(default_factory=list)
    error: str | None = None

    def to_dict(self) -> dict:
        return {
            "trades": self.trades,
            "wins": self.wins,
            "losses": self.losses,
            "win_rate": self.win_rate,
            "profit_factor": self.profit_factor,
            "total_return": self.total_return,
            "max_drawdown": self.max_drawdown,
            "sharpe_ratio": self.sharpe_ratio,
            "avg_trade_pnl": self.avg_trade_pnl,
            "max_consecutive_losses": self.max_consecutive_losses,
            "equity_curve": self.equity_curve[-100:],  # Last 100 points for charting
            "error": self.error,
        }


PERIOD_MAP = {
    "1w": "1h",     # 1 week → 168 bars
    "1m": "1h",     # 1 month → ~720 bars
    "3m": "4h",     # 3 months → ~540 bars
    "6m": "1d",     # 6 months → ~180 bars
    "1y": "1d",     # 1 year → 365 bars
}

PERIOD_BARS = {
    "1w": 168,
    "1m": 720,
    "3m": 540,
    "6m": 180,
    "1y": 365,
}


class BacktestEngine:
    """Run a BaseSkill against historical data."""

    def __init__(self, initial_capital: float = 100_000.0):
        self.initial_capital = initial_capital

    async def run(
        self,
        skill: BaseSkill,
        symbol: str,
        period: str = "3m",
        config: dict | None = None,
    ) -> BacktestResult:
        """Execute a full backtest."""
        result = BacktestResult()

        try:
            # Initialize skill
            await skill.initialize(config or {})

            # Fetch data
            interval = PERIOD_MAP.get(period, "1h")
            limit = PERIOD_BARS.get(period, 500)
            klines = await data_pipeline.get_klines(symbol, interval=interval, limit=limit + 200)

            if len(klines) < 100:
                result.error = f"Insufficient data: got {len(klines)} bars, need ≥100"
                return result

            # Run simulation
            equity = self.initial_capital
            peak_equity = equity
            cash = equity
            position: dict | None = None  # {side, size, entry_price, reason}
            equity_curve = [equity]
            returns = []

            # Walk forward: use first 200 bars as warmup, then trade bar-by-bar
            warmup = min(200, len(klines) - 50)

            for i in range(warmup, len(klines)):
                window = klines[:i + 1]
                closes = [k.close for k in window]
                opens = [k.open for k in window]
                highs = [k.high for k in window]
                lows = [k.low for k in window]
                volumes = [k.volume for k in window]
                price = closes[-1]

                # Build context
                positions_list = []
                if position:
                    positions_list = [{
                        "symbol": symbol,
                        "side": position["side"],
                        "size": position["size"],
                        "entry_price": position["entry_price"],
                    }]

                ctx = TradeContext(
                    symbol=symbol,
                    closes=closes, opens=opens, highs=highs, lows=lows, volumes=volumes,
                    interval=interval,
                    current_price=price,
                    equity=equity,
                    cash=cash,
                    positions=positions_list,
                    config=config or {},
                )

                # Execute skill
                output = await skill.execute(ctx)

                # Process output
                if output.action in ("LONG", "SHORT") and position is None:
                    # Open position
                    notional = equity * output.size_pct
                    size = notional / price
                    position = {
                        "side": "long" if output.action == "LONG" else "short",
                        "size": size,
                        "entry_price": price,
                        "reason": output.reason,
                        "bar": i,
                        "sl_pct": output.stop_loss_pct,
                        "tp_pct": output.take_profit_pct,
                    }
                    cash -= notional

                elif output.action == "CLOSE" and position is not None:
                    # Close position
                    trade = self._close_position(position, price, i, output.reason, symbol)
                    result.trade_list.append(trade)
                    equity += trade.pnl
                    cash = equity
                    position = None

                # Check SL/TP
                if position:
                    sl_hit, tp_hit = False, False
                    if position.get("sl_pct"):
                        if position["side"] == "long":
                            sl_hit = price <= position["entry_price"] * (1 - position["sl_pct"])
                        else:
                            sl_hit = price >= position["entry_price"] * (1 + position["sl_pct"])

                    if position.get("tp_pct"):
                        if position["side"] == "long":
                            tp_hit = price >= position["entry_price"] * (1 + position["tp_pct"])
                        else:
                            tp_hit = price <= position["entry_price"] * (1 - position["tp_pct"])

                    if sl_hit:
                        trade = self._close_position(position, price, i, "Stop Loss", symbol)
                        result.trade_list.append(trade)
                        equity += trade.pnl
                        cash = equity
                        position = None
                    elif tp_hit:
                        trade = self._close_position(position, price, i, "Take Profit", symbol)
                        result.trade_list.append(trade)
                        equity += trade.pnl
                        cash = equity
                        position = None

                # Track equity
                if position:
                    if position["side"] == "long":
                        unrealized = (price - position["entry_price"]) * position["size"]
                    else:
                        unrealized = (position["entry_price"] - price) * position["size"]
                    current_equity = cash + position["size"] * price
                else:
                    current_equity = equity

                equity_curve.append(current_equity)
                if current_equity > peak_equity:
                    peak_equity = current_equity

                # Track returns for Sharpe
                if len(equity_curve) >= 2:
                    ret = (equity_curve[-1] - equity_curve[-2]) / equity_curve[-2] if equity_curve[-2] > 0 else 0
                    returns.append(ret)

            # Close any remaining position at last price
            if position:
                last_price = klines[-1].close
                trade = self._close_position(position, last_price, len(klines) - 1, "Backtest end", symbol)
                result.trade_list.append(trade)
                equity += trade.pnl

            # Compute metrics
            result.trades = len(result.trade_list)
            result.equity_curve = equity_curve

            if result.trades > 0:
                wins = [t for t in result.trade_list if t.pnl > 0]
                losses = [t for t in result.trade_list if t.pnl <= 0]
                result.wins = len(wins)
                result.losses = len(losses)
                result.win_rate = len(wins) / result.trades

                gross_profit = sum(t.pnl for t in wins) if wins else 0
                gross_loss = abs(sum(t.pnl for t in losses)) if losses else 0
                result.profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf') if gross_profit > 0 else 0

                result.total_return = (equity - self.initial_capital) / self.initial_capital
                result.avg_trade_pnl = sum(t.pnl for t in result.trade_list) / result.trades

                # Max drawdown
                peak = equity_curve[0]
                max_dd = 0
                for eq in equity_curve:
                    if eq > peak:
                        peak = eq
                    dd = (peak - eq) / peak if peak > 0 else 0
                    max_dd = max(max_dd, dd)
                result.max_drawdown = max_dd

                # Sharpe ratio (annualized, assuming daily returns)
                if returns:
                    import statistics
                    avg_ret = statistics.mean(returns)
                    std_ret = statistics.stdev(returns) if len(returns) > 1 else 1
                    result.sharpe_ratio = (avg_ret / std_ret) * (252 ** 0.5) if std_ret > 0 else 0

                # Max consecutive losses
                max_cl, cl = 0, 0
                for t in result.trade_list:
                    if t.pnl <= 0:
                        cl += 1
                        max_cl = max(max_cl, cl)
                    else:
                        cl = 0
                result.max_consecutive_losses = max_cl

        except Exception as e:
            result.error = str(e)

        return result

    def _close_position(self, position: dict, price: float, bar: int, reason: str, symbol: str) -> BacktestTrade:
        if position["side"] == "long":
            pnl = (price - position["entry_price"]) * position["size"]
        else:
            pnl = (position["entry_price"] - price) * position["size"]
        pnl_pct = pnl / (position["size"] * position["entry_price"]) if position["entry_price"] > 0 else 0

        return BacktestTrade(
            symbol=symbol,
            side=position["side"],
            entry_price=position["entry_price"],
            exit_price=price,
            size=position["size"],
            pnl=pnl,
            pnl_pct=pnl_pct,
            reason_open=position["reason"],
            reason_close=reason,
            bar_open=position["bar"],
            bar_close=bar,
        )


# Singleton
backtest_engine = BacktestEngine()
