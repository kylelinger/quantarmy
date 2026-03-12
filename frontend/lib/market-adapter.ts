/**
 * Unified Market Data Adapter
 * Routes to Binance (crypto) or Yahoo Finance (stocks) automatically.
 */

export type MarketType = 'crypto' | 'hk_stock' | 'a_share'

export interface Quote {
  symbol: string
  price: number
  change_24h: number
  change_pct_24h: number
  high_24h: number
  low_24h: number
  volume_24h: number
  quote_volume_24h: number
  market: MarketType
  source: string
  delayed?: boolean
}

export interface Kline {
  time: number       // ms timestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface DepthLevel {
  price: number
  qty: number
}

export interface Depth {
  bids: DepthLevel[]
  asks: DepthLevel[]
  source: string
}

export interface RecentTrade {
  price: number
  qty: number
  quoteQty: number
  time: number
  isBuyerMaker: boolean
}

// --- Market type detection ---

export function detectMarket(symbol: string): MarketType {
  if (symbol.endsWith('USDT') || symbol.endsWith('BTC') || symbol.endsWith('BUSD')) return 'crypto'
  if (symbol.endsWith('.HK')) return 'hk_stock'
  if (symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return 'a_share'
  return 'crypto' // fallback
}

export function marketLabel(m: MarketType): string {
  switch (m) {
    case 'crypto': return '加密货币'
    case 'hk_stock': return '港股'
    case 'a_share': return 'A股'
  }
}

// --- Fetch helpers ---

async function apiFetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'API error')
  return json.data as T
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  return apiFetchJson(`/api/market/ticker24h?symbol=${encodeURIComponent(symbol)}`)
}

export async function fetchKlines(symbol: string, interval: string = '1h', limit: number = 200): Promise<Kline[]> {
  return apiFetchJson(`/api/market/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`)
}

export async function fetchDepth(symbol: string, limit: number = 20): Promise<Depth> {
  return apiFetchJson(`/api/market/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`)
}

export async function fetchRecentTrades(symbol: string, limit: number = 100): Promise<RecentTrade[]> {
  return apiFetchJson(`/api/market/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`)
}
