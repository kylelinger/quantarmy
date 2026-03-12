# V2 Battle Mode — Design Document

> Status: Design Phase
> Target: v0.3.0

## Overview

V1 delivers 8 independent agent opinions per symbol.
V2 introduces **structured debate** where agents challenge each other,
and the CEO aggregates with a **validity check**.

## Flow

```
[Symbol enters analysis]
        │
        ▼
┌─ Phase 1: Independent Analysis (same as V1) ─┐
│  All 8 roles generate their independent view   │
│  Output: 8 structured opinions                  │
└─────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 2: Challenge Round ──────────────────────┐
│  Each role can "challenge" another role's output  │
│  Strategist sees Risk Officer's concern → rebuts  │
│  Risk Officer sees Strategist's signal → questions│
│  Max 2 rounds of back-and-forth                   │
│  Output: Debate transcript + revised opinions     │
└───────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 3: CEO Aggregation ──────────────────────┐
│  CEO reads all opinions + debate transcript       │
│  Weighted voting: roles have configurable weight  │
│  Consensus score: 0.0 – 1.0                      │
│  Output: Final thesis + confidence + invalidation │
└───────────────────────────────────────────────────┘
        │
        ▼
┌─ Phase 4: CTO Validity Check ───────────────────┐
│  CTO audits: data fresh? signals reliable?        │
│  Can VETO if data quality insufficient            │
│  Output: Approved / Flagged / Vetoed              │
└───────────────────────────────────────────────────┘
        │
        ▼
[Final output to user]
```

## Challenge Mechanics

### Who Challenges Whom

Natural pairs that create productive tension:

| Challenger | Target | Tension |
|---|---|---|
| Risk Officer | Strategist | "Your signal ignores drawdown risk" |
| Strategist | Risk Officer | "Your constraints are too conservative" |
| Researcher | Analyst | "Historical pattern disagrees with your structure read" |
| Analyst | Researcher | "Your comparable cases have survivorship bias" |
| Executor | Strategist | "This can't be executed at your target price" |
| CTO | Everyone | "Data quality insufficient for this conclusion" |
| Collector | Researcher | "Breaking news invalidates your historical comparison" |

### Challenge Format

```typescript
interface Challenge {
  from_role: RoleType
  to_role: RoleType
  challenge_type: 'disagree' | 'question' | 'extend' | 'invalidate'
  content: string
  evidence: string[]  // supporting data points
}

interface Rebuttal {
  from_role: RoleType
  in_response_to: Challenge
  content: string
  revised_opinion: boolean  // did they change their view?
  revised_output?: any      // new output if changed
}
```

### Round Limit

- Max 2 challenge rounds per symbol per analysis cycle
- Each role can issue max 1 challenge per round
- CTO can issue challenges to any role (special privilege)
- Time budget: 30 seconds per challenge round

## CEO Aggregation

### Weighted Voting

Default weights (user-configurable):

```yaml
weights:
  strategist: 1.5    # Core signal provider
  risk_officer: 1.3  # Safety critical
  analyst: 1.0
  researcher: 0.8
  collector: 0.7     # Info support, lower weight
  executor: 0.9
  cto: 1.2           # Technical integrity
```

### Consensus Score

```
consensus = Σ(weight_i × alignment_i) / Σ(weight_i)

where alignment_i = 1.0 if agrees with majority direction
                   = 0.0 if disagrees
                   = 0.5 if neutral/abstain
```

### CEO Output

```typescript
interface CEODecision {
  thesis: string                    // One-line directional thesis
  direction: 'bullish' | 'bearish' | 'neutral' | 'conflicted'
  consensus_score: number           // 0.0 - 1.0
  confidence: number                // 0.0 - 1.0
  invalidation_conditions: string[] // When to abandon this thesis
  key_disagreements: string[]       // What the team disagrees on
  recommended_action: string        // For user reference, not auto-executed
  debate_summary: string            // TL;DR of the debate
}
```

## CTO Validity Check

After CEO decision, CTO performs final audit:

```typescript
interface ValidityCheck {
  status: 'approved' | 'flagged' | 'vetoed'
  data_quality_score: number        // 0.0 - 1.0
  issues: string[]                  // Any problems found
  recommendation: string            // Fix suggestion if flagged
}
```

Veto conditions:
- Data staleness > configured threshold
- Missing role outputs (critical roles didn't respond)
- Contradiction between data sources not resolved
- Market regime changed since analysis started

## UI Design

### Battle View

New tab on the symbol detail page: "Team Battle"

Layout:
```
┌─────────────────────────────────────────────┐
│  Phase indicator: [1] [2] [3] [4]           │
├─────────────────┬───────────────────────────┤
│  Left panel:    │  Right panel:             │
│  Role opinions  │  Debate transcript        │
│  (cards)        │  (chat-like timeline)     │
│                 │                           │
│  Click role to  │  Challenge → Rebuttal     │
│  see details    │  shown as threads         │
├─────────────────┴───────────────────────────┤
│  CEO Decision Card                          │
│  ┌─────────────────────────────────────────┐│
│  │ Direction: BULLISH · Consensus: 0.78    ││
│  │ Thesis: ...                             ││
│  │ Key disagreement: Risk vs Strategy      ││
│  │ Invalidation: break below 85k          ││
│  └─────────────────────────────────────────┘│
│  CTO Validity: ✅ Approved                  │
└─────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Backend (estimated 2-3 sessions)
- [ ] `BattleEngine` class that orchestrates the 4 phases
- [ ] Challenge/Rebuttal data models
- [ ] CEO aggregation logic with weighted voting
- [ ] CTO validity check logic
- [ ] WebSocket events for real-time battle progress

### Phase 2: Frontend (estimated 2 sessions)
- [ ] Battle view component on symbol detail page
- [ ] Debate transcript timeline
- [ ] CEO decision card
- [ ] Phase progress indicator
- [ ] Role weight configuration in settings

### Phase 3: Polish (1 session)
- [ ] Configurable challenge pairs
- [ ] Custom weight presets
- [ ] Battle history / replay
- [ ] Performance comparison: V1 vs V2 decisions

## Open Questions

1. Should users be able to manually trigger a challenge? (vs auto)
2. Should battle results influence future role weights? (adaptive)
3. How to handle LLM latency in debate rounds? (streaming vs batch)
4. Should CTO veto force a re-analysis or just flag for user?

---

*Document created: 2026-03-12*
*Author: CTO (cuidaoshi)*
