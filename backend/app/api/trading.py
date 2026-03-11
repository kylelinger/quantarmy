"""Trading API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.company import Company, Position, Trade

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
    """Get trading performance metrics."""
    # TODO: calculate from trade history
    return _ok({
        "trades": 0,
        "win_rate": 0.0,
        "profit_factor": 0.0,
        "max_drawdown": 0.0,
        "sharpe_ratio": 0.0,
        "total_return": 0.0,
    })


@router.post("/start")
async def start_trading(company_id: str, db: AsyncSession = Depends(get_db)):
    """Start simulation trading."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.status = "active"
    await db.commit()
    # TODO: start the trading engine tick loop
    return _ok({"message": "Trading started", "status": "active"})


@router.post("/stop")
async def stop_trading(company_id: str, db: AsyncSession = Depends(get_db)):
    """Stop simulation trading."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.status = "paused"
    await db.commit()
    return _ok({"message": "Trading stopped", "status": "paused"})
