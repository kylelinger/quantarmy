'use client'

import Link from 'next/link'
import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCompanyContext } from '@/lib/CompanyContext'
import { useWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/hooks'
import { ROLES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TradingViewChart } from '@/components/Market/TradingViewChart'
import { openPosition } from '@/lib/paper-trading'
import { detectMarket } from '@/lib/market-adapter'
import { runV2Analysis, type ProgressCallback } from '@/lib/v2/orchestrator'
import type { V2AnalysisResult, AgentOutput, CEODecision, DebateTranscript, AnalysisPhase, RoleType } from '@/lib/v2/types'

const PHASE_LABELS: Record<AnalysisPhase, string> = {
  collecting: '📡 采集市场数据...',
  analyzing: '🧠 8角色独立分析...',
  debating: '⚔️ 角色辩论中...',
  deciding: '👔 CEO决策中...',
  storing: '💾 存储记忆...',
  complete: '✅ 分析完成',
}

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
  const [showDebate, setShowDebate] = useState(false)

  // V2 analysis state
  const [result, setResult] = useState<V2AnalysisResult | null>(null)
  const [phase, setPhase] = useState<AnalysisPhase | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const item = items.find((x: any) => x.symbol === decodedSymbol)
  const isWatchlisted = !!item
  const market = detectMarket(decodedSymbol)

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true)
    setAnalysisError(null)
    setPhase('collecting')
    try {
      const onProgress: ProgressCallback = (p, partial) => {
        setPhase(p)
        if (partial && p === 'complete') {
          setResult(partial as V2AnalysisResult)
        }
      }
      const r = await runV2Analysis(decodedSymbol, onProgress)
      setResult(r)
    } catch (e: any) {
      setAnalysisError(e.message || '分析失败')
    } finally {
      setAnalyzing(false)
      setPhase(null)
    }
  }, [decodedSymbol])

  useEffect(() => { runAnalysis() }, [runAnalysis])

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
    return <div className="py-16 text-center text-dark-500">加载中...</div>
  }

  const decision = result?.decision
  const agents = result?.agentOutputs
  const debate = result?.debate

  const roleOrder: RoleType[] = ['collector', 'strategist', 'risk_officer', 'analyst', 'researcher', 'executor', 'cto', 'ceo']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/company/watchlist" className="text-army-400 hover:text-army-300 text-sm">← 返回自选标的</Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-dark-100">{decodedSymbol}</h1>
            <button
              onClick={toggleWatchlist}
              disabled={toggling}
              className={cn('p-1.5 rounded-lg transition-all', isWatchlisted ? 'text-yellow-400 hover:text-yellow-500' : 'text-dark-600 hover:text-yellow-400')}
              title={isWatchlisted ? '取消自选' : '添加自选'}
            >
              <svg className="w-6 h-6" fill={isWatchlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isWatchlisted ? 0 : 1.5} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            <MarketBadge market={market} />
          </div>
          <p className="text-dark-400 mt-2 max-w-3xl">
            V2 引擎: 8角色独立分析 → 辩论挑战 → CEO综合决策
          </p>
        </div>
        <div className="text-right">
          {decision ? (
            <div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-2xl">{verdictEmoji(decision.verdict)}</span>
                <span className={cn('text-2xl font-bold', dirColor(decision.verdict))}>{decision.verdict}</span>
              </div>
              <p className="text-dark-400 text-sm mt-1">
                信心 {(decision.confidence * 100).toFixed(0)}% | 共识 {decision.consensusScore.toFixed(2)}
              </p>
            </div>
          ) : phase ? (
            <div className="text-dark-500 text-sm">{PHASE_LABELS[phase]}</div>
          ) : null}
        </div>
      </div>

      {/* Quick Order Bar */}
      {decision && decision.verdict !== 'WAIT' && decision.verdict !== 'HOLD' && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-dark-400">判定: <span className={dirColor(decision.verdict)}>{decision.verdict}</span></span>
              <span className="text-dark-400">信心: <span className="text-dark-200">{(decision.confidence * 100).toFixed(0)}%</span></span>
              {decision.actionPlan.entry && <span className="text-dark-400">入场: <span className="text-dark-200">${decision.actionPlan.entry.toFixed(2)}</span></span>}
              {decision.actionPlan.stopLoss && <span className="text-dark-400">止损: <span className="text-red-400">${decision.actionPlan.stopLoss.toFixed(2)}</span></span>}
              {decision.actionPlan.takeProfit && <span className="text-dark-400">止盈: <span className="text-army-400">${decision.actionPlan.takeProfit.toFixed(2)}</span></span>}
            </div>
            <div className="flex items-center gap-2">
              {!showQuickOrder ? (
                <button onClick={() => setShowQuickOrder(true)} className="px-4 py-2 bg-army-600 hover:bg-army-500 text-white text-sm font-medium rounded-lg transition-colors">📝 一键下单</button>
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
                        openPosition({ symbol: decodedSymbol, side: orderSide, notional: parseFloat(orderNotional), price: 0, strategy: 'v2-team', reason: `V2 ${decision.verdict} | ${decodedSymbol}` })
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

      {/* Progress Bar */}
      {analyzing && phase && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="animate-pulse text-2xl">🧠</div>
            <div className="flex-1">
              <p className="text-dark-200 font-medium">{PHASE_LABELS[phase]}</p>
              <div className="mt-2 flex gap-1">
                {(['collecting', 'analyzing', 'debating', 'deciding', 'storing'] as AnalysisPhase[]).map(p => {
                  const phases: AnalysisPhase[] = ['collecting', 'analyzing', 'debating', 'deciding', 'storing']
                  const current = phases.indexOf(phase)
                  const idx = phases.indexOf(p)
                  return (
                    <div key={p} className={cn('h-1.5 flex-1 rounded-full transition-colors', idx <= current ? 'bg-army-500' : 'bg-dark-700')} />
                  )
                })}
              </div>
            </div>
          </div>
          {result?.timing && (
            <p className="text-dark-600 text-xs">
              采集 {result.timing.collectMs || 0}ms → 分析 {result.timing.analyzeMs || 0}ms → 辩论 {result.timing.debateMs || 0}ms → 决策 {result.timing.decideMs || 0}ms
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Chart */}
        <div className="col-span-12 xl:col-span-8">
          <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-800">
              <h2 className="text-lg font-semibold text-dark-100">实时行情 / K线</h2>
            </div>
            <div className="h-[560px]">
              <TradingViewChart symbol={decodedSymbol} interval="60" />
            </div>
          </div>
        </div>

        {/* Right Panel: CEO + Debate + Controls */}
        <div className="col-span-12 xl:col-span-4 space-y-4">
          {analysisError && (
            <div className="bg-dark-900 rounded-xl border border-red-900/40 p-5">
              <p className="text-red-400 text-sm">❌ {analysisError}</p>
              <button onClick={runAnalysis} className="mt-2 text-sm text-army-400 hover:text-army-300">🔄 重试</button>
            </div>
          )}

          {decision && (
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
                    <span className={cn('font-bold text-lg', dirColor(decision.verdict))}>
                      {verdictEmoji(decision.verdict)} {decision.verdict}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-500">信心</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', decision.confidence > 0.6 ? 'bg-army-500' : decision.confidence > 0.3 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${decision.confidence * 100}%` }} />
                      </div>
                      <span className="text-dark-300 text-xs">{(decision.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-500">投票</span>
                    <div className="flex gap-2">
                      <span className="text-army-400">{decision.bullishCount}多</span>
                      <span className="text-red-400">{decision.bearishCount}空</span>
                      <span className="text-dark-400">{decision.neutralCount}中</span>
                    </div>
                  </div>
                  {decision.actionPlan.entry && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dark-800">
                      <div><span className="text-dark-600 text-xs">入场</span><p className="text-dark-200 text-sm">${decision.actionPlan.entry.toFixed(2)}</p></div>
                      {decision.actionPlan.stopLoss && <div><span className="text-dark-600 text-xs">止损</span><p className="text-red-400 text-sm">${decision.actionPlan.stopLoss.toFixed(2)}</p></div>}
                      {decision.actionPlan.takeProfit && <div><span className="text-dark-600 text-xs">止盈</span><p className="text-army-400 text-sm">${decision.actionPlan.takeProfit.toFixed(2)}</p></div>}
                    </div>
                  )}
                  {decision.dissent.length > 0 && (
                    <div className="pt-2 border-t border-dark-800">
                      <span className="text-dark-600 text-xs">少数派异议</span>
                      {decision.dissent.map((d, i) => <p key={i} className="text-yellow-400/80 text-xs mt-1">⚡ {d}</p>)}
                    </div>
                  )}
                  {decision.invalidation.length > 0 && (
                    <div className="pt-2 border-t border-dark-800">
                      <span className="text-dark-600 text-xs">失效条件</span>
                      {decision.invalidation.slice(0, 3).map((c, i) => <p key={i} className="text-dark-400 text-xs mt-1">❌ {c}</p>)}
                    </div>
                  )}
                </div>
              </div>

              {/* Debate Summary */}
              {debate && debate.totalChallenges > 0 && (
                <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
                  <button onClick={() => setShowDebate(!showDebate)} className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚔️</span>
                      <h3 className="text-sm font-semibold text-dark-200">辩论记录</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-dark-500 text-xs">{debate.totalChallenges}次挑战 · {debate.totalConcessions}次让步</span>
                      <span className="text-dark-600">{showDebate ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {showDebate && (
                    <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
                      {debate.rounds.map((round) => (
                        <div key={round.round}>
                          <p className="text-dark-600 text-xs font-medium mb-2">── 第{round.round}轮 ──</p>
                          {round.challenges.map((ch, ci) => {
                            const rebuttal = round.rebuttals.find(r => r.challengeId === ch.id)
                            return (
                              <div key={ci} className="mb-3 pl-3 border-l-2 border-dark-700">
                                <p className="text-xs">
                                  <span className="text-orange-400 font-medium">{roleName(ch.from)}</span>
                                  <span className="text-dark-600"> → </span>
                                  <span className="text-blue-400 font-medium">{roleName(ch.to)}</span>
                                  <span className={cn('ml-2 px-1.5 py-0.5 rounded text-[10px]',
                                    ch.type === 'invalidate' ? 'bg-red-900/30 text-red-400' :
                                    ch.type === 'disagree' ? 'bg-orange-900/30 text-orange-400' :
                                    'bg-blue-900/30 text-blue-400'
                                  )}>{ch.type}</span>
                                </p>
                                <p className="text-dark-300 text-xs mt-1">{ch.content}</p>
                                {rebuttal && (
                                  <div className={cn('mt-1.5 pl-3 border-l', rebuttal.conceded ? 'border-yellow-600' : 'border-dark-600')}>
                                    <p className="text-xs">
                                      <span className="text-blue-400 font-medium">{roleName(rebuttal.from)}</span>
                                      <span className={cn('ml-2 text-[10px] px-1.5 py-0.5 rounded', rebuttal.conceded ? 'bg-yellow-900/30 text-yellow-400' : 'bg-dark-700 text-dark-400')}>
                                        {rebuttal.conceded ? '让步' : '坚持'}
                                      </span>
                                    </p>
                                    <p className="text-dark-400 text-xs mt-0.5">{rebuttal.content}</p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Timing */}
              {result?.timing?.totalMs && (
                <div className="flex items-center justify-between text-dark-600 text-xs px-1">
                  <span>总耗时 {result.timing.totalMs}ms</span>
                  <span>{new Date(result.at).toLocaleTimeString('zh-CN')}</span>
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {analyzing ? '⏳ 分析中...' : '🔄 刷新分析'}
              </button>
            </>
          )}

          {!result && !analyzing && !analysisError && (
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-8 text-center">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-dark-200 font-medium mb-2">V2 团队分析</p>
              <p className="text-dark-500 text-sm mb-4">8角色分析 → 辩论挑战 → CEO决策</p>
              <button onClick={runAnalysis} className="px-6 py-2.5 bg-army-600 hover:bg-army-500 text-white text-sm rounded-lg transition-colors">
                🧠 开始分析
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 7 Agent Cards (CEO already shown above) */}
      {agents && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-dark-100">团队分析报告</h2>
              <p className="text-dark-500 text-sm mt-1">
                {market === 'crypto' ? 'Binance' : market === 'hk_stock' ? '新浪/港交所' : market === 'a_share' ? '新浪/沪深' : ''} 实时数据 · {debate ? `${debate.totalChallenges}次辩论 · ${debate.totalConcessions}次观点修正` : '独立分析'}
              </p>
            </div>
            {result && <span className="text-dark-500 text-xs">更新于 {new Date(result.at).toLocaleTimeString('zh-CN')}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleOrder.filter(r => r !== 'ceo').map(roleType => {
              const output = agents[roleType]
              if (!output) return null
              const role = ROLES.find(r => r.type === roleType as any)
              if (!role) return null

              return (
                <AgentCard key={roleType} role={role} output={output} debate={debate || null} />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function AgentCard({ role, output, debate }: {
  role: { type: string; label: string; description: string; icon: string; color: string }
  output: AgentOutput
  debate: DebateTranscript | null
}) {
  const [expanded, setExpanded] = useState(false)

  // Find challenges involving this agent
  const relevantChallenges = debate?.rounds.flatMap(r =>
    r.challenges.filter(c => c.from === output.role || c.to === output.role).map(c => ({
      ...c,
      rebuttal: r.rebuttals.find(rb => rb.challengeId === c.id),
    }))
  ) || []

  return (
    <div className={cn('bg-dark-900 rounded-xl border p-5 transition-colors',
      output.revised ? 'border-yellow-800/50' : 'border-dark-800'
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${role.color}20` }}>
          {role.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-dark-100">{role.label}</p>
            {output.revised && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400">观点已修正</span>}
          </div>
          <p className="text-xs text-dark-500 truncate">{output.summary}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={cn('text-lg font-bold', dirColor(output.direction))}>{output.direction}</span>
          <p className="text-dark-500 text-xs">{(output.confidence * 100).toFixed(0)}%信心</p>
        </div>
      </div>

      {/* Stance bar */}
      <div className="flex items-center gap-2 mb-3">
        <StanceBadge stance={output.stance} />
        {output.revised && output.originalConfidence && (
          <span className="text-dark-600 text-xs line-through">{(output.originalConfidence * 100).toFixed(0)}%</span>
        )}
        {relevantChallenges.length > 0 && (
          <span className="text-dark-600 text-xs ml-auto">{relevantChallenges.length}场辩论</span>
        )}
      </div>

      {/* Skill Results */}
      <div className="space-y-1.5 mb-2">
        {output.skillResults.map((sr, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-dark-600 text-xs mt-0.5">•</span>
            <p className="text-dark-300 text-xs flex-1">{sr.summary}</p>
          </div>
        ))}
      </div>

      {/* Expand for reasoning + debates */}
      {(output.reasoning.length > 0 || relevantChallenges.length > 0) && (
        <button onClick={() => setExpanded(!expanded)} className="text-dark-500 text-xs hover:text-dark-300 transition-colors">
          {expanded ? '收起' : `展开 (${output.reasoning.length}条推理${relevantChallenges.length > 0 ? ` + ${relevantChallenges.length}场辩论` : ''})`}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-2">
          {output.reasoning.length > 0 && (
            <div>
              <p className="text-dark-600 text-xs font-medium mb-1">推理过程</p>
              {output.reasoning.map((r, i) => (
                <p key={i} className="text-dark-400 text-xs">· {r}</p>
              ))}
            </div>
          )}
          {relevantChallenges.length > 0 && (
            <div>
              <p className="text-dark-600 text-xs font-medium mb-1">相关辩论</p>
              {relevantChallenges.map((ch, i) => (
                <div key={i} className="mb-2 pl-2 border-l border-dark-700">
                  <p className="text-xs">
                    <span className="text-orange-400">{roleName(ch.from)}</span>
                    <span className="text-dark-600"> → </span>
                    <span className="text-blue-400">{roleName(ch.to)}</span>
                  </p>
                  <p className="text-dark-400 text-xs mt-0.5">{ch.content}</p>
                  {ch.rebuttal && (
                    <p className={cn('text-xs mt-0.5', ch.rebuttal.conceded ? 'text-yellow-400/70' : 'text-dark-500')}>
                      ↳ {ch.rebuttal.conceded ? '🤝 让步: ' : '💪 坚持: '}{ch.rebuttal.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StanceBadge({ stance }: { stance: string }) {
  const styles = {
    bullish: 'bg-army-900/30 text-army-400 border-army-800',
    bearish: 'bg-red-900/30 text-red-400 border-red-800',
    neutral: 'bg-dark-800 text-dark-400 border-dark-700',
  }
  const labels = { bullish: '看多', bearish: '看空', neutral: '中性' }
  return (
    <span className={cn('px-2 py-0.5 rounded border text-xs', styles[stance as keyof typeof styles] || styles.neutral)}>
      {labels[stance as keyof typeof labels] || stance}
    </span>
  )
}

function MarketBadge({ market }: { market: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    crypto: { bg: 'bg-orange-900/30', text: 'text-orange-400', label: '₿ 加密货币' },
    us_stock: { bg: 'bg-purple-900/30', text: 'text-purple-400', label: '🇺🇸 美股' },
    hk_stock: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: '🇭🇰 港股' },
    a_share: { bg: 'bg-red-900/30', text: 'text-red-400', label: '🇨🇳 A股' },
  }
  const m = map[market] || map.crypto
  return <span className={cn('px-2 py-0.5 rounded-full text-xs', m.bg, m.text)}>{m.label}</span>
}

// Helpers
function dirColor(dir: string): string {
  if (dir === 'LONG') return 'text-army-400'
  if (dir === 'SHORT') return 'text-red-400'
  if (dir === 'WAIT') return 'text-yellow-400'
  return 'text-dark-400'
}

function verdictEmoji(v: string): string {
  if (v === 'LONG') return '🟢'
  if (v === 'SHORT') return '🔴'
  if (v === 'WAIT') return '🟡'
  return '⚪'
}

function roleName(role: string): string {
  const map: Record<string, string> = {
    collector: '采集员', strategist: '策略师', risk_officer: '风控官',
    analyst: '分析师', researcher: '研究员', executor: '执行员',
    cto: '技术官', ceo: 'CEO',
  }
  return map[role] || role
}
