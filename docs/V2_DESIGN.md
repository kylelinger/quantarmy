# V2 Architecture Design — QuantArmy 量化军团

> Status: Design Phase
> Author: CTO (cuidaoshi) + CEO (tutu)
> Date: 2026-03-13
> Supersedes: V2_BATTLE_MODE.md (incorporated and expanded)

---

## 核心定义：Agent vs Skill vs Tool

这是V2最关键的架构决定。

```
┌─────────────────────────────────────────────────────────────────┐
│                         Agent (角色)                             │
│  = 人格 + 记忆 + 推理能力 + 判断力                                │
│  有立场、有观点、能辩论、会改变主意                                  │
│  类比：一个有经验的交易员                                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Skills (技能)                            │ │
│  │  = 可插拔的分析模块，Agent装备后使用                          │ │
│  │  无立场、无记忆、纯计算                                      │ │
│  │  类比：交易员手里的工具                                      │ │
│  │                                                            │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐    │ │
│  │  │ PSAR Trend  │ │ RSI Diverge  │ │ Volatility Model │    │ │
│  │  │ (计算PSAR)  │ │ (计算RSI)    │ │ (波动率建模)     │    │ │
│  │  └─────────────┘ └──────────────┘ └──────────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Tools (工具)                             │ │
│  │  = 系统级能力，不可替换                                      │ │
│  │  获取K线、查询深度、读取记忆、发起辩论                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 三层关系

| 层级 | 是什么 | 谁提供 | 可替换？ | 有记忆？ |
|------|--------|--------|---------|---------|
| **Agent** | 有人格的角色 | 系统默认 / 用户自定义 | ✅ 用户可换整个Agent | ✅ 有历史记忆 |
| **Skill** | 计算模块 | 系统内置 / GitHub导入 | ✅ 用户可换技能 | ❌ 无状态 |
| **Tool** | 系统API | 系统提供 | ❌ 固定 | ❌ |

### 回答CEO的问题

> "8个角色是agent还是skill？"

**答：每个角色是一个 Agent，装备了多个 Skills。**

```
策略师 Agent
├── 人格：激进、偏好趋势跟踪、对反转信号持怀疑态度
├── 记忆：上次分析BTCUSDT看多→结果涨了8%，信心+1
├── Skills（可换）：
│   ├── PSAR Trend Following (默认)
│   ├── EMA Crossover
│   └── MACD Histogram
└── Tools（固定）：
    ├── getKlines(symbol, interval)
    ├── getDepth(symbol)
    └── readMemory(symbol)
```

用户可以：
1. **换Skill**：给策略师换成Bollinger Breakout策略（GitHub导入）
2. **换Agent**：把默认策略师换成"保守型策略师"或完全自定义人格
3. **不能换Tool**：市场数据接口是固定的

---

## V2 默认8大Agent

每个Agent有：**名字、人格、偏好、辩论风格、装备技能**

### 1. 📡 Collector (信息采集员)
```yaml
persona: 数据控，追求信息完整性，对数据缺失零容忍
bias: 中立，不做方向判断，只报告事实
debate_style: 用数据说话，挑战别人的论据是否有数据支撑
default_skills:
  - MarketDataCollector     # 多源数据聚合
  - NewsScanner             # 新闻/公告扫描
  - OrderFlowAnalyzer       # 资金流向分析
tools: [getKlines, getDepth, getTrades, getTicker24h]
```

### 2. 📈 Strategist (策略师)
```yaml
persona: 趋势猎手，相信技术面，对基本面信号持保留态度
bias: 偏好做多趋势，但尊重空头信号
debate_style: 用图表和指标论证，会直接反驳纯感觉的观点
default_skills:
  - PSARTrend               # PSAR趋势跟踪 (slow AF)
  - EMACrossover            # EMA 20/50/200 交叉
  - MACDDivergence          # MACD背离检测
tools: [getKlines, readMemory]
```

### 3. 🛡 Risk Officer (风控官)
```yaml
persona: 保守派，永远看到风险，宁可错过不可做错
bias: 偏空/偏防守，倾向缩小仓位
debate_style: 挑战所有激进观点，用最坏情景反驳
default_skills:
  - VolatilityModel         # ATR/波动率评估
  - PositionSizer           # 仓位计算 (Kelly/固定比例)
  - DrawdownMonitor         # 回撤监控
tools: [getKlines, getPortfolio, readMemory]
```

### 4. 📊 Analyst (数据分析师)
```yaml
persona: 多维度思考者，喜欢跨时间框架验证
bias: 中立，追求多角度验证
debate_style: 提供对立面的证据，补充别人忽略的维度
default_skills:
  - MultiTimeframeAnalyzer  # 多时间框架趋势
  - SupportResistance       # 关键支撑/阻力位
  - CandlePatterns          # K线形态识别
tools: [getKlines, readMemory]
```

### 5. 🔬 Researcher (研究员)
```yaml
persona: 学术派，相信统计数据，对单一指标信号持怀疑态度
bias: 反趋势（逆向思维），寻找被忽略的模式
debate_style: 用历史统计和概率反驳确定性过高的结论
default_skills:
  - StatisticalAnalyzer     # 历史分布/季节性
  - BetaCalculator          # 相关性/Beta
  - RegimeDetector          # 市场状态检测
tools: [getKlines, readMemory]
```

### 6. ⚡ Executor (交易执行员)
```yaml
persona: 实战派，关注能不能执行而非理论是否完美
bias: 偏好高流动性标的，对小市值谨慎
debate_style: 从执行可行性挑战不切实际的建议
default_skills:
  - LiquidityScorer         # 流动性评分
  - SlippageEstimator       # 滑点估算
  - EntryOptimizer          # 入场时机优化
tools: [getDepth, getTrades, readMemory]
```

### 7. ⚙️ CTO (技术官)
```yaml
persona: 质量控制员，不参与方向判断，只审计分析质量
bias: 中立，但对数据质量有偏执
debate_style: 质疑数据来源，指出逻辑漏洞，可VETO任何角色
privilege: 可向任何角色发起挑战（特权）
default_skills:
  - DataQualityAuditor      # 数据完整性检查
  - AnomalyDetector         # 异常值检测
  - ConsistencyChecker      # 交叉一致性验证
tools: [getKlines, getDepth, getTrades, systemHealth]
```

### 8. 👔 CEO (决策者)
```yaml
persona: 综合决策者，既尊重多数意见也重视少数派异议
bias: 偏好共识明确的方向，共识模糊时倾向WAIT
debate_style: 不直接辩论，而是追问、交叉验证、寻找矛盾
privilege: 可追问任何角色，可要求两个角色当面对质
default_skills:
  - ConsensusAggregator     # 加权共识算法
  - ActionPlanGenerator     # 行动方案生成
  - InvalidationTracker     # 失效条件追踪
tools: [readAllOutputs, readMemory, readDebateLog]
```

---

## V2 分析流程

### 完整Pipeline

```
用户选择标的 (e.g., BTCUSDT)
        │
        ▼
═══ Phase 1: Data Collection (5s) ════════════════════
│  Collector Agent 执行所有数据采集 Skills            │
│  输出: MarketSnapshot (klines, depth, trades, news) │
│  → 广播给所有其他 Agent                              │
═════════════════════════════════════════════════════

        │ MarketSnapshot
        ▼
═══ Phase 2: Independent Analysis (3-5s) ═════════════
│  6个分析Agent并行执行各自Skills:                     │
│  Strategist  → SignalReport (方向+信心)              │
│  RiskOfficer → RiskReport (风险评分+仓位建议)        │
│  Analyst     → PatternReport (形态+支撑阻力)        │
│  Researcher  → StatReport (统计+概率)                │
│  Executor    → FeasibilityReport (执行可行性)        │
│  CTO         → QualityReport (数据质量审计)          │
│                                                      │
│  每个Agent可查询自己的历史记忆:                       │
│  "上次我分析BTCUSDT时看多，结果如何？"               │
═══════════════════════════════════════════════════════

        │ 6份Report
        ▼
═══ Phase 3: Debate (3-8s, 2轮) ═════════════════════
│                                                      │
│  Round 1: 自动匹配辩论对                             │
│  ┌──────────────┐       ┌──────────────┐            │
│  │ Strategist   │──vs──│ RiskOfficer  │            │
│  │ "PSAR看多,   │       │ "ADX=15太弱, │            │
│  │  EMA金叉"    │       │  不建议入场"  │            │
│  └──────────────┘       └──────────────┘            │
│  ┌──────────────┐       ┌──────────────┐            │
│  │ Analyst      │──vs──│ Researcher   │            │
│  │ "多TF确认    │       │ "历史上类似   │            │
│  │  上升趋势"   │       │  形态60%走空" │            │
│  └──────────────┘       └──────────────┘            │
│  ┌──────────────┐                                   │
│  │ CTO          │──审计→ 所有人                     │
│  │ "Collector数据│                                   │
│  │  缺少4h级别" │                                   │
│  └──────────────┘                                   │
│                                                      │
│  Round 2: 回应+修正意见 (可选跳过)                   │
│  Agent可以：坚持原判 / 修正观点 / 让步               │
│                                                      │
│  输出: DebateTranscript                              │
═══════════════════════════════════════════════════════

        │ 6份Report (可能已修正) + DebateTranscript
        ▼
═══ Phase 4: CEO Decision (2-3s) ════════════════════
│                                                      │
│  CEO Agent 执行:                                     │
│  1. 读取所有Report (原始 + 修正后)                   │
│  2. 读取DebateTranscript                             │
│  3. 可选：追问某Agent ("你为什么让步了？")           │
│  4. 加权共识计算                                     │
│  5. 生成ActionPlan                                   │
│                                                      │
│  输出: CEODecision                                   │
│  {                                                   │
│    verdict: "LONG" | "SHORT" | "WAIT",              │
│    confidence: 0.72,                                 │
│    consensus: 0.65,                                  │
│    thesis: "趋势确认但风险中等，建议半仓试多",       │
│    action: { entry, sl, tp, size },                  │
│    invalidation: ["跌破85000", "ADX<10"],            │
│    key_debate: "策略师vs风控官在趋势强度上分歧",     │
│    dissent: "研究员坚持看空，历史概率支持"            │
│  }                                                   │
═══════════════════════════════════════════════════════

        │ CEODecision
        ▼
═══ Phase 5: Memory Update ══════════════════════════
│  存储本次分析到每个Agent的记忆:                      │
│  - Strategist: "BTCUSDT 2026-03-13 看多(PSAR) conf=0.7" │
│  - RiskOfficer: "风险评分6/10, 建议30%仓位"          │
│  - CEO: "最终LONG, consensus=0.65"                   │
│  下次分析时可回忆                                    │
═══════════════════════════════════════════════════════
```

---

## Skill 系统设计

### Skill 接口规范

```typescript
interface SkillDefinition {
  id: string;                    // "psar-trend-v1"
  name: string;                  // "PSAR Trend Following"
  version: string;               // "1.0.0"
  compatible_roles: RoleType[];  // ["strategist", "analyst"]
  
  // 输入输出类型声明
  input: SkillInputSchema;       // 需要什么数据
  output: SkillOutputSchema;     // 输出什么结果
  
  // 计算函数 (纯函数，无副作用)
  compute(input: SkillInput): SkillOutput;
}

// Skill 分类
type SkillCategory = 
  | 'signal'      // 方向信号 (策略师/分析师用)
  | 'risk'        // 风险评估 (风控官用)
  | 'data'        // 数据采集 (采集员用)
  | 'execution'   // 执行策略 (执行员用)
  | 'statistics'  // 统计分析 (研究员用)
  | 'audit'       // 质量审计 (CTO用)
  | 'decision'    // 决策聚合 (CEO用)
  | 'universal';  // 通用
```

### 默认技能清单 (24个, 3×8角色)

| Agent | Skill 1 (核心) | Skill 2 | Skill 3 |
|-------|---------------|---------|---------|
| Collector | MarketDataCollector | NewsScanner | OrderFlowAnalyzer |
| Strategist | PSARTrend | EMACrossover | MACDDivergence |
| RiskOfficer | VolatilityModel | PositionSizer | DrawdownMonitor |
| Analyst | MultiTimeframe | SupportResistance | CandlePatterns |
| Researcher | StatAnalyzer | BetaCalculator | RegimeDetector |
| Executor | LiquidityScorer | SlippageEstimator | EntryOptimizer |
| CTO | DataQualityAudit | AnomalyDetector | ConsistencyChecker |
| CEO | ConsensusAggregator | ActionPlanGen | InvalidationTracker |

### GitHub Skill 导入

用户可以从GitHub导入自定义Skill：

```
用户输入: github.com/someone/rsi-divergence-skill
     │
     ▼
系统检查: skill.yaml 是否存在？
     │
     ├── YES → 解析 skill.yaml
     │         验证接口兼容性
     │         沙盒执行测试
     │         导入到用户Skill库
     │
     └── NO  → 报错: 非标准QuantArmy Skill
```

**skill.yaml 规范:**
```yaml
name: RSI Divergence
version: 1.0.0
author: someone
compatible_roles: [strategist, analyst]
category: signal
description: "检测RSI背离信号"
entry: index.ts          # 或 index.py
timeout: 10s
memory_limit: 128MB
```

---

## 记忆系统

### 架构

```
┌────────────────────────────────────────────┐
│            Agent Memory Store              │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Short-term (当次分析)               │  │
│  │  - 本次各Agent输出                   │  │
│  │  - 辩论记录                          │  │
│  │  - CEO决策                           │  │
│  │  存储: 内存 (分析session期间)        │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Long-term (历史分析)                │  │
│  │  - 每个Agent对每个标的的历史判断     │  │
│  │  - 判断的最终结果 (对了/错了)        │  │
│  │  - 置信度校准数据                    │  │
│  │  存储: localStorage → 未来 IndexedDB │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Meta-memory (自我认知)              │  │
│  │  - "我在BTC上做多准确率68%"          │  │
│  │  - "我和风控官经常意见相左"          │  │
│  │  - "最近3次PSAR信号2次正确"          │  │
│  │  存储: 从long-term计算得出           │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

### 记忆如何影响辩论

```
Strategist Agent 分析 BTCUSDT:

[查询记忆] → "上次(3天前)BTCUSDT PSAR看多, 最终涨了5%, 正确"
[查询记忆] → "上上次(7天前)BTCUSDT PSAR看多, 最终跌了3%, 错误"
[查询记忆] → "我的PSAR信号历史准确率: 62%"

→ 本次PSAR再次看多
→ Agent输出: "PSAR看多 (置信度0.7, 历史准确率62%, 近期1胜1负)"

辩论时:
RiskOfficer: "你的PSAR近两次50%准确率，凭什么这次信心0.7？"
Strategist: "上次失败是震荡市，这次ADX=28确认趋势，情况不同"
```

---

## 自定义Agent

### 用户自定义方式

**方式1: 调整人格参数 (UI拖拽)**
```yaml
# 用户在设置页调整
strategist:
  aggressiveness: 0.8      # 0=保守 1=激进
  trend_preference: 0.9    # 偏好趋势 vs 均值回归
  confidence_baseline: 0.6 # 基础自信度
```

**方式2: GitHub导入完整Agent**
```yaml
# agent.yaml
name: "逆势猎人"
role: strategist
persona: |
  反趋势交易者，专门在极端情绪时逆向操作。
  相信均值回归，不信FOMO也不信FUD。
  口头禅："别人贪婪我恐惧"
bias: contrarian
debate_style: |
  用极端情绪指标反驳趋势跟踪者，
  经常引用历史上的趋势反转案例
skills:
  - rsi-divergence
  - bollinger-squeeze
  - sentiment-extreme
```

**方式3: 系统预设多版本**
```
策略师 Agent:
├── 默认版 (趋势猎手) ← V2自带
├── 逆势版 (均值回归) ← V2自带
└── 自定义 (GitHub导入)
```

---

## UI 设计 (V2)

### 辩论可视化

```
┌─────────────────────────────────────────────────────────────┐
│  BTCUSDT 团队分析                                    ⟳ 刷新  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ 进度 ───────────────────────────────────────────────┐  │
│  │ ① 采集 ✅  ② 分析 ✅  ③ 辩论 🔄  ④ 决策 ⬜  ⑤ 记忆 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ 辩论场 ────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  📈策略师              vs              🛡风控官      │   │
│  │  ┌──────────────┐          ┌──────────────┐         │   │
│  │  │ PSAR看多     │          │ 波动率偏高   │         │   │
│  │  │ ADX=28确认   │   ──→    │ 建议等ADX>30 │         │   │
│  │  │ EMA金叉      │   ←──    │ 最大仓位20%  │         │   │
│  │  │ conf: 0.75   │          │ risk: 6/10   │         │   │
│  │  └──────────────┘          └──────────────┘         │   │
│  │                                                      │   │
│  │  💬 辩论记录:                                        │   │
│  │  ├ 🛡 "ADX=28边界值，上次ADX=26时PSAR失败了"        │   │
│  │  ├ 📈 "那次是震荡市，这次EMA已经金叉确认趋势"       │   │
│  │  └ 🛡 "有道理，我把风险评分调到5/10，但仓位维持20%" │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ CEO 决策 ──────────────────────────────────────────┐   │
│  │  👔 verdict: LONG · confidence: 0.72 · consensus: 0.65│  │
│  │  "趋势初步确认，分歧在强度判断。建议半仓试多。"      │   │
│  │  📋 Entry: 86,500  SL: 84,200  TP: 91,000           │   │
│  │  ⚠️ 失效条件: 跌破84,000 或 ADX回落<20              │   │
│  │  🔴 少数派: 研究员坚持看空 (历史概率60%)             │   │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ 角色总览 ──────────────────────────────────────────┐   │
│  │ 📡采集 ✅ │ 📈策略 LONG │ 🛡风控 5/10 │ 📊分析 LONG│  │
│  │ 🔬研究 SHORT│ ⚡执行 OK  │ ⚙️CTO ✅    │ 👔CEO LONG│  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 角色关系图 (新增)

圆形布局，8个角色围一圈：
- 绿线：意见一致
- 红线：意见冲突
- 线粗细：分歧程度
- 箭头：谁挑战了谁

---

## 技术实现计划

### 不用LLM的V2 (Phase 1)

> 关键决定：V2.0 先不引入LLM，用规则引擎实现辩论逻辑。
> 原因：免费、快速、可控、不依赖API key。
> V2.1 再引入LLM让辩论更自然。

```typescript
// 规则引擎辩论 (无需LLM)
function generateChallenge(
  challenger: AgentOutput,
  target: AgentOutput,
  memory: AgentMemory
): Challenge | null {
  // 策略师 vs 风控官
  if (challenger.role === 'strategist' && target.role === 'risk_officer') {
    if (challenger.direction === 'long' && target.risk_score > 7) {
      return {
        type: 'disagree',
        content: buildDisagreeMessage(challenger, target, memory),
        evidence: challenger.indicators.filter(i => i.supports_direction)
      };
    }
  }
  // ... 更多规则对
  return null; // 不需要辩论
}

// 基于规则的回应 (无需LLM)
function generateRebuttal(
  challenge: Challenge,
  agent: AgentOutput,
  memory: AgentMemory
): Rebuttal {
  const historicalAccuracy = memory.getAccuracy(agent.role);
  const shouldConcede = evaluateChallengeStrength(challenge, agent);
  
  return {
    revised: shouldConcede,
    revised_confidence: shouldConcede 
      ? agent.confidence * 0.8 
      : agent.confidence,
    content: buildRebuttalMessage(challenge, agent, shouldConcede, memory)
  };
}
```

### V2.1 引入LLM (Phase 2, 可选)

```typescript
// LLM增强辩论 (需要API key)
async function llmDebate(
  agents: AgentOutput[],
  debatePairs: [RoleType, RoleType][],
  systemPrompts: Record<RoleType, string>
): Promise<DebateTranscript> {
  // 每个Agent用自己的system prompt + skill输出作为context
  // LLM生成自然语言辩论
  // 更丰富、更有创意，但需要API key和延迟
}
```

### 实现路线图

```
V2.0 (规则引擎辩论) — 预计 4-6 sessions
├── lib/agents/              Agent定义 + 人格系统
│   ├── types.ts             Agent/Skill/Tool类型
│   ├── base-agent.ts        BaseAgent (人格+记忆+推理)
│   ├── collector.ts         Collector Agent
│   ├── strategist.ts        Strategist Agent
│   ├── risk-officer.ts      RiskOfficer Agent
│   ├── analyst.ts           Analyst Agent
│   ├── researcher.ts        Researcher Agent
│   ├── executor.ts          Executor Agent
│   ├── cto.ts               CTO Agent
│   └── ceo.ts               CEO Agent
├── lib/debate/              辩论引擎
│   ├── engine.ts            DebateEngine (匹配+协调)
│   ├── rules.ts             辩论规则 (谁挑战谁,何时)
│   ├── challenge.ts         Challenge生成逻辑
│   └── transcript.ts        辩论记录数据结构
├── lib/memory/              记忆系统
│   ├── store.ts             MemoryStore (localStorage)
│   ├── agent-memory.ts      AgentMemory (per agent per symbol)
│   └── meta-memory.ts       MetaMemory (自我认知计算)
├── lib/skills/              Skill系统 (重构现有analysis/)
│   ├── registry.ts          Skill注册表
│   ├── loader.ts            Skill加载器 (内置+GitHub)
│   └── builtin/             24个默认Skill
├── components/Debate/       辩论UI
│   ├── DebateView.tsx       辩论主视图
│   ├── DebateArena.tsx      辩论场 (对手面板)
│   ├── DebateLog.tsx        辩论记录时间线
│   ├── RelationGraph.tsx    角色关系图
│   └── PhaseProgress.tsx    进度条 (5阶段)
└── pages
    └── [symbol] page 改造    集成辩论视图

V2.1 (LLM增强) — 2-3 sessions
├── lib/llm/                 LLM集成
│   ├── client.ts            通用LLM客户端
│   ├── prompts.ts           Agent system prompts
│   └── debate-llm.ts        LLM辩论生成
└── 设置页                   API key配置
```

---

## V1 → V2 迁移

### 保留什么
- ✅ 所有市场数据接口 (Binance/Sina/Yahoo)
- ✅ 纸盘交易引擎
- ✅ TradingView图表
- ✅ 自选标的系统
- ✅ analysis/indicators.ts (技术指标计算)

### 重构什么
- 🔄 `analysis/*.ts` (8个文件) → `agents/*.ts` + `skills/builtin/*.ts`
  - 现有计算逻辑 → Skills (纯计算)
  - 新增人格/记忆/辩论 → Agents (有状态)
- 🔄 Symbol detail page → 新增辩论视图tab
- 🔄 CEO decision card → 包含辩论摘要

### 新增什么
- 🆕 辩论引擎 (`lib/debate/`)
- 🆕 记忆系统 (`lib/memory/`)
- 🆕 Skill注册表 + GitHub导入
- 🆕 辩论可视化组件
- 🆕 角色关系图
- 🆕 Agent自定义设置页

---

## 开放问题 (需CEO决定)

1. **V2.0 用规则引擎 vs 直接上LLM？**
   - 规则引擎：免费、快(<5s)、可控，但辩论内容模板化
   - LLM：自然、有创意，但需API key、慢(10-20s)、成本
   - **CTO建议：V2.0规则引擎，V2.1可选LLM增强**

2. **记忆持久化方案？**
   - localStorage：简单，但单设备
   - IndexedDB：更大容量，仍单设备
   - 后端(Render)：跨设备，但需部署
   - **CTO建议：V2.0用localStorage，V2.1上后端**

3. **辩论应该自动触发还是用户手动触发？**
   - 自动：每次分析都辩论 (慢但深入)
   - 手动：用户点"开始辩论"后才跑 (快但可选)
   - **CTO建议：默认自动，提供"快速分析(跳过辩论)"选项**

4. **是否支持用户旁观/参与辩论？**
   - 旁观：看AI辩论，不干预
   - 参与：用户可以向任何角色提问/挑战
   - **CTO建议：V2.0旁观，V2.1用户参与**

---

*Document created: 2026-03-13 by CTO (cuidaoshi)*
*Awaiting CEO review and decisions on open questions.*
