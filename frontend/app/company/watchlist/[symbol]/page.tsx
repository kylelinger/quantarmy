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
import { getAgentMemory } from '@/lib/v2/memory/store'
import { saveV2Result } from '@/lib/v2/cache'

type TabType = 'analysis' | 'debate' | 'memory'

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
  const [activeTab, setActiveTab] = useState<TabType>('debate')

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
        if (partial && p === 'complete') setResult(partial as V2AnalysisResult)
      }
      const r = await runV2Analysis(decodedSymbol, onProgress)
      setResult(r)
      saveV2Result(r)
      // Auto-prefill order side from CEO verdict
      if (r.decision) {
        if (r.decision.verdict === 'LONG') { setOrderSide('long'); setShowQuickOrder(true) }
        else if (r.decision.verdict === 'SHORT') { setOrderSide('short'); setShowQuickOrder(true) }
      }
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
      if (isWatchlisted) await removeFromWatchlist(companyId, item.id)
      else await addToWatchlist(companyId, decodedSymbol, decodedSymbol, market)
      await refresh()
    } finally { setToggling(false) }
  }

  if (loading) return <div className="py-16 text-center text-dark-500">加载中...</div>

  const decision = result?.decision
  const agents = result?.agentOutputs
  const debate = result?.debate
  const roleOrder: RoleType[] = ['collector', 'strategist', 'risk_officer', 'analyst', 'researcher', 'executor', 'cto']

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/company/watchlist" className="text-army-400 hover:text-army-300 text-sm">← 返回自选标的</Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-dark-100">{decodedSymbol}</h1>
            <button onClick={toggleWatchlist} disabled={toggling}
              className={cn('p-1.5 rounded-lg transition-all', isWatchlisted ? 'text-yellow-400 hover:text-yellow-500' : 'text-dark-600 hover:text-yellow-400')}
              title={isWatchlisted ? '取消自选' : '添加自选'}>
              <svg className="w-6 h-6" fill={isWatchlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isWatchlisted ? 0 : 1.5} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            <MarketBadge market={market} />
          </div>
          <p className="text-dark-400 mt-2">V2 引擎: 8角色独立分析 → 辩论挑战 → CEO综合决策</p>
        </div>
        <div className="text-right">
          {decision ? (
            <div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-2xl">{verdictEmoji(decision.verdict)}</span>
                <span className={cn('text-2xl font-bold', dirColor(decision.verdict))}>{decision.verdict}</span>
              </div>
              <p className="text-dark-400 text-sm mt-1">信心 {(decision.confidence * 100).toFixed(0)}% | 共识 {decision.consensusScore.toFixed(2)}</p>
            </div>
          ) : phase ? (
            <div className="text-dark-500 text-sm">{PHASE_LABELS[phase]}</div>
          ) : null}
        </div>
      </div>

      {/* ── Quick Order Bar ───────────────────────────────── */}
      {decision && (
        <QuickOrderBar
          decision={decision} symbol={decodedSymbol}
          showQuickOrder={showQuickOrder} setShowQuickOrder={setShowQuickOrder}
          orderSide={orderSide} setOrderSide={setOrderSide}
          orderNotional={orderNotional} setOrderNotional={setOrderNotional}
          orderMsg={orderMsg} setOrderMsg={setOrderMsg}
        />
      )}

      {/* ── Progress Bar ──────────────────────────────────── */}
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
                  return <div key={p} className={cn('h-1.5 flex-1 rounded-full transition-colors', idx <= current ? 'bg-army-500' : 'bg-dark-700')} />
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Chart + CEO Sidebar ───────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
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

        <div className="col-span-12 xl:col-span-4 space-y-4">
          {analysisError && (
            <div className="bg-dark-900 rounded-xl border border-red-900/40 p-5">
              <p className="text-red-400 text-sm">❌ {analysisError}</p>
              <button onClick={runAnalysis} className="mt-2 text-sm text-army-400 hover:text-army-300">🔄 重试</button>
            </div>
          )}

          {decision ? (
            <>
              <CEODecisionCard decision={decision} />
              {result?.timing?.totalMs && (
                <div className="flex items-center justify-between text-dark-600 text-xs px-1">
                  <span>总耗时 {result.timing.totalMs}ms</span>
                  <span>{new Date(result.at).toLocaleTimeString('zh-CN')}</span>
                </div>
              )}
              <button onClick={runAnalysis} disabled={analyzing}
                className="w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 text-sm rounded-lg transition-colors disabled:opacity-50">
                {analyzing ? '⏳ 分析中...' : '🔄 刷新分析'}
              </button>
            </>
          ) : !analyzing && !analysisError ? (
            <div className="bg-dark-900 rounded-xl border border-dark-800 p-8 text-center">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-dark-200 font-medium mb-2">V2 团队分析</p>
              <p className="text-dark-500 text-sm mb-4">8角色分析 → 辩论挑战 → CEO决策</p>
              <button onClick={runAnalysis} className="px-6 py-2.5 bg-army-600 hover:bg-army-500 text-white text-sm rounded-lg transition-colors">🧠 开始分析</button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Tab Bar ────────────────────────────────────────── */}
      {result && (
        <div>
          <div className="flex items-center border-b border-dark-800">
            {([
              { key: 'debate' as TabType, label: '⚔️ 辩论记录', count: debate?.totalChallenges || 0 },
              { key: 'analysis' as TabType, label: '🧠 团队分析', count: 7 },
              { key: 'memory' as TabType, label: '🧬 Agent 记忆', count: null },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-5 py-3 text-sm font-medium transition-colors relative',
                  activeTab === tab.key
                    ? 'text-army-400'
                    : 'text-dark-500 hover:text-dark-300'
                )}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-dark-800 text-dark-400 text-[10px]">{tab.count}</span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-army-500" />
                )}
              </button>
            ))}
            {result && (
              <span className="ml-auto text-dark-600 text-xs pr-2">
                更新于 {new Date(result.at).toLocaleTimeString('zh-CN')}
              </span>
            )}
          </div>

          <div className="mt-4">
            {activeTab === 'analysis' && agents && <AnalysisTab agents={agents} debate={debate || null} roleOrder={roleOrder} market={market} />}
            {activeTab === 'debate' && <DebateTab debate={debate || null} agents={agents || null} />}
            {activeTab === 'memory' && <MemoryTab />}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Tab: Analysis (团队分析)
// ============================================================

function AnalysisTab({ agents, debate, roleOrder, market }: {
  agents: Record<RoleType, AgentOutput>
  debate: DebateTranscript | null
  roleOrder: RoleType[]
  market: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-dark-500 text-sm">
        {market === 'crypto' ? 'Binance' : market === 'hk_stock' ? '新浪/港交所' : market === 'a_share' ? '新浪/沪深' : ''} 实时数据
        {debate ? ` · ${debate.totalChallenges}次辩论 · ${debate.totalConcessions}次观点修正` : ''}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roleOrder.map(roleType => {
          const output = agents[roleType]
          if (!output) return null
          const role = ROLES.find(r => r.type === roleType as any)
          if (!role) return null
          return <AgentCard key={roleType} role={role} output={output} debate={debate} />
        })}
      </div>
    </div>
  )
}

// ============================================================
// Tab: Debate (辩论记录) — full width timeline
// ============================================================

function DebateTab({ debate, agents }: { debate: DebateTranscript | null; agents: Record<RoleType, AgentOutput> | null }) {
  if (!debate || debate.totalChallenges === 0) {
    return (
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-12 text-center">
        <p className="text-4xl mb-3">🕊️</p>
        <p className="text-dark-300 font-medium">本轮无辩论</p>
        <p className="text-dark-500 text-sm mt-2">所有角色观点一致，无需辩论</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debate Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="辩论轮次" value={`${debate.rounds.length} 轮`} icon="🔄" />
        <StatCard label="总挑战" value={`${debate.totalChallenges} 次`} icon="⚔️" />
        <StatCard label="让步" value={`${debate.totalConcessions} 次`} icon="🤝" />
        <StatCard label="坚持" value={`${debate.totalChallenges - debate.totalConcessions} 次`} icon="💪" />
      </div>

      {/* Stance Overview (before/after debate) */}
      {agents && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-5">
          <h3 className="text-sm font-semibold text-dark-300 mb-3">辩论前后对比</h3>
          <div className="space-y-2">
            {Object.values(agents).filter(a => a.role !== 'ceo').map(agent => (
              <div key={agent.role} className="flex items-center gap-3 text-xs">
                <span className="w-16 text-dark-400">{roleName(agent.role)}</span>
                <StanceBadge stance={agent.revised && agent.originalDirection ? stanceFromDir(agent.originalDirection) : agent.stance} />
                {agent.revised && (
                  <>
                    <span className="text-dark-600">→</span>
                    <StanceBadge stance={agent.stance} />
                    <span className="text-yellow-400/70 text-[10px]">信心 {((agent.originalConfidence || 0) * 100).toFixed(0)}% → {(agent.confidence * 100).toFixed(0)}%</span>
                  </>
                )}
                {!agent.revised && (
                  <span className="text-dark-600 text-[10px]">{(agent.confidence * 100).toFixed(0)}% 未变</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {debate.rounds.map(round => (
        <div key={round.round} className="bg-dark-900 rounded-xl border border-dark-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-sm font-bold text-dark-300">
              {round.round}
            </div>
            <h3 className="text-dark-200 font-semibold">第 {round.round} 轮辩论</h3>
            <span className="text-dark-600 text-xs ml-auto">{round.challenges.length} 次交锋</span>
          </div>

          <div className="space-y-4">
            {round.challenges.map((ch, ci) => {
              const rebuttal = round.rebuttals.find(r => r.challengeId === ch.id)
              return (
                <div key={ci} className="relative">
                  {/* Vertical connector */}
                  {ci < round.challenges.length - 1 && (
                    <div className="absolute left-4 top-12 bottom-0 w-px bg-dark-700" />
                  )}

                  {/* Challenge */}
                  <div className="flex gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                      ch.type === 'invalidate' ? 'bg-red-900/30 text-red-400' :
                      ch.type === 'disagree' ? 'bg-orange-900/30 text-orange-400' :
                      'bg-blue-900/30 text-blue-400'
                    )}>
                      {ch.type === 'invalidate' ? '🚫' : ch.type === 'disagree' ? '⚔️' : '❓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-orange-400 font-medium text-sm">{roleName(ch.from)}</span>
                        <span className="text-dark-600 text-xs">挑战</span>
                        <span className="text-blue-400 font-medium text-sm">{roleName(ch.to)}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] ml-auto',
                          ch.type === 'invalidate' ? 'bg-red-900/20 text-red-400' :
                          ch.type === 'disagree' ? 'bg-orange-900/20 text-orange-400' :
                          'bg-blue-900/20 text-blue-400'
                        )}>
                          {ch.type === 'invalidate' ? '⚠️ 无效质疑' : ch.type === 'disagree' ? '反对' : '追问'}
                        </span>
                      </div>
                      <div className="bg-dark-850 rounded-lg p-3 mb-2">
                        <p className="text-dark-200 text-sm">{ch.content}</p>
                        {ch.evidence.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ch.evidence.slice(0, 3).map((e, i) => (
                              <span key={i} className="px-2 py-0.5 bg-dark-800 rounded text-dark-500 text-[10px]">{e}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rebuttal */}
                      {rebuttal && (
                        <div className={cn('rounded-lg p-3 ml-6 border-l-2',
                          rebuttal.conceded ? 'bg-yellow-900/10 border-yellow-600' : 'bg-dark-850 border-dark-600'
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-400 font-medium text-sm">{roleName(rebuttal.from)}</span>
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px]',
                              rebuttal.conceded ? 'bg-yellow-900/30 text-yellow-400' : 'bg-dark-700 text-dark-400'
                            )}>
                              {rebuttal.conceded ? '🤝 让步' : '💪 坚持'}
                            </span>
                            {rebuttal.revisedConfidence && (
                              <span className="text-dark-600 text-[10px] ml-auto">信心调至 {(rebuttal.revisedConfidence * 100).toFixed(0)}%</span>
                            )}
                          </div>
                          <p className="text-dark-300 text-sm">{rebuttal.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Tab: Memory (Agent 记忆)
// ============================================================

function MemoryTab() {
  const roles: RoleType[] = ['collector', 'strategist', 'risk_officer', 'analyst', 'researcher', 'executor', 'cto', 'ceo']

  return (
    <div className="space-y-4">
      <p className="text-dark-500 text-sm">每个角色的历史分析记录和自我评估 (localStorage 持久化)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => {
          const mem = getAgentMemory(role)
          const recent = mem.records.slice(-5).reverse()
          const roleInfo = ROLES.find(r => r.type === role as any)
          if (!roleInfo) return null

          return (
            <div key={role} className="bg-dark-900 rounded-xl border border-dark-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{roleInfo.icon}</span>
                <h3 className="text-sm font-semibold text-dark-200">{roleInfo.label}</h3>
                <span className="text-dark-600 text-xs ml-auto">{mem.records.length} 条记录</span>
              </div>

              {recent.length === 0 ? (
                <p className="text-dark-600 text-xs">暂无记忆</p>
              ) : (
                <div className="space-y-2">
                  {recent.map((rec, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
                        rec.outcome === 'correct' ? 'bg-army-500' :
                        rec.outcome === 'incorrect' ? 'bg-red-500' : 'bg-dark-600'
                      )} />
                      <span className="text-dark-400 w-16 flex-shrink-0">{rec.symbol}</span>
                      <span className={dirColor(rec.direction)}>{rec.direction}</span>
                      <span className="text-dark-600">{(rec.confidence * 100).toFixed(0)}%</span>
                      <span className="text-dark-700 text-[10px] ml-auto">{new Date(rec.at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// CEO Decision Card
// ============================================================

function CEODecisionCard({ decision }: { decision: CEODecision }) {
  return (
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
              <div className={cn('h-full rounded-full', decision.confidence > 0.6 ? 'bg-army-500' : decision.confidence > 0.3 ? 'bg-yellow-500' : 'bg-red-500')}
                style={{ width: `${decision.confidence * 100}%` }} />
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
  )
}

// ============================================================
// Quick Order Bar
// ============================================================

function QuickOrderBar({ decision, symbol, showQuickOrder, setShowQuickOrder, orderSide, setOrderSide, orderNotional, setOrderNotional, orderMsg, setOrderMsg }: {
  decision: CEODecision; symbol: string
  showQuickOrder: boolean; setShowQuickOrder: (v: boolean) => void
  orderSide: 'long' | 'short'; setOrderSide: (v: 'long' | 'short') => void
  orderNotional: string; setOrderNotional: (v: string) => void
  orderMsg: { type: 'success' | 'error'; text: string } | null
  setOrderMsg: (v: { type: 'success' | 'error'; text: string } | null) => void
}) {
  return (
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
                    openPosition({ symbol, side: orderSide, notional: parseFloat(orderNotional), price: 0, strategy: 'v2-team', reason: `V2 ${decision.verdict} | ${symbol}` })
                    setOrderMsg({ type: 'success', text: `✅ ${orderSide === 'long' ? '做多' : '做空'} ${symbol} $${orderNotional}` })
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
  )
}

// ============================================================
// Shared Components
// ============================================================

function AgentCard({ role, output, debate }: {
  role: { type: string; label: string; description: string; icon: string; color: string }
  output: AgentOutput
  debate: DebateTranscript | null
}) {
  const [expanded, setExpanded] = useState(false)
  const relevantChallenges = debate?.rounds.flatMap(r =>
    r.challenges.filter(c => c.from === output.role || c.to === output.role).map(c => ({
      ...c, rebuttal: r.rebuttals.find(rb => rb.challengeId === c.id),
    }))
  ) || []

  return (
    <div className={cn('bg-dark-900 rounded-xl border p-5 transition-colors', output.revised ? 'border-yellow-800/50' : 'border-dark-800')}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${role.color}20` }}>{role.icon}</div>
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

      <div className="flex items-center gap-2 mb-3">
        <StanceBadge stance={output.stance} />
        {output.revised && output.originalConfidence && <span className="text-dark-600 text-xs line-through">{(output.originalConfidence * 100).toFixed(0)}%</span>}
        {relevantChallenges.length > 0 && <span className="text-dark-600 text-xs ml-auto">{relevantChallenges.length}场辩论</span>}
      </div>

      <div className="space-y-1.5 mb-2">
        {output.skillResults.map((sr, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-dark-600 text-xs mt-0.5">•</span>
            <p className="text-dark-300 text-xs flex-1">{sr.summary}</p>
          </div>
        ))}
      </div>

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
              {output.reasoning.map((r, i) => <p key={i} className="text-dark-400 text-xs">· {r}</p>)}
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

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-4 text-center">
      <p className="text-xl mb-1">{icon}</p>
      <p className="text-dark-200 font-bold text-lg">{value}</p>
      <p className="text-dark-500 text-xs">{label}</p>
    </div>
  )
}

function StanceBadge({ stance }: { stance: string }) {
  const styles = { bullish: 'bg-army-900/30 text-army-400 border-army-800', bearish: 'bg-red-900/30 text-red-400 border-red-800', neutral: 'bg-dark-800 text-dark-400 border-dark-700' }
  const labels = { bullish: '看多', bearish: '看空', neutral: '中性' }
  return <span className={cn('px-2 py-0.5 rounded border text-xs', styles[stance as keyof typeof styles] || styles.neutral)}>{labels[stance as keyof typeof labels] || stance}</span>
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
function dirColor(dir: string) { return dir === 'LONG' ? 'text-army-400' : dir === 'SHORT' ? 'text-red-400' : dir === 'WAIT' ? 'text-yellow-400' : 'text-dark-400' }
function verdictEmoji(v: string) { return v === 'LONG' ? '🟢' : v === 'SHORT' ? '🔴' : v === 'WAIT' ? '🟡' : '⚪' }
function roleName(role: string) { return ({ collector: '采集员', strategist: '策略师', risk_officer: '风控官', analyst: '分析师', researcher: '研究员', executor: '执行员', cto: '技术官', ceo: 'CEO' } as Record<string, string>)[role] || role }
function stanceFromDir(dir: string) { return dir === 'LONG' ? 'bullish' : dir === 'SHORT' ? 'bearish' : 'neutral' }
