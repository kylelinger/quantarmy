/**
 * Paper Trading Engine — client-side mutable state
 * Simulates a $100,000 paper trading account
 */

export interface PaperPosition {
  id: string
  symbol: string
  side: 'long' | 'short'
  size: number           // quantity
  notional: number       // size * entry_price (USD value at open)
  entry_price: number
  current_price: number
  stop_loss: number | null
  take_profit: number | null
  unrealized_pnl: number
  pnl_pct: number
  strategy: string       // which role recommended it
  opened_at: string
}

export interface PaperTrade {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  size: number
  price: number
  notional: number
  fee: number
  pnl: number            // realized P&L (0 for opens)
  strategy: string
  signal_reason: string
  executed_at: string
}

export interface EquityPoint {
  time: string
  value: number
}

export interface PaperAccount {
  initial_capital: number
  cash: number
  positions: PaperPosition[]
  trades: PaperTrade[]
  equity_curve: EquityPoint[]
}

// --- Singleton state ---
let _account: PaperAccount | null = null

function getAccount(): PaperAccount {
  if (_account) return _account

  // Try restore from localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('quantarmy_paper_account')
      if (saved) {
        _account = JSON.parse(saved)
        return _account!
      }
    } catch { /* ignore */ }
  }

  // Fresh account
  _account = {
    initial_capital: 100000,
    cash: 100000,
    positions: [],
    trades: [],
    equity_curve: generateInitialEquityCurve(100000),
  }
  persist()
  return _account
}

function persist() {
  if (typeof window !== 'undefined' && _account) {
    try {
      localStorage.setItem('quantarmy_paper_account', JSON.stringify(_account))
    } catch { /* ignore */ }
  }
}

function generateId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function generateInitialEquityCurve(capital: number): EquityPoint[] {
  // New account = flat line at initial capital (no fake random data)
  const today = new Date().toISOString().slice(0, 10)
  return [{ time: today, value: capital }]
}

// --- Public API ---

export function getPortfolio(): PaperAccount {
  return getAccount()
}

export function getTotalEquity(): number {
  const acc = getAccount()
  const positionValue = acc.positions.reduce((sum, p) => sum + p.unrealized_pnl, 0)
  return acc.cash + acc.positions.reduce((sum, p) => sum + p.notional, 0) + positionValue
}

export function getPortfolioSummary() {
  const acc = getAccount()
  const equity = getTotalEquity()
  const pnl = equity - acc.initial_capital
  const pnlPct = acc.initial_capital > 0 ? pnl / acc.initial_capital : 0
  const positionValue = acc.positions.reduce((sum, p) => sum + p.notional, 0)
  const exposure = equity > 0 ? positionValue / equity : 0

  // Calculate win rate from closed trades
  const closeTrades = acc.trades.filter(t => t.pnl !== 0)
  const wins = closeTrades.filter(t => t.pnl > 0).length
  const winRate = closeTrades.length > 0 ? wins / closeTrades.length : 0
  const totalRealized = closeTrades.reduce((sum, t) => sum + t.pnl, 0)

  return {
    equity,
    cash: acc.cash,
    initial_capital: acc.initial_capital,
    pnl,
    pnl_pct: pnlPct,
    total_realized: totalRealized,
    unrealized: acc.positions.reduce((sum, p) => sum + p.unrealized_pnl, 0),
    position_count: acc.positions.length,
    trade_count: acc.trades.length,
    win_rate: winRate,
    win_count: wins,
    loss_count: closeTrades.length - wins,
    exposure,
    exposure_pct: exposure,
  }
}

export function openPosition(params: {
  symbol: string
  side: 'long' | 'short'
  notional: number       // USD amount to invest
  price: number
  stop_loss?: number | null
  take_profit?: number | null
  strategy?: string
  reason?: string
}): PaperPosition {
  const acc = getAccount()

  if (params.notional > acc.cash) {
    throw new Error(`余额不足: 可用 $${acc.cash.toFixed(2)}, 需要 $${params.notional.toFixed(2)}`)
  }
  if (params.notional <= 0) {
    throw new Error('下单金额必须大于0')
  }

  const size = params.notional / params.price
  const fee = params.notional * 0.001 // 0.1% fee

  const position: PaperPosition = {
    id: generateId(),
    symbol: params.symbol,
    side: params.side,
    size,
    notional: params.notional,
    entry_price: params.price,
    current_price: params.price,
    stop_loss: params.stop_loss ?? null,
    take_profit: params.take_profit ?? null,
    unrealized_pnl: -fee, // start with fee cost
    pnl_pct: -0.001,
    strategy: params.strategy || 'manual',
    opened_at: new Date().toISOString(),
  }

  const trade: PaperTrade = {
    id: generateId(),
    symbol: params.symbol,
    side: 'buy',
    size,
    price: params.price,
    notional: params.notional,
    fee,
    pnl: 0,
    strategy: params.strategy || 'manual',
    signal_reason: params.reason || `${params.side.toUpperCase()} ${params.symbol}`,
    executed_at: new Date().toISOString(),
  }

  acc.cash -= params.notional + fee
  acc.positions.push(position)
  acc.trades.unshift(trade)
  recordEquityPoint(acc)
  persist()

  return position
}

export function closePosition(positionId: string, price: number): PaperTrade {
  const acc = getAccount()
  const idx = acc.positions.findIndex(p => p.id === positionId)
  if (idx === -1) throw new Error('持仓不存在')

  const pos = acc.positions[idx]
  const priceDiff = pos.side === 'long' ? price - pos.entry_price : pos.entry_price - price
  const pnl = priceDiff * pos.size
  const fee = pos.size * price * 0.001

  const trade: PaperTrade = {
    id: generateId(),
    symbol: pos.symbol,
    side: 'sell',
    size: pos.size,
    price,
    notional: pos.size * price,
    fee,
    pnl: pnl - fee,
    strategy: pos.strategy,
    signal_reason: `平仓 ${pos.symbol} | 入场 $${pos.entry_price.toFixed(2)} → $${price.toFixed(2)} | P&L $${(pnl - fee).toFixed(2)}`,
    executed_at: new Date().toISOString(),
  }

  acc.cash += pos.notional + pnl - fee
  acc.positions.splice(idx, 1)
  acc.trades.unshift(trade)
  recordEquityPoint(acc)
  persist()

  return trade
}

export function adjustPosition(positionId: string, updates: {
  stop_loss?: number | null
  take_profit?: number | null
}): PaperPosition {
  const acc = getAccount()
  const pos = acc.positions.find(p => p.id === positionId)
  if (!pos) throw new Error('持仓不存在')

  if (updates.stop_loss !== undefined) pos.stop_loss = updates.stop_loss
  if (updates.take_profit !== undefined) pos.take_profit = updates.take_profit
  persist()

  return pos
}

export function updatePrices(priceMap: Record<string, number>) {
  const acc = getAccount()
  let changed = false

  for (const pos of acc.positions) {
    const newPrice = priceMap[pos.symbol]
    if (newPrice && newPrice !== pos.current_price) {
      pos.current_price = newPrice
      const priceDiff = pos.side === 'long' ? newPrice - pos.entry_price : pos.entry_price - newPrice
      pos.unrealized_pnl = priceDiff * pos.size
      pos.pnl_pct = pos.entry_price > 0 ? priceDiff / pos.entry_price : 0
      changed = true
    }
  }

  if (changed) persist()
}

export function resetAccount() {
  _account = {
    initial_capital: 100000,
    cash: 100000,
    positions: [],
    trades: [],
    equity_curve: generateInitialEquityCurve(100000),
  }
  persist()
}

// --- Internal helpers ---

function recordEquityPoint(acc: PaperAccount) {
  const equity = acc.cash + acc.positions.reduce((sum, p) => sum + p.notional + p.unrealized_pnl, 0)
  const today = new Date().toISOString().slice(0, 10)

  // Update today's point or add new
  const lastIdx = acc.equity_curve.length - 1
  if (lastIdx >= 0 && acc.equity_curve[lastIdx].time === today) {
    acc.equity_curve[lastIdx].value = Math.round(equity * 100) / 100
  } else {
    acc.equity_curve.push({ time: today, value: Math.round(equity * 100) / 100 })
  }
}
