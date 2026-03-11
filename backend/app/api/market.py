"""Market data API routes."""
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/market", tags=["market"])

# Default symbol lists
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


@router.get("/symbols")
async def get_symbols(market: str = "crypto"):
    """Get available trading symbols."""
    symbols = CRYPTO_SYMBOLS if market == "crypto" else STOCK_SYMBOLS
    return _ok(symbols)


@router.get("/price/{symbol}")
async def get_price(symbol: str):
    """Get latest price for a symbol."""
    # TODO: fetch from Binance/Yahoo
    return _ok({"symbol": symbol, "price": 0.0, "source": "pending"})


@router.get("/klines/{symbol}")
async def get_klines(
    symbol: str,
    interval: str = "5m",
    limit: int = Query(default=500, le=1000),
):
    """Get OHLCV kline data."""
    # TODO: fetch from data pipeline
    return _ok({"symbol": symbol, "interval": interval, "klines": [], "message": "Data pipeline not yet connected"})
