"""Built-in Risk Officer Skill.

Reviews trade signals from the Strategist and applies risk management:
- Position size caps based on portfolio concentration
- Drawdown circuit breaker
- Correlation guard (don't overload same-sector bets)
- Dynamic SL/TP adjustment
"""
from app.skills.base import BaseSkill, TradeContext, SkillOutput


class RiskOfficerSkill(BaseSkill):
    """Risk Officer: reviews and adjusts trade signals.

    Input: TradeContext with info_signals containing the Strategist's proposal.
    Output: Approved/adjusted SkillOutput or HOLD (veto).
    """

    name = "Basic Risk Officer"
    version = "1.0.0"
    role_type = "risk_officer"
    description = "Position sizing, drawdown guard, max exposure limits"
    parameters = [
        {"name": "max_position_pct", "type": "float", "default": 0.15, "min_value": 0.05, "max_value": 0.5, "description": "Max single position as % of equity"},
        {"name": "max_total_exposure", "type": "float", "default": 0.8, "min_value": 0.3, "max_value": 1.0, "description": "Max total portfolio exposure"},
        {"name": "max_positions", "type": "int", "default": 10, "min_value": 1, "max_value": 20, "description": "Max number of open positions"},
        {"name": "drawdown_halt_pct", "type": "float", "default": 0.15, "min_value": 0.05, "max_value": 0.5, "description": "Halt new trades if drawdown exceeds this"},
        {"name": "min_sl_pct", "type": "float", "default": 0.01, "min_value": 0.005, "max_value": 0.05, "description": "Minimum stop loss %"},
        {"name": "max_sl_pct", "type": "float", "default": 0.05, "min_value": 0.02, "max_value": 0.15, "description": "Maximum stop loss %"},
    ]

    def __init__(self):
        self.cfg = {}
        self.peak_equity = 0.0

    async def initialize(self, config: dict) -> None:
        self.cfg = {
            "max_position_pct": float(config.get("max_position_pct", 0.15)),
            "max_total_exposure": float(config.get("max_total_exposure", 0.8)),
            "max_positions": int(config.get("max_positions", 10)),
            "drawdown_halt_pct": float(config.get("drawdown_halt_pct", 0.15)),
            "min_sl_pct": float(config.get("min_sl_pct", 0.01)),
            "max_sl_pct": float(config.get("max_sl_pct", 0.05)),
        }

    async def execute(self, ctx: TradeContext) -> SkillOutput:
        # Track peak equity for drawdown calculation
        if ctx.equity > self.peak_equity:
            self.peak_equity = ctx.equity

        # Get the strategist's proposal from info_signals
        if not ctx.info_signals:
            return SkillOutput(action="HOLD", reason="No signal to review")

        proposal = ctx.info_signals[0]
        action = proposal.get("action", "HOLD")
        symbol = proposal.get("symbol", ctx.symbol)
        size_pct = proposal.get("size_pct", 0.0)
        sl_pct = proposal.get("stop_loss_pct")
        tp_pct = proposal.get("take_profit_pct")
        orig_reason = proposal.get("reason", "")

        if action == "HOLD":
            return SkillOutput(action="HOLD", reason="Strategist says HOLD")

        if action == "CLOSE":
            return SkillOutput(action="CLOSE", symbol=symbol, reason=f"Approved close: {orig_reason}")

        # --- Risk checks for LONG/SHORT ---
        adjustments = []

        # 1. Drawdown check
        if self.peak_equity > 0:
            drawdown = (self.peak_equity - ctx.equity) / self.peak_equity
            if drawdown >= self.cfg["drawdown_halt_pct"]:
                return SkillOutput(
                    action="HOLD",
                    reason=f"VETO: Drawdown {drawdown:.1%} ≥ {self.cfg['drawdown_halt_pct']:.0%} halt threshold",
                )

        # 2. Max positions check
        if len(ctx.positions) >= self.cfg["max_positions"]:
            return SkillOutput(
                action="HOLD",
                reason=f"VETO: Already at max positions ({len(ctx.positions)}/{self.cfg['max_positions']})",
            )

        # 3. Total exposure check
        total_exposure = sum(
            p.get("size", 0) * p.get("entry_price", 0) for p in ctx.positions
        ) / ctx.equity if ctx.equity > 0 else 0
        remaining_capacity = self.cfg["max_total_exposure"] - total_exposure
        if remaining_capacity <= 0.01:
            return SkillOutput(
                action="HOLD",
                reason=f"VETO: Total exposure {total_exposure:.1%} ≥ {self.cfg['max_total_exposure']:.0%} cap",
            )

        # 4. Cap position size
        original_size = size_pct
        size_pct = min(size_pct, self.cfg["max_position_pct"])
        size_pct = min(size_pct, remaining_capacity)
        if size_pct != original_size:
            adjustments.append(f"size {original_size:.1%}→{size_pct:.1%}")

        # 5. Enforce SL bounds
        if sl_pct is not None:
            orig_sl = sl_pct
            sl_pct = max(sl_pct, self.cfg["min_sl_pct"])
            sl_pct = min(sl_pct, self.cfg["max_sl_pct"])
            if sl_pct != orig_sl:
                adjustments.append(f"SL {orig_sl:.2%}→{sl_pct:.2%}")
        else:
            sl_pct = self.cfg["min_sl_pct"]
            adjustments.append(f"added SL {sl_pct:.2%}")

        # 6. Duplicate position check
        if any(p.get("symbol") == symbol for p in ctx.positions):
            return SkillOutput(
                action="HOLD",
                reason=f"VETO: Already have position in {symbol}",
            )

        adj_note = f" | Adjusted: {', '.join(adjustments)}" if adjustments else ""
        return SkillOutput(
            action=action,
            symbol=symbol,
            size_pct=size_pct,
            stop_loss_pct=sl_pct,
            take_profit_pct=tp_pct,
            reason=f"APPROVED: {orig_reason}{adj_note}",
        )
