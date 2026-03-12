'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist } from '@/lib/hooks'
import { EquityCurve } from '@/components/Market/EquityCurve'
import { formatCurrency, formatPercent, pnlColor, cn, timeAgo } from '@/lib/utils'
import { ROLES } from '@/lib/types'
import {
  getPortfolio,
  getPortfolioSummary,
  getTotalEquity,
  openPosition,
  closePosition,
  adjustPosition,
  resetAccount,
  type PaperPosition,
  type PaperTrade,
  type EquityPoint,
} from '@/lib/paper-trading'

export default function CompanyOverviewPage() {
  const { company, companyId, roles } = useCompanyContext()
  const { items: watchlistItems } = useWatchlist(companyId)

  // Paper trading state — client-side only
  const [positions, setPositions] = useState<PaperPosition[]>([])
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [equityData, setEquityData] = useState<EquityPoint[]>([])
  const [summary, setSummary] = useState(getPortfolioSummary())
  const [mounted, setMounted] = useState(false)

  // Modal state
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState<string | null>(null)
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'team'>('positions')

  const refreshState = useCallback(() => {
    const acc = getPortfolio()
    setPositions([...acc.positions])
    setTrades([...acc.trades])
    setEquityData([...acc.equity_curve])
    setSummary(getPortfolioSummary())
  }, [])

  useEffect(() => {
    setMounted(true)
    refreshState()
  }, [refreshState])

  if (!mounted) {
    return <div className="py-16 text-center text-dark-500">加载模拟盘...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-100">📊 模拟盘</h1>
          <p className="text-dark-400 mt-1">模拟下单，验证团队建议，实时追踪权益</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2.5 bg-army-600 hover:bg-army-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📝 模拟下单
          </button>
          <button
            onClick={() => {
              if (confirm('确定要重置模拟盘？所有持仓和交易记录将清零，初始资金恢复为 $100,000')) {
                resetAccount()
                refreshState()
              }
            }}
            className="px-3 py-2.5 text-dark-500 hover:text-dark-300 text-sm rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
          >
            🔄 重置
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="总权益" value={formatCurrency(summary.equity)} />
        <MetricCard
          label="总盈亏"
          value={formatCurrency(summary.pnl)}
          sub={formatPercent(summary.pnl_pct)}
          className={pnlColor(summary.pnl)}
        />
        <MetricCard label="可用资金" value={formatCurrency(summary.cash)} />
        <MetricCard
          label="持仓数 / 交易数"
          value={`${summary.position_count} / ${summary.trade_count}`}
        />
        <MetricCard
          label="胜率"
          value={summary.trade_count > 0 ? `${(summary.win_rate * 100).toFixed(0)}%` : '-'}
          sub={summary.trade_count > 0 ? `${summary.win_count}胜 ${summary.loss_count}负` : '暂无交易'}
        />
      </div>

      {/* Unrealized vs Realized */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-dark-500 text-xs">未实现盈亏</p>
            <p className={cn('text-lg font-bold mt-1', pnlColor(summary.unrealized))}>{formatCurrency(summary.unrealized)}</p>
          </div>
          <div className="text-right">
            <p className="text-dark-500 text-xs">仓位占比</p>
            <p className="text-lg font-bold text-dark-200 mt-1">{(summary.exposure_pct * 100).toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-4 flex items-center justify-between">
          <div>
            <p className="text-dark-500 text-xs">已实现盈亏</p>
            <p className={cn('text-lg font-bold mt-1', pnlColor(summary.total_realized))}>{formatCurrency(summary.total_realized)}</p>
          </div>
          <div className="text-right">
            <p className="text-dark-500 text-xs">初始资金</p>
            <p className="text-lg font-bold text-dark-200 mt-1">{formatCurrency(summary.initial_capital)}</p>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <h3 className="text-lg font-semibold text-dark-200 mb-4">权益曲线</h3>
        <EquityCurve data={equityData} initialCapital={summary.initial_capital} height={280} />
      </div>

      {/* Tabs: Positions / History / Team */}
      <div>
        <div className="flex gap-1 bg-dark-900 rounded-lg p-1 border border-dark-800 w-fit">
          {(['positions', 'history', 'team'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm rounded-md transition-colors',
                activeTab === tab ? 'bg-dark-700 text-dark-100 font-medium' : 'text-dark-400 hover:text-dark-200'
              )}
            >
              {tab === 'positions' ? `📦 当前持仓 (${positions.length})` : tab === 'history' ? `📜 交易记录 (${trades.length})` : '👥 团队状态'}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeTab === 'positions' && (
            <PositionsPanel
              positions={positions}
              onClose={(id) => setShowCloseModal(id)}
              onAdjust={(id) => setShowAdjustModal(id)}
            />
          )}
          {activeTab === 'history' && <HistoryPanel trades={trades} />}
          {activeTab === 'team' && <TeamPanel roles={roles} />}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-900/90 text-red-200 px-4 py-3 rounded-lg shadow-xl text-sm z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <OrderModal
          watchlistItems={watchlistItems}
          cash={summary.cash}
          onSubmit={(params) => {
            try {
              openPosition(params)
              refreshState()
              setShowOrderModal(false)
              setError(null)
            } catch (e: any) {
              setError(e.message)
            }
          }}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Close Position Modal */}
      {showCloseModal && (
        <CloseModal
          position={positions.find(p => p.id === showCloseModal)!}
          onConfirm={(id, price) => {
            try {
              closePosition(id, price)
              refreshState()
              setShowCloseModal(null)
              setError(null)
            } catch (e: any) {
              setError(e.message)
            }
          }}
          onClose={() => setShowCloseModal(null)}
        />
      )}

      {/* Adjust Position Modal */}
      {showAdjustModal && (
        <AdjustModal
          position={positions.find(p => p.id === showAdjustModal)!}
          onConfirm={(id, updates) => {
            try {
              adjustPosition(id, updates)
              refreshState()
              setShowAdjustModal(null)
            } catch (e: any) {
              setError(e.message)
            }
          }}
          onClose={() => setShowAdjustModal(null)}
        />
      )}
    </div>
  )
}

// --- Positions Panel ---
function PositionsPanel({
  positions,
  onClose,
  onAdjust,
}: {
  positions: PaperPosition[]
  onClose: (id: string) => void
  onAdjust: (id: string) => void
}) {
  if (positions.length === 0) {
    return (
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-dark-300 text-lg">暂无持仓</p>
        <p className="text-dark-500 text-sm mt-1">点击"模拟下单"开始建仓</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {positions.map(pos => (
        <div key={pos.id} className="bg-dark-900 rounded-xl border border-dark-800 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn(
                'px-2.5 py-1 rounded text-xs font-bold',
                pos.side === 'long' ? 'bg-army-900/40 text-army-400' : 'bg-red-900/40 text-red-400'
              )}>
                {pos.side === 'long' ? '做多' : '做空'}
              </span>
              <Link href={`/company/watchlist/${pos.symbol}`} className="text-lg font-bold text-dark-100 hover:text-army-400 transition-colors">
                {pos.symbol}
              </Link>
              <span className="text-dark-500 text-xs px-2 py-0.5 bg-dark-800 rounded">{pos.strategy}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAdjust(pos.id)}
                className="px-3 py-1.5 text-xs text-dark-400 hover:text-dark-200 border border-dark-700 hover:border-dark-600 rounded-lg transition-colors"
              >
                ⚙️ 调仓
              </button>
              <button
                onClick={() => onClose(pos.id)}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-900/60 rounded-lg transition-colors"
              >
                ✕ 平仓
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
            <div>
              <p className="text-dark-500 text-xs">持仓量</p>
              <p className="text-dark-200 font-medium mt-0.5">{pos.size.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">开仓价</p>
              <p className="text-dark-200 font-medium mt-0.5">{formatCurrency(pos.entry_price)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">市值</p>
              <p className="text-dark-200 font-medium mt-0.5">{formatCurrency(pos.notional)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">未实现盈亏</p>
              <p className={cn('font-bold mt-0.5', pnlColor(pos.unrealized_pnl))}>
                {formatCurrency(pos.unrealized_pnl)}
                <span className="text-xs ml-1">({formatPercent(pos.pnl_pct)})</span>
              </p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">止损 / 止盈</p>
              <p className="text-dark-200 mt-0.5 text-xs">
                <span className="text-red-400">{pos.stop_loss ? formatCurrency(pos.stop_loss) : '—'}</span>
                {' / '}
                <span className="text-army-400">{pos.take_profit ? formatCurrency(pos.take_profit) : '—'}</span>
              </p>
            </div>
          </div>

          <p className="text-dark-600 text-xs mt-3">{timeAgo(pos.opened_at)} 开仓</p>
        </div>
      ))}
    </div>
  )
}

// --- History Panel ---
function HistoryPanel({ trades }: { trades: PaperTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
        <p className="text-4xl mb-3">📜</p>
        <p className="text-dark-300 text-lg">暂无交易记录</p>
      </div>
    )
  }

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
      <div className="divide-y divide-dark-800">
        {trades.map(t => (
          <div key={t.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium min-w-[40px] text-center',
                t.side === 'buy' ? 'bg-army-900/30 text-army-400' : 'bg-red-900/30 text-red-400'
              )}>
                {t.side === 'buy' ? '买入' : '卖出'}
              </span>
              <span className="text-dark-200 font-medium">{t.symbol}</span>
              <span className="text-dark-500 text-xs hidden md:inline">{t.signal_reason}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-dark-300">{formatCurrency(t.price)}</span>
              <span className="text-dark-400 text-xs">{formatCurrency(t.notional)}</span>
              {t.pnl !== 0 && (
                <span className={cn('font-medium', pnlColor(t.pnl))}>{formatCurrency(t.pnl)}</span>
              )}
              <span className="text-dark-600 text-xs min-w-[60px] text-right">{timeAgo(t.executed_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Team Panel ---
function TeamPanel({ roles }: { roles: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {ROLES.map((roleMeta) => {
        const role = roles.find((r: any) => r.role_type === roleMeta.type)
        return (
          <Link
            key={roleMeta.type}
            href={`/company/${roleMeta.type}`}
            className="bg-dark-900 rounded-xl border border-dark-800 p-5 hover:border-dark-600 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${roleMeta.color}20` }}>
                {roleMeta.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-dark-100 group-hover:text-army-400 transition-colors">{roleMeta.label}</p>
                <p className="text-xs text-dark-500 truncate">{roleMeta.description}</p>
              </div>
            </div>
            {role?.last_output ? (
              <p className="text-sm text-dark-400 line-clamp-2 leading-5">{role.last_output}</p>
            ) : (
              <p className="text-sm text-dark-600">等待分析...</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className={cn('w-2 h-2 rounded-full', role?.status === 'active' ? 'bg-army-500' : 'bg-dark-600')} />
              <span className="text-xs text-dark-500">{role?.status === 'active' ? '运行中' : '空闲'}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// --- Order Modal ---
function OrderModal({
  watchlistItems,
  cash,
  onSubmit,
  onClose,
}: {
  watchlistItems: any[]
  cash: number
  onSubmit: (params: any) => void
  onClose: () => void
}) {
  const [symbol, setSymbol] = useState(watchlistItems[0]?.symbol || 'BTCUSDT')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [notional, setNotional] = useState('')
  const [price, setPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [strategy, setStrategy] = useState('manual')
  const [reason, setReason] = useState('')

  const quickAmounts = [1000, 5000, 10000, 20000]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-800">
          <h2 className="text-xl font-bold text-dark-100">📝 模拟下单</h2>
          <button onClick={onClose} className="text-dark-500 hover:text-dark-300 text-lg">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Symbol */}
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">标的</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            >
              {watchlistItems.map((item: any) => (
                <option key={item.symbol} value={item.symbol}>{item.symbol} — {item.display_name}</option>
              ))}
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="ETHUSDT">ETHUSDT</option>
            </select>
          </div>

          {/* Side */}
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">方向</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSide('long')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                  side === 'long' ? 'bg-army-900/40 border-army-700 text-army-400' : 'bg-dark-800 border-dark-700 text-dark-400'
                )}
              >
                📈 做多 (LONG)
              </button>
              <button
                onClick={() => setSide('short')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                  side === 'short' ? 'bg-red-900/40 border-red-700 text-red-400' : 'bg-dark-800 border-dark-700 text-dark-400'
                )}
              >
                📉 做空 (SHORT)
              </button>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">开仓价格 (USD)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="输入当前市价"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>

          {/* Notional */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-dark-400 text-sm">下单金额 (USD)</label>
              <span className="text-dark-500 text-xs">可用: {formatCurrency(cash)}</span>
            </div>
            <input
              type="number"
              value={notional}
              onChange={(e) => setNotional(e.target.value)}
              placeholder="投入金额"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
            <div className="flex gap-2 mt-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setNotional(String(amt))}
                  className="flex-1 py-1.5 text-xs bg-dark-800 border border-dark-700 rounded-lg text-dark-400 hover:text-dark-200 hover:border-dark-600 transition-colors"
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* SL / TP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-dark-400 text-sm mb-1.5 block">止损价 (可选)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="止损价"
                className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-dark-400 text-sm mb-1.5 block">止盈价 (可选)</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="止盈价"
                className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">下单理由 (可选)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如: 策略师PSAR看多 + CEO确认"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-dark-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-dark-700 text-dark-400 hover:text-dark-200 rounded-lg transition-colors">
            取消
          </button>
          <button
            onClick={() => {
              if (!price || !notional) return
              onSubmit({
                symbol,
                side,
                notional: parseFloat(notional),
                price: parseFloat(price),
                stop_loss: stopLoss ? parseFloat(stopLoss) : null,
                take_profit: takeProfit ? parseFloat(takeProfit) : null,
                strategy,
                reason: reason || `${side.toUpperCase()} ${symbol}`,
              })
            }}
            disabled={!price || !notional}
            className="flex-1 py-2.5 text-sm bg-army-600 hover:bg-army-500 text-white font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            确认下单
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Close Position Modal ---
function CloseModal({
  position,
  onConfirm,
  onClose,
}: {
  position: PaperPosition
  onConfirm: (id: string, price: number) => void
  onClose: () => void
}) {
  const [price, setPrice] = useState(String(position.current_price || position.entry_price))

  if (!position) return null

  const closePrice = parseFloat(price) || position.entry_price
  const priceDiff = position.side === 'long' ? closePrice - position.entry_price : position.entry_price - closePrice
  const estimatedPnl = priceDiff * position.size

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-dark-800">
          <h2 className="text-xl font-bold text-dark-100">平仓确认</h2>
          <p className="text-dark-500 text-sm mt-1">{position.symbol} · {position.side === 'long' ? '做多' : '做空'} · {position.size.toFixed(6)}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-dark-500 text-xs">开仓价</p>
              <p className="text-dark-200 font-medium">{formatCurrency(position.entry_price)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">预估盈亏</p>
              <p className={cn('font-bold', pnlColor(estimatedPnl))}>{formatCurrency(estimatedPnl)}</p>
            </div>
          </div>
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">平仓价格</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-dark-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-dark-700 text-dark-400 rounded-lg">取消</button>
          <button
            onClick={() => onConfirm(position.id, parseFloat(price))}
            className="flex-1 py-2.5 text-sm bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
          >
            确认平仓
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Adjust Position Modal ---
function AdjustModal({
  position,
  onConfirm,
  onClose,
}: {
  position: PaperPosition
  onConfirm: (id: string, updates: { stop_loss?: number | null; take_profit?: number | null }) => void
  onClose: () => void
}) {
  const [sl, setSl] = useState(position.stop_loss ? String(position.stop_loss) : '')
  const [tp, setTp] = useState(position.take_profit ? String(position.take_profit) : '')

  if (!position) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-2xl border border-dark-700 w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-dark-800">
          <h2 className="text-xl font-bold text-dark-100">调仓 — {position.symbol}</h2>
          <p className="text-dark-500 text-sm mt-1">修改止损 / 止盈价位</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-dark-500 text-xs">开仓价</p>
              <p className="text-dark-200 font-medium">{formatCurrency(position.entry_price)}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">当前盈亏</p>
              <p className={cn('font-bold', pnlColor(position.unrealized_pnl))}>{formatCurrency(position.unrealized_pnl)}</p>
            </div>
          </div>
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">止损价</label>
            <input
              type="number"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              placeholder="留空则不设止损"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-dark-400 text-sm mb-1.5 block">止盈价</label>
            <input
              type="number"
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              placeholder="留空则不设止盈"
              className="w-full bg-dark-800 text-dark-200 rounded-lg px-4 py-3 text-sm border border-dark-700 focus:border-army-600 focus:outline-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-dark-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-dark-700 text-dark-400 rounded-lg">取消</button>
          <button
            onClick={() => onConfirm(position.id, {
              stop_loss: sl ? parseFloat(sl) : null,
              take_profit: tp ? parseFloat(tp) : null,
            })}
            className="flex-1 py-2.5 text-sm bg-army-600 hover:bg-army-500 text-white font-medium rounded-lg transition-colors"
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Metric Card ---
function MetricCard({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
      <p className="text-dark-500 text-xs mb-1">{label}</p>
      <p className={cn('text-xl font-bold text-dark-100', className)}>{value}</p>
      {sub && <p className={cn('text-xs mt-0.5', className || 'text-dark-400')}>{sub}</p>}
    </div>
  )
}
