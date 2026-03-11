"""Built-in Strategist Skill: PSAR Trend Following.

A production-battle-tested Parabolic SAR trend strategy,
adapted from the AItrading production system.
"""
from app.skills.base import BaseSkill, TradeContext, SkillOutput


class PSARTrendSkill(BaseSkill):
    """Parabolic SAR trend following strategy.
    
    Signals:
    - LONG: PSAR flips below price (bullish) + price above EMA
    - SHORT: PSAR flips above price (bearish) + price below EMA
    - CLOSE: PSAR crosses back (trend reversal)
    
    Known characteristics from live testing:
    - Works best on 5m and 1h timeframes
    - Requires minimum ADX ≥ 20 for trending regime
    - Slow AF (0.01 start) outperforms default AF (0.02)
    """

    name = "PSAR Trend"
    version = "1.0.0"
    role_type = "strategist"
    description = "Parabolic SAR trend following with EMA filter and ADX regime guard"
    parameters = [
        {"name": "af_start", "type": "float", "default": 0.01, "min_value": 0.001, "max_value": 0.1, "description": "PSAR acceleration factor start"},
        {"name": "af_step", "type": "float", "default": 0.01, "min_value": 0.001, "max_value": 0.1, "description": "PSAR acceleration factor step"},
        {"name": "af_max", "type": "float", "default": 0.10, "min_value": 0.05, "max_value": 0.5, "description": "PSAR acceleration factor max"},
        {"name": "ema_period", "type": "int", "default": 50, "min_value": 10, "max_value": 200, "description": "EMA trend filter period"},
        {"name": "adx_period", "type": "int", "default": 14, "min_value": 7, "max_value": 30, "description": "ADX regime detection period"},
        {"name": "adx_min", "type": "float", "default": 20.0, "min_value": 10.0, "max_value": 40.0, "description": "Minimum ADX for trending regime"},
        {"name": "size_pct", "type": "float", "default": 0.2, "min_value": 0.05, "max_value": 0.5, "description": "Position size as % of equity"},
        {"name": "sl_atr_mult", "type": "float", "default": 2.5, "min_value": 1.0, "max_value": 5.0, "description": "Stop loss ATR multiplier"},
        {"name": "tp_atr_mult", "type": "float", "default": 4.0, "min_value": 1.0, "max_value": 10.0, "description": "Take profit ATR multiplier"},
    ]

    def __init__(self):
        # PSAR state
        self._psar_value: float | None = None
        self._psar_bull: bool = True
        self._af: float = 0.01
        self._ep: float = 0.0
        # Config will be set in initialize()
        self.cfg = {}

    async def initialize(self, config: dict) -> None:
        self.cfg = {
            "af_start": float(config.get("af_start", 0.01)),
            "af_step": float(config.get("af_step", 0.01)),
            "af_max": float(config.get("af_max", 0.10)),
            "ema_period": int(config.get("ema_period", 50)),
            "adx_period": int(config.get("adx_period", 14)),
            "adx_min": float(config.get("adx_min", 20.0)),
            "size_pct": float(config.get("size_pct", 0.2)),
            "sl_atr_mult": float(config.get("sl_atr_mult", 2.5)),
            "tp_atr_mult": float(config.get("tp_atr_mult", 4.0)),
        }

    async def execute(self, ctx: TradeContext) -> SkillOutput:
        closes = ctx.closes
        highs = ctx.highs
        lows = ctx.lows

        if len(closes) < 50:
            return SkillOutput(action="HOLD", reason="Insufficient data (need 50+ candles)")

        # 1. Compute PSAR
        psar_bull, psar_val = self._compute_psar(highs, lows, closes)

        # 2. EMA filter
        ema_val = self.ema(closes, self.cfg["ema_period"])
        price = closes[-1]

        # 3. ADX regime check
        adx_val = self._compute_adx(highs, lows, closes, self.cfg["adx_period"])
        in_trend = adx_val >= self.cfg["adx_min"]

        # 4. ATR for SL/TP
        atr_val = self.atr(highs, lows, closes, 14)

        # 5. Position state
        has_pos = self.has_position(ctx)
        position = self.get_position(ctx)

        # --- Signal logic ---
        if not has_pos:
            if not in_trend:
                return SkillOutput(
                    action="HOLD",
                    reason=f"No trend: ADX={adx_val:.1f} < {self.cfg['adx_min']}"
                )

            if psar_bull and price > ema_val:
                # Long entry
                sl_pct = (atr_val * self.cfg["sl_atr_mult"]) / price
                tp_pct = (atr_val * self.cfg["tp_atr_mult"]) / price
                return SkillOutput(
                    action="LONG",
                    symbol=ctx.symbol,
                    size_pct=self.cfg["size_pct"],
                    stop_loss_pct=sl_pct,
                    take_profit_pct=tp_pct,
                    reason=f"PSAR bull flip | EMA={ema_val:.2f} | ADX={adx_val:.1f}",
                    metadata={"psar": psar_val, "ema": ema_val, "adx": adx_val, "atr": atr_val},
                )

            if not psar_bull and price < ema_val:
                # Short entry
                sl_pct = (atr_val * self.cfg["sl_atr_mult"]) / price
                tp_pct = (atr_val * self.cfg["tp_atr_mult"]) / price
                return SkillOutput(
                    action="SHORT",
                    symbol=ctx.symbol,
                    size_pct=self.cfg["size_pct"],
                    stop_loss_pct=sl_pct,
                    take_profit_pct=tp_pct,
                    reason=f"PSAR bear flip | EMA={ema_val:.2f} | ADX={adx_val:.1f}",
                    metadata={"psar": psar_val, "ema": ema_val, "adx": adx_val, "atr": atr_val},
                )

        else:
            # Close on PSAR reversal
            if position and position["side"] == "long" and not psar_bull:
                return SkillOutput(action="CLOSE", symbol=ctx.symbol, reason="PSAR bear reversal — exit long")
            if position and position["side"] == "short" and psar_bull:
                return SkillOutput(action="CLOSE", symbol=ctx.symbol, reason="PSAR bull reversal — exit short")

        return SkillOutput(action="HOLD", reason=f"Holding | PSAR={'bull' if psar_bull else 'bear'} | ADX={adx_val:.1f}")

    def _compute_psar(self, highs: list[float], lows: list[float], closes: list[float]) -> tuple[bool, float]:
        """Compute Parabolic SAR, return (is_bullish, sar_value)."""
        af_start = self.cfg["af_start"]
        af_step = self.cfg["af_step"]
        af_max = self.cfg["af_max"]

        n = len(closes)
        bull = True
        af = af_start
        ep = highs[0]
        sar = lows[0]

        for i in range(1, n):
            prev_sar = sar
            sar = sar + af * (ep - sar)

            if bull:
                if lows[i] < sar:
                    bull = False
                    sar = ep
                    ep = lows[i]
                    af = af_start
                else:
                    if highs[i] > ep:
                        ep = highs[i]
                        af = min(af + af_step, af_max)
                    sar = min(sar, lows[i - 1])
            else:
                if highs[i] > sar:
                    bull = True
                    sar = ep
                    ep = highs[i]
                    af = af_start
                else:
                    if lows[i] < ep:
                        ep = lows[i]
                        af = min(af + af_step, af_max)
                    sar = max(sar, highs[i - 1])

        return bull, sar

    def _compute_adx(self, highs: list[float], lows: list[float], closes: list[float], period: int = 14) -> float:
        """Compute Average Directional Index."""
        if len(closes) < period * 2:
            return 0.0

        trs, plus_dm, minus_dm = [], [], []
        for i in range(1, len(closes)):
            tr = max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1]))
            pdm = max(highs[i] - highs[i - 1], 0) if highs[i] - highs[i - 1] > lows[i - 1] - lows[i] else 0
            ndm = max(lows[i - 1] - lows[i], 0) if lows[i - 1] - lows[i] > highs[i] - highs[i - 1] else 0
            trs.append(tr)
            plus_dm.append(pdm)
            minus_dm.append(ndm)

        def smooth(data, p):
            s = sum(data[:p])
            result = [s]
            for v in data[p:]:
                s = s - s / p + v
                result.append(s)
            return result

        atr_s = smooth(trs, period)
        pdm_s = smooth(plus_dm, period)
        ndm_s = smooth(minus_dm, period)

        dx_vals = []
        for a, p, n in zip(atr_s, pdm_s, ndm_s):
            if a == 0:
                continue
            di_plus = 100 * p / a
            di_minus = 100 * n / a
            dx = 100 * abs(di_plus - di_minus) / (di_plus + di_minus + 1e-9)
            dx_vals.append(dx)

        if not dx_vals:
            return 0.0
        return sum(dx_vals[-period:]) / min(len(dx_vals), period)
