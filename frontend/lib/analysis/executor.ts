import type { AnalysisInput, ExecutorOutput } from './types'

export function analyzeExecutor(input: AnalysisInput): ExecutorOutput {
  const { symbol, market, quote, depth, recentTrades } = input
  const now = new Date().toISOString()
  const price = quote.price

  // Spread analysis (crypto only, from depth)
  let spreadBps: number | null = null
  if (depth && depth.bids.length > 0 && depth.asks.length > 0) {
    const bestBid = depth.bids[0].price
    const bestAsk = depth.asks[0].price
    const mid = (bestBid + bestAsk) / 2
    spreadBps = mid > 0 ? ((bestAsk - bestBid) / mid) * 10000 : null
  }

  // Slippage estimation from depth
  let slippage1k: number | null = null
  let slippage10k: number | null = null
  if (depth && depth.asks.length > 0 && price > 0) {
    slippage1k = estimateSlippage(depth.asks, 1000, price)
    slippage10k = estimateSlippage(depth.asks, 10000, price)
  }

  // Liquidity score (1-10)
  let liquidityScore = 5
  if (market === 'crypto') {
    const vol = quote.quote_volume_24h
    if (vol > 1e9) liquidityScore = 10
    else if (vol > 500e6) liquidityScore = 9
    else if (vol > 100e6) liquidityScore = 8
    else if (vol > 50e6) liquidityScore = 7
    else if (vol > 10e6) liquidityScore = 6
    else if (vol > 1e6) liquidityScore = 4
    else liquidityScore = 2

    if (spreadBps !== null) {
      if (spreadBps < 1) liquidityScore = Math.min(10, liquidityScore + 1)
      else if (spreadBps > 10) liquidityScore = Math.max(1, liquidityScore - 2)
    }
  } else {
    // Stocks: use volume as proxy
    if (quote.volume_24h > 50e6) liquidityScore = 9
    else if (quote.volume_24h > 10e6) liquidityScore = 7
    else if (quote.volume_24h > 1e6) liquidityScore = 5
    else liquidityScore = 3
  }

  // Execution strategy recommendation
  let strategy = '限价单'
  if (liquidityScore >= 8) strategy = '市价单即可，流动性充足'
  else if (liquidityScore >= 6) strategy = '限价单，挂在bid/ask中间'
  else if (liquidityScore >= 4) strategy = '分批限价，避免市价冲击'
  else strategy = '谨慎分批，流动性差'

  const parts: string[] = []
  parts.push(`流动性 ${liquidityScore}/10`)
  if (spreadBps !== null) parts.push(`价差 ${spreadBps.toFixed(1)} bps`)
  if (slippage1k !== null) parts.push(`$1K滑点 ${slippage1k.toFixed(1)} bps`)
  if (slippage10k !== null) parts.push(`$10K滑点 ${slippage10k.toFixed(1)} bps`)
  parts.push(strategy)

  return {
    role: 'executor', symbol, at: now,
    spread_bps: spreadBps,
    slippage_1k: slippage1k,
    slippage_10k: slippage10k,
    liquidity_score: liquidityScore,
    execution_strategy: strategy,
    summary: parts.join(' | '),
  }
}

function estimateSlippage(asks: { price: number; qty: number }[], notionalUsd: number, midPrice: number): number {
  let remaining = notionalUsd
  let totalCost = 0

  for (const level of asks) {
    const levelNotional = level.price * level.qty
    if (remaining <= levelNotional) {
      totalCost += remaining
      remaining = 0
      break
    }
    totalCost += levelNotional
    remaining -= levelNotional
  }

  if (remaining > 0) return 100 // Not enough depth

  const avgPrice = totalCost > 0 ? (notionalUsd / totalCost) * midPrice : midPrice
  return ((avgPrice - midPrice) / midPrice) * 10000
}
