"""Trading API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.company import Company, Position, Trade
from app.services.trading_engine import start_engine, stop_engine

router = APIRouter(prefix="/api/company/{company_id}/trading", tags=["trading"])


def _ok(data):
    return {"ok": True, "data": data, "error": None}


@router.get("/positions")
async def get_positions(company_id: str, db: AsyncSession = Depends(get_db)):
    """Get current positions."""
    result = await db.execute(select(Position).where(Position.company_id == company_id))
    positions = result.scalars().all()
    return _ok([
        {
            "id": p.id,
            "symbol": p.symbol,
            "side": p.side,
            "size": p.size,
            "entry_price": p.entry_price,
            "current_price": p.current_price,
            "unrealized_pnl": p.unrealized_pnl,
            "pnl_pct": (p.unrealized_pnl / (p.size * p.entry_price)) if p.size * p.entry_price > 0 else 0,
            "strategy": p.strategy,
            "opened_at": p.opened_at.isoformat(),
        }
        for p in positions
    ])


@router.get("/history")
async def get_trade_history(
    company_id: str,
    limit: int = 50,
    offset: int = 0,
    symbol: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get trade history."""
    query = select(Trade).where(Trade.company_id == company_id)
    if symbol:
        query = query.where(Trade.symbol == symbol)
    query = query.order_by(Trade.executed_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    trades = result.scalars().all()
    return _ok([
        {
            "id": t.id,
            "symbol": t.symbol,
            "side": t.side,
            "size": t.size,
            "price": t.price,
            "fee": t.fee,
            "strategy": t.strategy,
            "signal_reason": t.signal_reason,
            "executed_at": t.executed_at.isoformat(),
        }
        for t in trades
    ])


@router.get("/performance")
async def get_performance(company_id: str, db: AsyncSession = Depends(get_db)):
    """Get trading performance metrics computed from trade history."""
    result = await db.execute(
        select(Trade).where(Trade.company_id == company_id).order_by(Trade.executed_at)
    )
    trades = result.scalars().all()

    if not trades:
        return _ok({
            "trades": 0, "win_rate": 0.0, "profit_factor": 0.0,
            "max_drawdown": 0.0, "sharpe_ratio": 0.0, "total_return": 0.0,
        })

    # Pair entries/exits to compute PnL per round trip
    open_trades: dict[str, Trade] = {}  # symbol → entry trade
    pnls = []

    for t in trades:
        if t.side in ("buy",):
            open_trades[t.symbol] = t
        elif t.side in ("sell",) and t.symbol in open_trades:
            entry = open_trades.pop(t.symbol)
            pnl = (t.price - entry.price) * min(t.size, entry.size)
            pnls.append(pnl)

    total_trades = len(pnls)
    if total_trades == 0:
        return _ok({
            "trades": len(trades), "win_rate": 0.0, "profit_factor": 0.0,
            "max_drawdown": 0.0, "sharpe_ratio": 0.0, "total_return": 0.0,
        })

    wins = [p for p in pnls if p > 0]
    losses = [p for p in pnls if p <= 0]
    gross_profit = sum(wins) if wins else 0
    gross_loss = abs(sum(losses)) if losses else 0

    company = (await db.execute(select(Company).where(Company.id == company_id))).scalar_one_or_none()
    initial = company.initial_capital if company else 100_000

    return _ok({
        "trades": total_trades,
        "win_rate": len(wins) / total_trades if total_trades else 0,
        "profit_factor": gross_profit / gross_loss if gross_loss > 0 else 0,
        "max_drawdown": 0.0,  # TODO: compute from equity curve
        "sharpe_ratio": 0.0,  # TODO: compute from daily returns
        "total_return": (company.current_equity - initial) / initial if company else 0,
    })


@router.post("/start")
async def start_trading(company_id: str, db: AsyncSession = Depends(get_db)):
    """Start simulation trading engine."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.status = "active"
    await db.commit()

    await start_engine(company_id)
    return _ok({"message": "Trading engine started", "status": "active"})


@router.post("/stop")
async def stop_trading(company_id: str, db: AsyncSession = Depends(get_db)):
    """Stop simulation trading engine."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.status = "paused"
    await db.commit()

    await stop_engine(company_id)
    return _ok({"message": "Trading engine stopped", "status": "paused"})
