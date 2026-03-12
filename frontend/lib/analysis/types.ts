import type { Kline, Quote, Depth, RecentTrade, MarketType } from '../market-adapter'

// --- Role output types ---

export interface CollectorOutput {
  role: 'collector'
  symbol: string
  at: string
  volume_24h: number
  quote_volume_24h: number
  price_range_pct: number       // (high-low)/low * 100
  bid_ask_ratio: number | null  // sum(bid_qty) / sum(ask_qty)
  buy_volume_pct: number | null // taker buy pct
  large_trades: number | null   // count of trades > 3x avg
  net_flow: number | null       // buy_vol - sell_vol in quote
  summary: string
}

export interface StrategistOutput {
  role: 'strategist'
  symbol: string
  at: string
  signal: 'LONG' | 'SHORT' | 'HOLD'
  confidence: number            // 0-1
  psar_direction: 'bull' | 'bear'
  ema_trend: 'bullish' | 'bearish' | 'neutral'
  adx: number
  rsi: number
  macd_histogram: number
  reasons: string[]
  summary: string
}

export interface RiskOfficerOutput {
  role: 'risk_officer'
  symbol: string
  at: string
  risk_score: number            // 1-10
  atr: number
  atr_pct: number               // ATR / price * 100
  volatility_percentile: number // 0-100
  suggested_position_pct: number // % of portfolio
  stop_loss_price: number | null
  take_profit_price: number | null
  max_drawdown_recent: number   // recent max drawdown %
  summary: string
}

export interface AnalystOutput {
  role: 'analyst'
  symbol: string
  at: string
  trend: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down'
  ma_alignment: string          // e.g. "多头排列 MA20>50>200"
  support: number
  resistance: number
  patterns: string[]            // candlestick patterns detected
  volume_trend: 'increasing' | 'decreasing' | 'stable'
  multi_tf_consensus: string    // "日线/4h/1h 全部看多" etc
  summary: string
}

export interface ResearcherOutput {
  role: 'researcher'
  symbol: string
  at: string
  volatility_percentile: number
  avg_daily_return: number
  return_std: number
  beta_to_btc: number | null    // only for crypto alts
  best_day_of_week: string | null
  similar_pattern_outcome: string | null
  summary: string
}

export interface ExecutorOutput {
  role: 'executor'
  symbol: string
  at: string
  spread_bps: number | null     // spread in basis points
  slippage_1k: number | null    // estimated slippage for $1K
  slippage_10k: number | null
  liquidity_score: number       // 1-10
  execution_strategy: string    // "limit" | "market" | "twap"
  summary: string
}

export interface CTOOutput {
  role: 'cto'
  symbol: string
  at: string
  data_freshness: Record<string, number> // role → seconds since update
  completeness: number          // n roles with data / total
  anomalies: string[]
  summary: string
}

export interface CEOOutput {
  role: 'ceo'
  symbol: string
  at: string
  verdict: 'LONG' | 'SHORT' | 'HOLD' | 'WAIT'
  consensus_score: number       // -1 (all short) to +1 (all long)
  bullish_count: number
  bearish_count: number
  neutral_count: number
  key_debates: string[]
  action_plan: string
  invalidation: string
  summary: string
}

export type RoleOutput =
  | CollectorOutput
  | StrategistOutput
  | RiskOfficerOutput
  | AnalystOutput
  | ResearcherOutput
  | ExecutorOutput
  | CTOOutput
  | CEOOutput

export interface AnalysisInput {
  symbol: string
  market: MarketType
  quote: Quote
  klines_1h: Kline[]
  klines_4h: Kline[]
  klines_1d: Kline[]
  depth: Depth | null
  recentTrades: RecentTrade[]
  // BTC klines for beta calculation (alts only)
  btc_klines_1d?: Kline[]
}

export interface FullAnalysis {
  symbol: string
  market: MarketType
  at: string
  collector: CollectorOutput
  strategist: StrategistOutput
  risk_officer: RiskOfficerOutput
  analyst: AnalystOutput
  researcher: ResearcherOutput
  executor: ExecutorOutput
  cto: CTOOutput
  ceo: CEOOutput
}
