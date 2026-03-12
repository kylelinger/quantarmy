"""Watchlist API — user's selected symbols for team analysis."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.core.database import get_db
from app.models.company import WatchlistItem

router = APIRouter(prefix="/api/company/{company_id}/watchlist", tags=["watchlist"])


def _ok(data):
    return {"ok": True, "data": data, "error": None}


class AddSymbolRequest(BaseModel):
    symbol: str
    display_name: str = ""
    market: str = "crypto"
    notes: str = ""
    tags: list[str] = []
    priority: int = 0


class UpdateSymbolRequest(BaseModel):
    notes: str | None = None
    tags: list[str] | None = None
    priority: int | None = None


class BatchAddRequest(BaseModel):
    symbols: list[AddSymbolRequest]


def _serialize(item: WatchlistItem) -> dict:
    return {
        "id": item.id,
        "symbol": item.symbol,
        "display_name": item.display_name,
        "market": item.market,
        "notes": item.notes,
        "tags": item.tags,
        "priority": item.priority,
        "added_at": item.added_at.isoformat(),
        "last_analysis": item.last_analysis,
    }


@router.get("")
async def get_watchlist(
    company_id: str,
    market: str | None = None,
    tag: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all watchlist items, optionally filtered."""
    query = select(WatchlistItem).where(WatchlistItem.company_id == company_id)
    if market:
        query = query.where(WatchlistItem.market == market)
    query = query.order_by(WatchlistItem.priority.desc(), WatchlistItem.added_at.desc())

    result = await db.execute(query)
    items = result.scalars().all()

    # If tag filter, do it in Python (JSON field)
    if tag:
        items = [i for i in items if tag in (i.tags or [])]

    return _ok([_serialize(i) for i in items])


@router.post("")
async def add_symbol(company_id: str, req: AddSymbolRequest, db: AsyncSession = Depends(get_db)):
    """Add a symbol to watchlist."""
    # Check duplicate
    existing = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.company_id == company_id,
            WatchlistItem.symbol == req.symbol.upper(),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"{req.symbol} already in watchlist")

    item = WatchlistItem(
        company_id=company_id,
        symbol=req.symbol.upper(),
        display_name=req.display_name or req.symbol.upper(),
        market=req.market,
        notes=req.notes,
        tags=req.tags,
        priority=req.priority,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _ok(_serialize(item))


@router.post("/batch")
async def batch_add(company_id: str, req: BatchAddRequest, db: AsyncSession = Depends(get_db)):
    """Add multiple symbols at once."""
    # Get existing symbols
    existing = await db.execute(
        select(WatchlistItem.symbol).where(WatchlistItem.company_id == company_id)
    )
    existing_symbols = {r[0] for r in existing}

    added = []
    skipped = []
    for s in req.symbols:
        sym = s.symbol.upper()
        if sym in existing_symbols:
            skipped.append(sym)
            continue
        item = WatchlistItem(
            company_id=company_id,
            symbol=sym,
            display_name=s.display_name or sym,
            market=s.market,
            notes=s.notes,
            tags=s.tags,
            priority=s.priority,
        )
        db.add(item)
        existing_symbols.add(sym)
        added.append(sym)

    await db.commit()
    return _ok({"added": added, "skipped": skipped, "total": len(added)})


@router.get("/{item_id}")
async def get_watchlist_item(company_id: str, item_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single watchlist item with latest analysis."""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.id == item_id,
            WatchlistItem.company_id == company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not found in watchlist")
    return _ok(_serialize(item))


@router.patch("/{item_id}")
async def update_watchlist_item(
    company_id: str, item_id: str, req: UpdateSymbolRequest, db: AsyncSession = Depends(get_db)
):
    """Update notes, tags, or priority."""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.id == item_id,
            WatchlistItem.company_id == company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not found in watchlist")

    if req.notes is not None:
        item.notes = req.notes
    if req.tags is not None:
        item.tags = req.tags
    if req.priority is not None:
        item.priority = req.priority

    await db.commit()
    await db.refresh(item)
    return _ok(_serialize(item))


@router.delete("/{item_id}")
async def remove_symbol(company_id: str, item_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a symbol from watchlist."""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.id == item_id,
            WatchlistItem.company_id == company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not found in watchlist")

    await db.delete(item)
    await db.commit()
    return _ok({"deleted": item_id, "symbol": item.symbol})


@router.post("/{item_id}/analyze")
async def request_analysis(company_id: str, item_id: str, db: AsyncSession = Depends(get_db)):
    """Request the team to analyze this symbol (triggers role pipeline)."""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.id == item_id,
            WatchlistItem.company_id == company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not found in watchlist")

    # TODO: trigger analysis pipeline (each role analyzes this symbol)
    # For now return the current analysis
    return _ok({
        "symbol": item.symbol,
        "status": "analysis_requested",
        "current_analysis": item.last_analysis,
    })
