import type { AnalysisInput, CollectorOutput } from './types'

export function analyzeCollector(input: AnalysisInput): CollectorOutput {
  const { symbol, quote, depth, recentTrades } = input
  const now = new Date().toISOString()

  const priceRange = quote.low_24h > 0 ? ((quote.high_24h - quote.low_24h) / quote.low_24h) * 100 : 0

  // Bid/ask ratio from depth
  let bidAskRatio: number | null = null
  if (depth && depth.bids.length > 0 && depth.asks.length > 0) {
    const totalBid = depth.bids.reduce((s, b) => s + b.qty * b.price, 0)
    const totalAsk = depth.asks.reduce((s, a) => s + a.qty * a.price, 0)
    bidAskRatio = totalAsk > 0 ? totalBid / totalAsk : 1
  }

  // Recent trades analysis
  let buyVolPct: number | null = null
  let largeTrades: number | null = null
  let netFlow: number | null = null

  if (recentTrades.length > 0) {
    const avgQty = recentTrades.reduce((s, t) => s + t.quoteQty, 0) / recentTrades.length
    const buyTrades = recentTrades.filter(t => !t.isBuyerMaker)
    const sellTrades = recentTrades.filter(t => t.isBuyerMaker)

    buyVolPct = buyTrades.length / recentTrades.length * 100
    largeTrades = recentTrades.filter(t => t.quoteQty > avgQty * 3).length
    const buyVol = buyTrades.reduce((s, t) => s + t.quoteQty, 0)
    const sellVol = sellTrades.reduce((s, t) => s + t.quoteQty, 0)
    netFlow = buyVol - sellVol
  }

  // Generate summary
  const parts: string[] = []
  parts.push(`24h成交量 ${formatVol(quote.quote_volume_24h)}`)
  parts.push(`振幅 ${priceRange.toFixed(1)}%`)
  if (bidAskRatio !== null) {
    parts.push(`买卖比 ${bidAskRatio.toFixed(2)}${bidAskRatio > 1.2 ? ' (买盘强)' : bidAskRatio < 0.8 ? ' (卖盘强)' : ''}`)
  }
  if (buyVolPct !== null) {
    parts.push(`主买占比 ${buyVolPct.toFixed(0)}%`)
  }
  if (largeTrades !== null && largeTrades > 0) {
    parts.push(`大单 ${largeTrades} 笔`)
  }

  return {
    role: 'collector',
    symbol,
    at: now,
    volume_24h: quote.volume_24h,
    quote_volume_24h: quote.quote_volume_24h,
    price_range_pct: priceRange,
    bid_ask_ratio: bidAskRatio,
    buy_volume_pct: buyVolPct,
    large_trades: largeTrades,
    net_flow: netFlow,
    summary: parts.join(' | '),
  }
}

function formatVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}
