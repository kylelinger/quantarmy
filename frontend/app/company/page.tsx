'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist } from '@/lib/hooks'
import { EquityCurve } from '@/components/Market/EquityCurve'
import { formatCurrency, formatPercent, pnlColor, cn } from '@/lib/utils'
import { MetricCard } from '@/components/Trading/MetricCard'
import { PositionsPanel } from '@/components/Trading/PositionsPanel'
import { HistoryPanel } from '@/components/Trading/HistoryPanel'
import { TeamPanel } from '@/components/Trading/TeamPanel'
import { OrderModal } from '@/components/Trading/OrderModal'
import { CloseModal } from '@/components/Trading/CloseModal'
import { AdjustModal } from '@/components/Trading/AdjustModal'
import { useToast } from '@/components/Trading/Toast'
import {
  getPortfolio,
  getPortfolioSummary,
  openPosition,
  closePosition,
  adjustPosition,
  resetAccount,
  type PaperPosition,
  type PaperTrade,
  type EquityPoint,
} from '@/lib/paper-trading'

export default function CompanyOverviewPage() {
  const { companyId, roles } = useCompanyContext()
  const { items: watchlistItems } = useWatchlist(companyId)
  const { toast } = useToast()

  // Paper trading state
  const [positions, setPositions] = useState<PaperPosition[]>([])
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [equityData, setEquityData] = useState<EquityPoint[]>([])
  const [summary, setSummary] = useState(getPortfolioSummary())
  const [mounted, setMounted] = useState(false)

  // Modal state
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState<string | null>(null)
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null)

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
                toast('info', '模拟盘已重置，初始资金 $100,000')
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

      {/* Tabs */}
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

      {/* Modals */}
      {showOrderModal && (
        <OrderModal
          watchlistItems={watchlistItems}
          cash={summary.cash}
          onSubmit={(params) => {
            try {
              openPosition(params)
              refreshState()
              setShowOrderModal(false)
              toast('success', `${params.side === 'long' ? '做多' : '做空'} ${params.symbol} $${params.notional.toLocaleString()} @ ${formatCurrency(params.price)}`)
            } catch (e: any) {
              toast('error', e.message)
            }
          }}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {showCloseModal && (
        <CloseModal
          position={positions.find(p => p.id === showCloseModal)!}
          onConfirm={(id, price) => {
            try {
              const trade = closePosition(id, price)
              refreshState()
              setShowCloseModal(null)
              toast('success', `平仓完成 | P&L ${formatCurrency(trade.pnl)}`)
            } catch (e: any) {
              toast('error', e.message)
            }
          }}
          onClose={() => setShowCloseModal(null)}
        />
      )}

      {showAdjustModal && (
        <AdjustModal
          position={positions.find(p => p.id === showAdjustModal)!}
          onConfirm={(id, updates) => {
            try {
              adjustPosition(id, updates)
              refreshState()
              setShowAdjustModal(null)
              toast('success', '止损/止盈已更新')
            } catch (e: any) {
              toast('error', e.message)
            }
          }}
          onClose={() => setShowAdjustModal(null)}
        />
      )}
    </div>
  )
}
