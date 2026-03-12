"""Built-in skill catalog for QuantArmy v1.

V1 product shape:
- 8 independent role agents
- 3 default cards per role
- users can switch active card per role
- later they can import GitHub/open-source cards into the same slot model
"""

BUILTIN_SKILL_CATALOG = [
    # CEO
    {
        "name": "Consensus Judge",
        "role_type": "ceo",
        "version": "1.0.0",
        "description": "Aggregate the other seven role opinions into a clear directional summary with disagreement heat.",
        "parameters": [
            {"name": "min_consensus", "type": "float", "default": 0.6, "min_value": 0.3, "max_value": 1.0, "description": "Minimum alignment score before CEO emits a directional bias"},
            {"name": "weight_risk", "type": "float", "default": 1.2, "min_value": 0.5, "max_value": 2.0, "description": "Extra weight for Risk Officer opinion"},
        ],
    },
    {
        "name": "Capital Allocator",
        "role_type": "ceo",
        "version": "1.0.0",
        "description": "Translate team confidence into watch priority and capital attention level.",
        "parameters": [
            {"name": "max_focus_symbols", "type": "int", "default": 5, "min_value": 1, "max_value": 20, "description": "Maximum number of high-attention symbols at once"},
            {"name": "base_attention_score", "type": "float", "default": 0.5, "min_value": 0.0, "max_value": 1.0, "description": "Base threshold for promoting a symbol"},
        ],
    },
    {
        "name": "Thesis Validator",
        "role_type": "ceo",
        "version": "1.0.0",
        "description": "Check whether the current thesis still holds and define invalidation conditions.",
        "parameters": [
            {"name": "validity_hours", "type": "int", "default": 12, "min_value": 1, "max_value": 168, "description": "How long a thesis remains valid before review"},
            {"name": "require_cto_signoff", "type": "bool", "default": True, "description": "Require CTO confidence check before final thesis acceptance"},
        ],
    },

    # CTO
    {
        "name": "Data Integrity Checker",
        "role_type": "cto",
        "version": "1.0.0",
        "description": "Validate freshness, completeness, and consistency of symbol data before analysis.",
        "parameters": [
            {"name": "max_staleness_sec", "type": "int", "default": 90, "min_value": 10, "max_value": 3600, "description": "Maximum tolerated quote delay"},
            {"name": "missing_bar_tolerance", "type": "int", "default": 2, "min_value": 0, "max_value": 20, "description": "Allowed missing candles in recent history"},
        ],
    },
    {
        "name": "Signal Reliability Auditor",
        "role_type": "cto",
        "version": "1.0.0",
        "description": "Score whether the current role outputs are backed by enough evidence and stable inputs.",
        "parameters": [
            {"name": "min_sample_size", "type": "int", "default": 30, "min_value": 5, "max_value": 500, "description": "Minimum sample size before approving a signal family"},
            {"name": "confidence_floor", "type": "float", "default": 0.55, "min_value": 0.1, "max_value": 1.0, "description": "Minimum reliability score required"},
        ],
    },
    {
        "name": "Pipeline Health Monitor",
        "role_type": "cto",
        "version": "1.0.0",
        "description": "Check whether all role pipelines completed, updated recently, and remain internally consistent.",
        "parameters": [
            {"name": "max_role_lag_min", "type": "int", "default": 30, "min_value": 1, "max_value": 1440, "description": "Maximum delay allowed between role analyses"},
            {"name": "strict_mode", "type": "bool", "default": False, "description": "Fail summary if any critical role is missing"},
        ],
    },

    # Strategist
    {
        "name": "PSAR Trend",
        "role_type": "strategist",
        "version": "1.0.0",
        "description": "Parabolic SAR trend following with EMA filter and ADX regime guard.",
        "parameters": [
            {"name": "af_start", "type": "float", "default": 0.01, "min_value": 0.001, "max_value": 0.1, "description": "PSAR acceleration factor start"},
            {"name": "af_step", "type": "float", "default": 0.01, "min_value": 0.001, "max_value": 0.1, "description": "PSAR acceleration factor step"},
            {"name": "af_max", "type": "float", "default": 0.1, "min_value": 0.05, "max_value": 0.5, "description": "PSAR acceleration factor max"},
            {"name": "ema_period", "type": "int", "default": 50, "min_value": 10, "max_value": 200, "description": "EMA trend filter period"},
            {"name": "adx_min", "type": "float", "default": 20.0, "min_value": 10.0, "max_value": 40.0, "description": "Minimum ADX for trending regime"},
        ],
        "backtest_result": {"trades": 27, "win_rate": 0.444, "profit_factor": 1.07, "max_drawdown": 0.024, "sharpe_ratio": 0.07, "total_return": 0.004},
    },
    {
        "name": "RSI Mean Reversion",
        "role_type": "strategist",
        "version": "1.0.0",
        "description": "Fade short-term exhaustion inside bounded/ranging conditions using RSI extremes.",
        "parameters": [
            {"name": "rsi_period", "type": "int", "default": 14, "min_value": 5, "max_value": 50, "description": "RSI lookback period"},
            {"name": "oversold", "type": "float", "default": 28, "min_value": 5, "max_value": 45, "description": "RSI long trigger threshold"},
            {"name": "overbought", "type": "float", "default": 72, "min_value": 55, "max_value": 95, "description": "RSI short trigger threshold"},
        ],
        "backtest_result": {"trades": 43, "win_rate": 0.512, "profit_factor": 0.96, "max_drawdown": 0.041, "sharpe_ratio": -0.03, "total_return": -0.006},
    },
    {
        "name": "Breakout Momentum",
        "role_type": "strategist",
        "version": "1.0.0",
        "description": "Trade expansion moves when price escapes recent range with volume confirmation.",
        "parameters": [
            {"name": "lookback", "type": "int", "default": 20, "min_value": 5, "max_value": 100, "description": "Range breakout lookback"},
            {"name": "volume_multiplier", "type": "float", "default": 1.5, "min_value": 1.0, "max_value": 5.0, "description": "Required volume expansion"},
            {"name": "atr_stop", "type": "float", "default": 2.2, "min_value": 0.5, "max_value": 6.0, "description": "ATR stop multiple"},
        ],
        "backtest_result": {"trades": 19, "win_rate": 0.421, "profit_factor": 1.18, "max_drawdown": 0.031, "sharpe_ratio": 0.13, "total_return": 0.011},
    },

    # Risk Officer
    {
        "name": "Position Guard",
        "role_type": "risk_officer",
        "version": "1.0.0",
        "description": "Position sizing, drawdown guard, and total exposure limits.",
        "parameters": [
            {"name": "max_position_pct", "type": "float", "default": 0.15, "min_value": 0.05, "max_value": 0.5, "description": "Max single position as % of equity"},
            {"name": "max_total_exposure", "type": "float", "default": 0.8, "min_value": 0.3, "max_value": 1.0, "description": "Max total portfolio exposure"},
        ],
    },
    {
        "name": "Volatility Guard",
        "role_type": "risk_officer",
        "version": "1.0.0",
        "description": "Reject or downweight setups when volatility and gap risk expand too quickly.",
        "parameters": [
            {"name": "max_atr_pct", "type": "float", "default": 0.08, "min_value": 0.01, "max_value": 0.3, "description": "Maximum ATR as % of price"},
            {"name": "reduce_size_factor", "type": "float", "default": 0.5, "min_value": 0.1, "max_value": 1.0, "description": "Sizing multiplier under high volatility"},
        ],
    },
    {
        "name": "Drawdown Scenario",
        "role_type": "risk_officer",
        "version": "1.0.0",
        "description": "Project worst-case pullback and define invalidation / stop ranges.",
        "parameters": [
            {"name": "scenario_confidence", "type": "float", "default": 0.95, "min_value": 0.5, "max_value": 0.99, "description": "Confidence level for stress scenario"},
            {"name": "lookback_bars", "type": "int", "default": 120, "min_value": 20, "max_value": 1000, "description": "History used for drawdown scenario"},
        ],
    },

    # Collector
    {
        "name": "News Pulse",
        "role_type": "collector",
        "version": "1.0.0",
        "description": "Summarize recent news catalysts and their likely directional bias.",
        "parameters": [
            {"name": "lookback_hours", "type": "int", "default": 24, "min_value": 1, "max_value": 168, "description": "News lookback window"},
            {"name": "max_headlines", "type": "int", "default": 8, "min_value": 1, "max_value": 30, "description": "Maximum headlines to summarize"},
        ],
    },
    {
        "name": "Social Sentiment",
        "role_type": "collector",
        "version": "1.0.0",
        "description": "Track crowd attention and social discussion skew around a symbol narrative.",
        "parameters": [
            {"name": "min_mentions", "type": "int", "default": 20, "min_value": 1, "max_value": 5000, "description": "Minimum mentions for stable score"},
            {"name": "decay_hours", "type": "int", "default": 8, "min_value": 1, "max_value": 72, "description": "How fast old social signals decay"},
        ],
    },
    {
        "name": "Event Tracker",
        "role_type": "collector",
        "version": "1.0.0",
        "description": "Monitor upcoming catalysts such as earnings, unlocks, upgrades, and macro events.",
        "parameters": [
            {"name": "lookahead_days", "type": "int", "default": 14, "min_value": 1, "max_value": 180, "description": "Forward event horizon"},
            {"name": "alert_severity", "type": "select", "default": "medium", "options": ["low", "medium", "high"], "description": "Minimum event severity to surface"},
        ],
    },

    # Analyst
    {
        "name": "Market Structure",
        "role_type": "analyst",
        "version": "1.0.0",
        "description": "Map trend, regime, support/resistance, and where price sits inside the larger structure.",
        "parameters": [
            {"name": "structure_lookback", "type": "int", "default": 200, "min_value": 50, "max_value": 1000, "description": "Bars used to derive structure"},
            {"name": "pivot_sensitivity", "type": "int", "default": 3, "min_value": 1, "max_value": 10, "description": "Swing high/low sensitivity"},
        ],
    },
    {
        "name": "Factor Snapshot",
        "role_type": "analyst",
        "version": "1.0.0",
        "description": "Summarize momentum, volatility, volume, and correlation factors in one view.",
        "parameters": [
            {"name": "momentum_window", "type": "int", "default": 20, "min_value": 5, "max_value": 252, "description": "Momentum lookback"},
            {"name": "benchmark", "type": "str", "default": "BTCUSDT", "description": "Benchmark symbol for relative strength / correlation"},
        ],
    },
    {
        "name": "Backtest Lens",
        "role_type": "analyst",
        "version": "1.0.0",
        "description": "Compare the current market condition to similar historical regimes and show likely outcomes.",
        "parameters": [
            {"name": "similarity_threshold", "type": "float", "default": 0.75, "min_value": 0.1, "max_value": 1.0, "description": "Minimum historical similarity score"},
            {"name": "top_matches", "type": "int", "default": 10, "min_value": 1, "max_value": 100, "description": "Historical analogues to include"},
        ],
    },

    # Researcher
    {
        "name": "Comparable Cases",
        "role_type": "researcher",
        "version": "1.0.0",
        "description": "Retrieve similar historical cases and explain how they resolved.",
        "parameters": [
            {"name": "case_lookback_days", "type": "int", "default": 365, "min_value": 30, "max_value": 3650, "description": "Historical search horizon"},
            {"name": "max_cases", "type": "int", "default": 5, "min_value": 1, "max_value": 20, "description": "Maximum comparable cases shown"},
        ],
    },
    {
        "name": "Narrative Tracker",
        "role_type": "researcher",
        "version": "1.0.0",
        "description": "Track whether the dominant market narrative around a symbol is strengthening or fading.",
        "parameters": [
            {"name": "narrative_window_days", "type": "int", "default": 30, "min_value": 3, "max_value": 180, "description": "Narrative evaluation window"},
            {"name": "min_source_count", "type": "int", "default": 5, "min_value": 1, "max_value": 100, "description": "Minimum number of sources before conviction"},
        ],
    },
    {
        "name": "Open Source Hunter",
        "role_type": "researcher",
        "version": "1.0.0",
        "description": "Recommend open-source strategies or repos relevant to the current symbol and regime.",
        "parameters": [
            {"name": "max_repos", "type": "int", "default": 5, "min_value": 1, "max_value": 20, "description": "Maximum repo suggestions"},
            {"name": "freshness_days", "type": "int", "default": 365, "min_value": 7, "max_value": 3650, "description": "Repository recency filter"},
        ],
    },

    # Executor
    {
        "name": "Liquidity Check",
        "role_type": "executor",
        "version": "1.0.0",
        "description": "Assess order book depth, volume, and execution friendliness for the symbol.",
        "parameters": [
            {"name": "min_daily_volume", "type": "float", "default": 1000000, "min_value": 10000, "max_value": 10000000000, "description": "Minimum daily notional volume"},
            {"name": "spread_limit_bps", "type": "float", "default": 12, "min_value": 1, "max_value": 500, "description": "Maximum spread allowed in basis points"},
        ],
    },
    {
        "name": "Slippage Estimator",
        "role_type": "executor",
        "version": "1.0.0",
        "description": "Estimate slippage at different order sizes and volatility conditions.",
        "parameters": [
            {"name": "test_order_pct", "type": "float", "default": 0.1, "min_value": 0.01, "max_value": 5.0, "description": "Order size as % of average bar volume"},
            {"name": "volatility_adjustment", "type": "float", "default": 1.0, "min_value": 0.1, "max_value": 5.0, "description": "Multiplier for fast markets"},
        ],
    },
    {
        "name": "Execution Plan",
        "role_type": "executor",
        "version": "1.0.0",
        "description": "Convert a thesis into a practical entry/exit plan with tranche and order guidance.",
        "parameters": [
            {"name": "max_tranches", "type": "int", "default": 3, "min_value": 1, "max_value": 10, "description": "Maximum number of entry slices"},
            {"name": "use_limit_orders", "type": "bool", "default": True, "description": "Prefer passive execution when possible"},
        ],
    },
]
