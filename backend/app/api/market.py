"""Market data API routes — real Binance data for crypto."""
import httpx
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/api/market", tags=["market"])

BINANCE_BASE = "https://data-api.binance.vision"

CRYPTO_SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "DOTUSDT", "MATICUSDT",
    "LINKUSDT", "UNIUSDT", "ATOMUSDT", "LTCUSDT", "NEARUSDT",
]

STOCK_SYMBOLS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
    "META", "TSLA", "BRK.B", "JPM", "V",
    "JNJ", "WMT", "PG", "MA", "HD",
]


def _ok(data):
    return {"ok": True, "data": data, "error": None}


def _err(msg: str, status: int = 400):
    raise HTTPException(status_code=status, detail={"ok": False, "data": None, "error": msg})


@router.get("/symbols")
async def get_symbols(market: str = "crypto"):
    symbols = CRYPTO_SYMBOLS if market == "crypto" else STOCK_SYMBOLS
    return _ok(symbols)


@router.get("/price/{symbol}")
async def get_price(symbol: str):
    """Get latest price from Binance ticker."""
    sym = symbol.upper()
    if sym not in CRYPTO_SYMBOLS:
        return _ok({"symbol": sym, "price": 0.0, "source": "unsupported"})

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{BINANCE_BASE}/api/v3/ticker/price", params={"symbol": sym})
        if resp.status_code != 200:
            _err(f"Binance API error: {resp.status_code}", 502)
        data = resp.json()
        return _ok({
            "symbol": sym,
            "price": float(data["price"]),
            "source": "binance",
        })


@router.get("/price/batch")
async def get_prices_batch(symbols: str = ""):
    """Get prices for multiple symbols. Comma-separated."""
    if not symbols:
        return _ok([])
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    crypto_syms = [s for s in syms if s in CRYPTO_SYMBOLS]

    if not crypto_syms:
        return _ok([])

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{BINANCE_BASE}/api/v3/ticker/price")
        if resp.status_code != 200:
            _err(f"Binance API error: {resp.status_code}", 502)
        all_prices = {t["symbol"]: float(t["price"]) for t in resp.json()}
        result = [{"symbol": s, "price": all_prices.get(s, 0), "source": "binance"} for s in crypto_syms]
        return _ok(result)


@router.get("/klines/{symbol}")
async def get_klines(
    symbol: str,
    interval: str = "5m",
    limit: int = Query(default=500, le=1000),
):
    """Get OHLCV kline data from Binance."""
    sym = symbol.upper()
    if sym not in CRYPTO_SYMBOLS:
        return _ok({"symbol": sym, "interval": interval, "klines": [], "message": "Only crypto supported for now"})

    valid_intervals = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"]
    if interval not in valid_intervals:
        _err(f"Invalid interval. Valid: {valid_intervals}")

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{BINANCE_BASE}/api/v3/klines",
            params={"symbol": sym, "interval": interval, "limit": limit},
        )
        if resp.status_code != 200:
            _err(f"Binance API error: {resp.status_code}", 502)

        raw = resp.json()
        klines = [
            {
                "open_time": k[0],
                "open": float(k[1]),
                "high": float(k[2]),
                "low": float(k[3]),
                "close": float(k[4]),
                "volume": float(k[5]),
                "close_time": k[6],
            }
            for k in raw
        ]
        return _ok({"symbol": sym, "interval": interval, "count": len(klines), "klines": klines})


@router.get("/ticker24h/{symbol}")
async def get_ticker_24h(symbol: str):
    """Get 24h ticker stats from Binance."""
    sym = symbol.upper()
    if sym not in CRYPTO_SYMBOLS:
        return _ok({"symbol": sym, "source": "unsupported"})

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{BINANCE_BASE}/api/v3/ticker/24hr", params={"symbol": sym})
        if resp.status_code != 200:
            _err(f"Binance API error: {resp.status_code}", 502)
        d = resp.json()
        return _ok({
            "symbol": sym,
            "price": float(d["lastPrice"]),
            "change_24h": float(d["priceChange"]),
            "change_pct_24h": float(d["priceChangePercent"]),
            "high_24h": float(d["highPrice"]),
            "low_24h": float(d["lowPrice"]),
            "volume_24h": float(d["volume"]),
            "quote_volume_24h": float(d["quoteVolume"]),
            "source": "binance",
        })
