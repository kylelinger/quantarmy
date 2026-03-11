"""Market data pipeline — fetches and normalizes price data."""
import httpx
from datetime import datetime, timezone
from dataclasses import dataclass

from app.core.config import BINANCE_REST_URL


@dataclass
class OHLCV:
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class DataPipeline:
    """Fetches market data from exchanges and normalizes to standard format."""

    def __init__(self):
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def get_klines(self, symbol: str, interval: str = "5m", limit: int = 500) -> list[OHLCV]:
        """Fetch OHLCV kline data from Binance."""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{BINANCE_REST_URL}/api/v3/klines",
                params={"symbol": symbol, "interval": interval, "limit": limit},
            )
            resp.raise_for_status()
            data = resp.json()

            return [
                OHLCV(
                    timestamp=datetime.fromtimestamp(k[0] / 1000, tz=timezone.utc),
                    open=float(k[1]),
                    high=float(k[2]),
                    low=float(k[3]),
                    close=float(k[4]),
                    volume=float(k[5]),
                )
                for k in data
            ]
        except Exception as e:
            print(f"[DataPipeline] Failed to fetch klines for {symbol}: {e}")
            return []

    async def get_price(self, symbol: str) -> float | None:
        """Fetch latest price."""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{BINANCE_REST_URL}/api/v3/ticker/price",
                params={"symbol": symbol},
            )
            resp.raise_for_status()
            return float(resp.json()["price"])
        except Exception as e:
            print(f"[DataPipeline] Failed to fetch price for {symbol}: {e}")
            return None

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# Singleton
data_pipeline = DataPipeline()
