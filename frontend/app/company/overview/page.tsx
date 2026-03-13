'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist } from '@/lib/hooks'
import { ROLES } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'
import { getPortfolio, getPortfolioSummary } from '@/lib/paper-trading'
import { listCachedResults, getV2Result, type V2CachedSummary } from '@/lib/v2/cache'

export default function OverviewPage() {
  const { companyId, company, roles } = useCompanyContext()
  const { items } = useWatchlist(companyId)
  const account = getPortfolio()
  const summary = getPortfolioSummary()
  const [mounted, setMounted] = useState(false)
  const [cachedResults, setCachedResults] = useState<V2CachedSummary[]>([])

  useEffect(() => {
    setMounted(true)
    setCachedResults(listCachedResults())
  }, [])

  const totalEquity = summary.equity
  const totalPnl = summary.pnl
  const pnlPct = summary.pnl_pct
  const openPositions = summary.position_count
  const totalTrades = summary.trade_count
  const winRate = summary.win_rate

  const activeRoles = roles.filter(r => r.status === 'active').length
  const watchlistCount = items.length

  // Categorize watchlist
  const cryptoCount = items.filter((i: any) => i.symbol.endsWith('USDT') || i.symbol.endsWith('BTC')).length
  const hkCount = items.filter((i: any) => i.symbol.endsWith('.HK')).length
  const aCount = items.filter((i: any) => i.symbol.endsWith('.SS') || i.symbol.endsWith('.SZ')).length

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-100">量化军团总览</h1>
        <p className="text-dark-400 mt-2">QuantArmy v2.0 — 8 角色辩论引擎，多视角量化分析</p>
      </div>

      {/* Status Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          icon="🤖"
          label="团队状态"
          value={`${activeRoles}/8 在线`}
          sub={activeRoles === 8 ? '全员就绪' : `${8 - activeRoles} 个角色待激活`}
          color="army"
        />
        <StatusCard
          icon="📋"
          label="自选标的"
          value={`${watchlistCount} 只`}
          sub={[
            cryptoCount > 0 ? `${cryptoCount}加密` : '',
            hkCount > 0 ? `${hkCount}港股` : '',
            aCount > 0 ? `${aCount}A股` : '',
          ].filter(Boolean).join(' · ') || '未添加标的'}
          color="blue"
        />
        <StatusCard
          icon="💰"
          label="模拟盘权益"
          value={formatCurrency(totalEquity)}
          sub={`${totalPnl >= 0 ? '+' : ''}${formatCurrency(totalPnl)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`}
          color={totalPnl >= 0 ? 'army' : 'red'}
        />
        <StatusCard
          icon="📈"
          label="交易统计"
          value={`${totalTrades} 笔`}
          sub={totalTrades > 0 ? `胜率 ${winRate.toFixed(0)}% · ${openPositions} 持仓中` : '暂无交易记录'}
          color="purple"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Team Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* 8 Role Grid */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-100">🤖 AI 团队</h2>
              <span className="text-dark-500 text-sm">{activeRoles}/8 角色在线</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROLES.map(role => {
                const rs = roles.find(r => r.role_type === role.type)
                const isActive = rs?.status === 'active'
                return (
                  <Link
                    key={role.type}
                    href={`/company/${role.type}`}
                    className="group bg-dark-850 hover:bg-dark-800 rounded-xl p-4 transition-all border border-dark-800 hover:border-dark-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{role.icon}</span>
                      <span className={cn('w-2 h-2 rounded-full', isActive ? 'bg-army-400' : 'bg-dark-600')} />
                    </div>
                    <p className="font-medium text-dark-200 text-sm group-hover:text-dark-100">{role.label}</p>
                    <p className="text-dark-500 text-xs mt-1 line-clamp-1">{role.description}</p>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Watchlist Quick View */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-100">📋 自选标的</h2>
              <Link href="/company/watchlist" className="text-army-400 hover:text-army-300 text-sm">管理 →</Link>
            </div>
            {watchlistCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-dark-400">还没有自选标的</p>
                <Link href="/company/watchlist" className="inline-block mt-3 px-4 py-2 bg-army-600 hover:bg-army-500 text-white text-sm rounded-lg transition-colors">
                  去添加标的
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {items.slice(0, 9).map((item: any) => {
                  const isCrypto = item.symbol.endsWith('USDT') || item.symbol.endsWith('BTC')
                  const isHK = item.symbol.endsWith('.HK')
                  return (
                    <Link
                      key={item.symbol}
                      href={`/company/watchlist/${item.symbol}`}
                      className="bg-dark-850 hover:bg-dark-800 rounded-lg p-3 transition-colors border border-dark-800 hover:border-dark-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-dark-200 text-sm">{item.symbol}</span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded',
                          isCrypto ? 'bg-orange-900/30 text-orange-400' :
                          isHK ? 'bg-blue-900/30 text-blue-400' :
                          'bg-red-900/30 text-red-400'
                        )}>
                          {isCrypto ? '₿' : isHK ? '🇭🇰' : '🇨🇳'}
                        </span>
                      </div>
                      <p className="text-dark-500 text-xs mt-1 truncate">{item.display_name}</p>
                    </Link>
                  )
                })}
                {watchlistCount > 9 && (
                  <Link href="/company/watchlist" className="bg-dark-850 hover:bg-dark-800 rounded-lg p-3 flex items-center justify-center border border-dark-800 hover:border-dark-700">
                    <span className="text-dark-400 text-sm">+{watchlistCount - 9} 更多 →</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* V2 Team Verdicts */}
          {mounted && (
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-100">📊 团队观点</h2>
                <span className="text-dark-500 text-xs">
                  {cachedResults.length > 0 ? `${cachedResults.length} 只已分析` : '暂无分析'}
                </span>
              </div>
              {cachedResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🧠</p>
                  <p className="text-dark-400">还没有 V2 分析结果</p>
                  <p className="text-dark-500 text-sm mt-1">进入标的详情页运行分析后，结果会显示在这里</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cachedResults.map(c => (
                    <VerdictRow key={c.symbol} cached={c} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick Actions + Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h2 className="text-lg font-semibold text-dark-100 mb-4">⚡ 快速入口</h2>
            <div className="space-y-2">
              <QuickAction href="/company" icon="📊" label="仪表盘" desc="模拟盘交易 · 权益追踪" />
              <QuickAction href="/company/watchlist" icon="📋" label="自选标的" desc="添加标的 · 团队分析" />
              <QuickAction href="/company/strategist" icon="📈" label="策略师" desc="PSAR趋势 · 技术信号" />
              <QuickAction href="/company/risk_officer" icon="🛡" label="风控官" desc="风险评估 · 仓位建议" />
            </div>
          </div>

          {/* Paper Account Summary */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-100">💰 模拟盘</h2>
              <Link href="/company" className="text-army-400 hover:text-army-300 text-sm">详情 →</Link>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-500">总权益</span>
                <span className="text-dark-200 font-medium">{formatCurrency(totalEquity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">可用资金</span>
                <span className="text-dark-200">{formatCurrency(summary.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">总盈亏</span>
                <span className={cn('font-medium', totalPnl >= 0 ? 'text-army-400' : 'text-red-400')}>
                  {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">持仓数</span>
                <span className="text-dark-200">{openPositions}</span>
              </div>
              {totalTrades > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-500">胜率</span>
                  <span className="text-dark-200">{winRate.toFixed(0)}% ({summary.win_count}/{totalTrades})</span>
                </div>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
            <h2 className="text-lg font-semibold text-dark-100 mb-4">ℹ️ 系统信息</h2>
            <div className="space-y-2 text-sm">
              <InfoRow label="版本" value="v2.0.0" />
              <InfoRow label="数据源" value="Binance · 新浪财经" />
              <InfoRow label="市场" value="加密 · 港股 · A股" />
              <InfoRow label="分析模式" value="辩论引擎" />
              <InfoRow label="交易" value="纯模拟 · 非实盘" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub: string; color: string
}) {
  const borderColor = color === 'army' ? 'border-army-800/30' : color === 'red' ? 'border-red-800/30' : color === 'blue' ? 'border-blue-800/30' : 'border-purple-800/30'
  return (
    <div className={cn('bg-dark-900 rounded-xl border p-5', borderColor)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-dark-500 text-sm">{label}</span>
      </div>
      <p className="text-xl font-bold text-dark-100">{value}</p>
      <p className="text-dark-400 text-xs mt-1">{sub}</p>
    </div>
  )
}

function QuickAction({ href, icon, label, desc }: { href: string; icon: string; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-lg bg-dark-850 hover:bg-dark-800 transition-colors border border-dark-800 hover:border-dark-700">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-dark-200 text-sm font-medium">{label}</p>
        <p className="text-dark-500 text-xs">{desc}</p>
      </div>
    </Link>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-dark-500">{label}</span>
      <span className="text-dark-300">{value}</span>
    </div>
  )
}

function VerdictRow({ cached }: { cached: V2CachedSummary }) {
  const verdictColors: Record<string, string> = {
    LONG: 'bg-army-900/30 text-army-400 border-army-800/30',
    SHORT: 'bg-red-900/30 text-red-400 border-red-800/30',
    HOLD: 'bg-dark-800 text-dark-400 border-dark-700',
    WAIT: 'bg-dark-800 text-dark-500 border-dark-700',
  }
  const verdictLabels: Record<string, string> = {
    LONG: '🟢 做多',
    SHORT: '🔴 做空',
    HOLD: '⚪ 观望',
    WAIT: '⏸️ 等待',
  }

  const age = Date.now() - new Date(cached.at).getTime()
  const ageMin = Math.floor(age / 60000)
  const ageStr = ageMin < 60 ? `${ageMin}分钟前` : ageMin < 1440 ? `${Math.floor(ageMin / 60)}小时前` : `${Math.floor(ageMin / 1440)}天前`
  const confidencePct = (cached.confidence * 100).toFixed(0)

  return (
    <Link
      href={`/company/watchlist/${encodeURIComponent(cached.symbol)}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-dark-850 hover:bg-dark-800 transition-colors border border-dark-800 hover:border-dark-700"
    >
      {/* Symbol */}
      <div className="flex-1 min-w-0">
        <span className="font-bold text-dark-100 text-sm">{cached.symbol}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-dark-500 text-xs">{ageStr}</span>
          <span className="text-dark-600 text-xs">·</span>
          <span className="text-dark-500 text-xs">{cached.bullishCount}多 {cached.bearishCount}空 {cached.neutralCount}中</span>
        </div>
      </div>

      {/* Confidence */}
      <div className="text-right mr-2">
        <span className="text-dark-300 text-xs">信心</span>
        <p className="text-dark-200 text-sm font-medium">{confidencePct}%</p>
      </div>

      {/* Verdict badge */}
      <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border', verdictColors[cached.verdict] || verdictColors.HOLD)}>
        {verdictLabels[cached.verdict] || cached.verdict}
      </span>
    </Link>
  )
}
