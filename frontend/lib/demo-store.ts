export const demoRoles = [
  { id: 'r1', company_id: 'demo-001', role_type: 'ceo', active_skill_id: 'ceo-consensus-001', active_skill: null, config: {}, status: 'active', last_output: '团队当前对 BTCUSDT 偏多，但 Researcher 与 Risk Officer 仍有分歧。' },
  { id: 'r2', company_id: 'demo-001', role_type: 'cto', active_skill_id: 'cto-data-001', active_skill: null, config: {}, status: 'active', last_output: 'BTCUSDT 数据新鲜度良好，最近 4h 管线完整。' },
  { id: 'r3', company_id: 'demo-001', role_type: 'strategist', active_skill_id: 'psar-001', active_skill: null, config: {}, status: 'active', last_output: 'PSAR 与 EMA 共振偏多，但短线已接近第一压力位。' },
  { id: 'r4', company_id: 'demo-001', role_type: 'risk_officer', active_skill_id: 'risk-001', active_skill: null, config: {}, status: 'active', last_output: '建议仓位不超过 15%，失效位放在 85k 下方。' },
  { id: 'r5', company_id: 'demo-001', role_type: 'collector', active_skill_id: 'collector-news-001', active_skill: null, config: {}, status: 'active', last_output: 'ETF 流入与政策利好构成短期情绪支撑。' },
  { id: 'r6', company_id: 'demo-001', role_type: 'executor', active_skill_id: 'executor-liquidity-001', active_skill: null, config: {}, status: 'active', last_output: 'BTC 流动性优秀，可分两档限价执行。' },
  { id: 'r7', company_id: 'demo-001', role_type: 'analyst', active_skill_id: 'analyst-structure-001', active_skill: null, config: {}, status: 'active', last_output: '当前处于中期上升趋势的高位整理区。' },
  { id: 'r8', company_id: 'demo-001', role_type: 'researcher', active_skill_id: 'researcher-cases-001', active_skill: null, config: {}, status: 'active', last_output: '当前叙事与上一轮 ETF 驱动阶段相似，但热度更克制。' },
]

export const demoWatchlist = [
  {
    id: 'w1', symbol: 'BTCUSDT', display_name: 'Bitcoin', market: 'crypto',
    notes: '', tags: ['Layer 1', '核心资产'], priority: 2,
    added_at: new Date(Date.now() - 86400_000 * 3).toISOString(),
    last_analysis: {
      collector: { sentiment: 0.62, headlines: ['BTC ETF流入创新高', 'SEC批准新的加密货币交易产品', '机构持仓量持续增长'], summary: '外部消息面仍偏多，短期没有明显利空催化。', at: new Date(Date.now() - 7200_000).toISOString() },
      researcher: { summary: '当前叙事与上一轮 ETF 驱动阶段相似，但投机程度更低。', notes: '相似案例多在高位震荡后选择向上突破。', at: new Date(Date.now() - 5400_000).toISOString() },
      strategist: { signal: 'LONG', confidence: 0.72, reason: 'PSAR bull flip | EMA 88100 trending up | ADX 28.5 strong trend', at: new Date(Date.now() - 3600_000).toISOString() },
      analyst: { trend: '强势上行趋势，MA20/50/200多头排列', summary: '价格处于中期趋势上沿附近，结构偏强但不算低位。', support: 85000, resistance: 92000, at: new Date(Date.now() - 3600_000).toISOString() },
      risk_officer: { risk_score: 4, notes: '波动率适中，建议仓位不超过15%', at: new Date(Date.now() - 3600_000).toISOString() },
      executor: { summary: '流动性充足，可分两档挂单，避免市价追高。', notes: '预估滑点低于 4 bps。', at: new Date(Date.now() - 3200_000).toISOString() },
      cto: { summary: '数据完整，最近 4 小时各角色更新时间正常。', notes: '暂无数据质量风险。', at: new Date(Date.now() - 3000_000).toISOString() },
      ceo: { verdict: '偏多，但不建议追单，等待回踩更优。', debate: '策略师偏强，风控官担心高位回撤。', invalidation: '若放量跌破 85k，则当前 thesis 失效。', at: new Date(Date.now() - 2400_000).toISOString() },
    },
  },
  {
    id: 'w2', symbol: 'ETHUSDT', display_name: 'Ethereum', market: 'crypto',
    notes: 'Pectra升级关注', tags: ['Layer 1', 'DeFi'], priority: 1,
    added_at: new Date(Date.now() - 86400_000 * 2).toISOString(),
    last_analysis: {
      strategist: { signal: 'LONG', confidence: 0.58, reason: 'PSAR bull flip | EMA支撑但动能偏弱 | ADX 22.1', at: new Date(Date.now() - 7200_000).toISOString() },
      risk_officer: { risk_score: 5, notes: 'ETH/BTC比值低位，注意回调风险', at: new Date(Date.now() - 7200_000).toISOString() },
      collector: { sentiment: 0.45, headlines: ['ETH质押率突破30%', 'Pectra升级时间线确认', 'L2生态TVL持续增长'], at: new Date(Date.now() - 10800_000).toISOString() },
      ceo: { verdict: '偏多但催化尚未完全兑现。', debate: '策略师偏多，执行员建议等待更优流动性窗口。', invalidation: '跌破近期结构低点则 thesis 弱化。', at: new Date(Date.now() - 3600_000).toISOString() },
    },
  },
  {
    id: 'w3', symbol: 'SOLUSDT', display_name: 'Solana', market: 'crypto',
    notes: '', tags: ['Layer 1', '高Beta'], priority: 1,
    added_at: new Date(Date.now() - 86400_000).toISOString(),
    last_analysis: {
      strategist: { signal: 'HOLD', confidence: 0.45, reason: 'PSAR中性 | ADX 18.2 低波动震荡', at: new Date(Date.now() - 3600_000 * 4).toISOString() },
      risk_officer: { risk_score: 6, notes: '近期波动较大，建议小仓位', at: new Date(Date.now() - 3600_000 * 4).toISOString() },
    },
  },
  {
    id: 'w4', symbol: 'XRPUSDT', display_name: 'XRP', market: 'crypto',
    notes: '', tags: [], priority: 0,
    added_at: new Date(Date.now() - 3600_000 * 12).toISOString(),
    last_analysis: {},
  },
]
