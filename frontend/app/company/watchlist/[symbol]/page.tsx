'use client'

import Link from 'next/link'
import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/hooks'
import { ROLES } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'
import { TradingViewChart } from '@/components/Market/TradingViewChart'
import { openPosition } from '@/lib/paper-trading'
import { detectMarket } from '@/lib/market-adapter'
import { runFullAnalysis } from '@/lib/analysis'
import type { FullAnalysis } from '@/lib/analysis'

export default function SymbolDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params)
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase()
  const { companyId } = useCompanyContext()
  const { items, loading, refresh } = useWatchlist(companyId)
  const router = useRouter()
  const [toggling, setToggling] = useState(false)
  const [showQuickOrder, setShowQuickOrder] = useState(false)
  const [orderNotional, setOrderNotional] = useState('')
  const [orderSide, setOrderSide] = useState<'long' | 'short'>('long')
  const [orderMsg, setOrderMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Real analysis state
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const item = items.find((x: any) => x.symbol === decodedSymbol)
  const isWatchlisted = !!item
  const market = detectMarket(decodedSymbol)

  // Run analysis on mount and when symbol changes
  const runAnalysis = useCallback(async () => {
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const result = await runFullAnalysis(decodedSymbol)
      setAnalysis(result)
    } catch (e: any) {
      setAnalysisError(e.message || '分析失败')
    } finally {
      setAnalyzing(false)
    }
  }, [decodedSymbol])

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  const toggleWatchlist = async () => {
    if (!companyId || toggling) return
    setToggling(true)
    try {
      if (isWatchlisted) {
        await removeFromWatchlist(companyId, item.id)
      } else {
        await addToWatchlist(companyId, decodedSymbol, decodedSymbol, market)
      }
      await refresh()
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-dark-500">加载标的详情中...</div>
  }

  const price = analysis?.collector?.quote_volume_24h ? analysis.strategist : null
  const quote = analysis ? {
    price: analysis.risk_officer?.stop_loss_price ? (analysis.risk_officer.stop_loss_price / (1 - 2.5 * analysis.risk_officer.atr_pct / 100)) : 0,
    change_pct_24h: 0,
  } : null

  const roleOrder = ['collector', 'researcher', 'strategist', 'analyst', 'risk_officer', 'executor', 'cto', 'ceo'] as const

  // Signal color helpers
  const signalColor = (signal: string) => {
    if (signal === 'LONG' || signal === '看多') return 'text-army-400'
    if (signal === 'SHORT' || signal === '看空') return 'text-red-400'
    return 'text-yellow-400'
  }

  const verdictEmoji = (verdict: string) => {
    if (verdict === 'LONG') return '🟢'
    if (verdict === 'SHORT') return '🔴'
    if (verdict === 'WAIT') return '🟡'
    return '⚪'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/company/watchlist" className="text-army-400 hover:text-army-300 text-sm">← 返回自选标的</Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-dark-100">{decodedSymbol}</h1>
            <button
              onClick={toggleWatchlist}
              disabled={toggling}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                isWatchlisted ? 'text-yellow-400 hover:text-yellow-500' : 'text-dark-600 hover:text-yellow-400'
              )}
              title={isWatchlisted ? '取消自选' : '添加自选'}
            >
              <svg className="w-6 h-6" fill={isWatchlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isWatchlisted ? 0 : 1.5} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            <span className={cn('px-2 py-0.5 rounded-full text-xs',
              market === 'crypto' ? 'bg-orange-900/30 text-orange-400' :
              market === 'hk_stock' ? 'bg-blue-900/30 text-blue-400' :
              'bg-red-900/30 text-red-400'
            )}>
              {market === 'crypto' ? '₿ 加密货币' : market === 'hk_stock' ? '🇭🇰 港股' : '🇨🇳 A股'}
            </span>
          </div>
          <p className="text-dark-400 mt-2 max-w-3xl">
            8 个 AI 角色基于真实市场数据独立分析，CEO 汇总不覆盖。
          </p>
        </div>
        <div className="text-right">
          {analysis ? (
            <div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-2xl">{verdictEmoji(analysis.ceo.verdict)}</span>
                <span className={cn('text-2xl font-bold', signalColor(analysis.ceo.verdict))}>{analysis.ceo.verdict}</span>
              </div>
              <p className="text-dark-400 text-sm mt-1">
                共识 {analysis.ceo.bullish_count}多 / {analysis.ceo.bearish_count}空 / {analysis.ceo.neutral_count}中
              </p>
            </div>
          ) : analyzing ? (
            <div className="text-dark-500 text-sm">⏳ 分析中...</div>
          ) : null}
        </div>
      </div>

      {/* Quick Order Bar */}
      {analysis && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-dark-400">策略师: <span className={signalColor(analysis.strategist.signal)}>{analysis.strategist.signal}</span></span>
              <span className="text-dark-400">风险: <span className="text-dark-200">{analysis.risk_officer.risk_score}/10</span></span>
              <span className="text-dark-400">ATR: <span className="text-dark-200">{analysis.risk_officer.atr_pct.toFixed(2)}%</span></span>
              <span className="text-dark-400">ADX: <span className="text-dark-200">{analysis.strategist.adx.toFixed(1)}</span></span>
              <span className="text-dark-400">RSI: <span className="text-dark-200">{analysis.strategist.rsi.toFixed(0)}</span></span>
            </div>
            <div className="flex items-center gap-2">
              {!showQuickOrder ? (
                <button
                  onClick={() => setShowQuickOrder(true)}
                  className="px-4 py-2 bg-army-600 hover:bg-army-500 text-white text-sm font-medium rounded-lg transition-colors"
                >📝 一键下单</button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <button onClick={() => setOrderSide('long')} className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', orderSide === 'long' ? 'bg-army-900/40 border-army-700 text-army-400' : 'border-dark-700 text-dark-400')}>做多</button>
                    <button onClick={() => setOrderSide('short')} className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', orderSide === 'short' ? 'bg-red-900/40 border-red-700 text-red-400' : 'border-dark-700 text-dark-400')}>做空</button>
                  </div>
                  {[1000, 5000, 10000].map(amt => (
                    <button key={amt} onClick={() => setOrderNotional(String(amt))} className={cn('px-2.5 py-1.5 text-xs rounded-lg border transition-colors', orderNotional === String(amt) ? 'border-army-600 text-army-400' : 'border-dark-700 text-dark-400 hover:border-dark-600')}>${amt.toLocaleString()}</button>
                  ))}
                  <input type="number" value={orderNotional} onChange={(e) => setOrderNotional(e.target.value)} placeholder="金额" className="w-24 bg-dark-800 text-dark-200 rounded-lg px-3 py-1.5 text-xs border border-dark-700 focus:border-army-600 focus:outline-none" />
                  <button
                    onClick={() => {
                      if (!orderNotional) return
                      try {
                        openPosition({ symbol: decodedSymbol, side: orderSide, notional: parseFloat(orderNotional), price: 0, strategy: 'team-signal', reason: `8角色分析 ${analysis.ceo.verdict} | ${decodedSymbol}` })
                        setOrderMsg({ type: 'success', text: `✅ ${orderSide === 'long' ? '做多' : '做空'} ${decodedSymbol} $${orderNotional}` })
                        setOrderNotional('')
                        setTimeout(() => setOrderMsg(null), 3000)
                      } catch (e: any) {
                        setOrderMsg({ type: 'error', text: e.message })
                        setTimeout(() => setOrderMsg(null), 3000)
                      }
                    }}
                    disabled={!orderNotional}
                    className="px-4 py-1.5 bg-army-600 hover:bg-army-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                  >确认</button>
                  <button onClick={() => { setShowQuickOrder(false); setOrderNotional('') }} className="text-dark-500 hover:text-dark-300 text-sm px-1">✕</button>
                </div>
              )}
            </div>
          </div>
          {orderMsg && <p className={cn('text-xs mt-2', orderMsg.type === 'success' ? 'text-army-400' : 'text-red-400')}>{orderMsg.text}</p>}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Chart */}
        <div className="col-span-12 xl:col-span-8">
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-800">
              <h2 className="text-lg font-semibold text-dark-100">实时行情 / K线</h2>
              <p className="text-dark-500 text-sm">TradingView 免费实时图表</p>
            </div>
            <div className="h-[560px]">
              <TradingViewChart symbol={decodedSymbol} interval="60" />
            </div>
          </div>
        </div>

        {/* CEO Summary + Analysis Status */}
        <div className="col-span-12 xl:col-span-4 space-y-4">
          {analyzing && !analysis && (
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-8 text-center">
              <div className="animate-pulse">
                <p className="text-4xl mb-3">🧠</p>
                <p className="text-dark-200 font-medium">8 角色分析中...</p>
                <p className="text-dark-500 text-sm mt-2">获取市场数据 → 计算技术指标 → 生成分析报告</p>
              </div>
            </div>
          )}

          {analysisError && (
            <div className="bg-dark-900 rounded-xl border border-red-900/40 p-5">
              <p className="text-red-400 text-sm">❌ {analysisError}</p>
              <button onClick={runAnalysis} className="mt-2 text-sm text-army-400 hover:text-army-300">🔄 重试</button>
            </div>
          )}

          {analysis && (
            <>
              {/* CEO Decision Card */}
              <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">👔</span>
                  <h3 className="text-lg font-semibold text-dark-100">CEO 决策</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-500">判定</span>
                    <span className={cn('font-bold text-lg', signalColor(analysis.ceo.verdict))}>
                      {verdictEmoji(analysis.ceo.verdict)} {analysis.ceo.verdict}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-500">共识</span>
                    <div className="flex gap-2">
                      <span className="text-army-400">{analysis.ceo.bullish_count}多</span>
                      <span className="text-red-400">{analysis.ceo.bearish_count}空</span>
                      <span className="text-dark-400">{analysis.ceo.neutral_count}中</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-dark-500 text-xs">行动方案</span>
                    <p className="text-dark-200 mt-1">{analysis.ceo.action_plan}</p>
                  </div>
                  {analysis.ceo.invalidation && (
                    <div>
                      <span className="text-dark-500 text-xs">失效条件</span>
                      <p className="text-dark-300 mt-1">{analysis.ceo.invalidation}</p>
                    </div>
                  )}
                  {analysis.ceo.key_debates.length > 0 && (
                    <div>
                      <span className="text-dark-500 text-xs">团队分歧</span>
                      {analysis.ceo.key_debates.map((d, i) => (
                        <p key={i} className="text-yellow-400/80 text-xs mt-1">⚡ {d}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
                <h3 className="text-sm font-semibold text-dark-400 mb-3">关键指标</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetricBox label="PSAR" value={analysis.strategist.psar_direction === 'bull' ? '🟢 多头' : '🔴 空头'} />
                  <MetricBox label="EMA趋势" value={analysis.strategist.ema_trend === 'bullish' ? '🟢 多头排列' : analysis.strategist.ema_trend === 'bearish' ? '🔴 空头排列' : '⚪ 中性'} />
                  <MetricBox label="ADX" value={`${analysis.strategist.adx.toFixed(1)} ${analysis.strategist.adx >= 25 ? '强趋势' : analysis.strategist.adx >= 20 ? '中等' : '弱'}`} />
                  <MetricBox label="RSI" value={`${analysis.strategist.rsi.toFixed(0)} ${analysis.strategist.rsi > 70 ? '超买⚠️' : analysis.strategist.rsi < 30 ? '超卖⚠️' : '中性'}`} />
                  <MetricBox label="风险评分" value={`${analysis.risk_officer.risk_score}/10`} />
                  <MetricBox label="建议仓位" value={`≤${analysis.risk_officer.suggested_position_pct}%`} />
                  {analysis.risk_officer.stop_loss_price && <MetricBox label="止损价" value={`$${analysis.risk_officer.stop_loss_price.toFixed(2)}`} />}
                  {analysis.risk_officer.take_profit_price && <MetricBox label="止盈价" value={`$${analysis.risk_officer.take_profit_price.toFixed(2)}`} />}
                </div>
              </div>

              {/* Refresh button */}
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {analyzing ? '⏳ 分析中...' : '🔄 刷新分析'}
              </button>
            </>
          )}

          {!analysis && !analyzing && !analysisError && (
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-8 text-center">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-dark-200 font-medium mb-2">查看 AI 分析</p>
              <p className="text-dark-500 text-sm mb-4">8 角色将基于真实K线数据分析 {decodedSymbol}</p>
              <button onClick={runAnalysis} className="px-6 py-2.5 bg-army-600 hover:bg-army-500 text-white text-sm rounded-lg transition-colors">
                🧠 开始分析
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 8 Role Cards */}
      {analysis && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-dark-100">8 角色独立分析</h2>
              <p className="text-dark-500 text-sm mt-1">基于 {market === 'crypto' ? 'Binance' : '新浪财经'} 真实数据计算</p>
            </div>
            <span className="text-dark-500 text-xs">更新于 {new Date(analysis.at).toLocaleTimeString('zh-CN')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleOrder.map((roleType) => {
              const role = ROLES.find((r) => r.type === roleType as any)
              if (!role) return null
              const data = roleType === 'risk_officer' ? analysis.risk_officer : (analysis as any)[roleType]
              if (!data) return null

              return (
                <div key={roleType} className="bg-dark-900 rounded-xl border border-dark-800 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${role.color}20` }}>
                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-dark-100">{role.label}</p>
                      <p className="text-xs text-dark-500">{role.description}</p>
                    </div>
                    {/* Signal badge for strategist/ceo */}
                    {'signal' in data && (
                      <span className={cn('px-2 py-0.5 rounded text-xs font-bold', signalColor(data.signal))}>
                        {data.signal}
                      </span>
                    )}
                    {'verdict' in data && (
                      <span className={cn('px-2 py-0.5 rounded text-xs font-bold', signalColor(data.verdict))}>
                        {data.verdict}
                      </span>
                    )}
                  </div>

                  {/* Summary line */}
                  <p className="text-dark-300 text-sm mb-3">{data.summary}</p>

                  {/* Role-specific details */}
                  <RoleDetails roleType={roleType} data={data} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dark-850 rounded-lg p-2.5">
      <p className="text-dark-500 text-xs">{label}</p>
      <p className="text-dark-200 text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}

function RoleDetails({ roleType, data }: { roleType: string; data: any }) {
  switch (roleType) {
    case 'collector':
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="24h成交量" value={`$${(data.quote_volume_24h / 1e6).toFixed(1)}M`} />
          <Stat label="振幅" value={`${data.price_range_pct?.toFixed(1)}%`} />
          {data.bid_ask_ratio != null && <Stat label="买卖比" value={data.bid_ask_ratio.toFixed(2)} />}
          {data.buy_volume_pct != null && <Stat label="主买占比" value={`${data.buy_volume_pct.toFixed(0)}%`} />}
          {data.large_trades != null && data.large_trades > 0 && <Stat label="大单" value={`${data.large_trades}笔`} />}
        </div>
      )
    case 'strategist':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Stat label="PSAR" value={data.psar_direction === 'bull' ? '🟢多' : '🔴空'} />
            <Stat label="ADX" value={data.adx.toFixed(1)} />
            <Stat label="RSI" value={data.rsi.toFixed(0)} />
          </div>
          {data.reasons?.length > 0 && (
            <div className="space-y-0.5">
              {data.reasons.slice(0, 4).map((r: string, i: number) => (
                <p key={i} className="text-dark-500 text-xs">• {r}</p>
              ))}
            </div>
          )}
        </div>
      )
    case 'risk_officer':
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="风险评分" value={`${data.risk_score}/10`} />
          <Stat label="ATR%" value={`${data.atr_pct.toFixed(2)}%`} />
          <Stat label="波动率位" value={`${data.volatility_percentile.toFixed(0)}%`} />
          <Stat label="建议仓位" value={`≤${data.suggested_position_pct}%`} />
          {data.stop_loss_price && <Stat label="止损" value={`$${data.stop_loss_price.toFixed(2)}`} />}
          {data.take_profit_price && <Stat label="止盈" value={`$${data.take_profit_price.toFixed(2)}`} />}
        </div>
      )
    case 'analyst':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="趋势" value={{ strong_up: '强势上行', up: '偏多', neutral: '中性', down: '偏空', strong_down: '强势下行' }[data.trend as string] || data.trend} />
            <Stat label="量能" value={{ increasing: '放量', decreasing: '缩量', stable: '平稳' }[data.volume_trend as string] || data.volume_trend} />
            <Stat label="支撑" value={`$${data.support?.toFixed(2)}`} />
            <Stat label="阻力" value={`$${data.resistance?.toFixed(2)}`} />
          </div>
          {data.patterns?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.patterns.map((p: string, i: number) => (
                <span key={i} className="px-1.5 py-0.5 bg-dark-800 rounded text-xs text-dark-400">{p}</span>
              ))}
            </div>
          )}
          <p className="text-dark-500 text-xs">多周期: {data.multi_tf_consensus}</p>
        </div>
      )
    case 'researcher':
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="波动率位" value={`${data.volatility_percentile.toFixed(0)}%`} />
          <Stat label="日均收益" value={`${(data.avg_daily_return * 100).toFixed(3)}%`} />
          <Stat label="日波动" value={`${(data.return_std * 100).toFixed(2)}%`} />
          {data.beta_to_btc != null && <Stat label="BTC β" value={data.beta_to_btc.toFixed(2)} />}
          {data.best_day_of_week && <Stat label="最佳日" value={data.best_day_of_week} />}
          {data.similar_pattern_outcome && <Stat label="形态匹配" value={data.similar_pattern_outcome} />}
        </div>
      )
    case 'executor':
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="流动性" value={`${data.liquidity_score}/10`} />
          {data.spread_bps != null && <Stat label="价差" value={`${data.spread_bps.toFixed(1)} bps`} />}
          {data.slippage_1k != null && <Stat label="$1K滑点" value={`${data.slippage_1k.toFixed(1)} bps`} />}
          {data.slippage_10k != null && <Stat label="$10K滑点" value={`${data.slippage_10k.toFixed(1)} bps`} />}
          <div className="col-span-2"><Stat label="策略" value={data.execution_strategy} /></div>
        </div>
      )
    case 'cto':
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="完整度" value={`${(data.completeness * 100).toFixed(0)}%`} />
          <Stat label="异常" value={data.anomalies.length === 0 ? '✅ 无' : `⚠️ ${data.anomalies.length}个`} />
          {data.anomalies.map((a: string, i: number) => (
            <p key={i} className="col-span-2 text-yellow-400/70 text-xs">⚠️ {a}</p>
          ))}
        </div>
      )
    case 'ceo':
      return null // Already shown in CEO Decision Card
    default:
      return null
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-dark-500">{label}: </span>
      <span className="text-dark-300">{value}</span>
    </div>
  )
}
