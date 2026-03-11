import { NextResponse } from 'next/server'

const DEMO_ROLES = [
  { id: 'r1', company_id: 'demo-001', role_type: 'ceo', active_skill_id: null, active_skill: null, config: {}, status: 'idle', last_output: null },
  { id: 'r2', company_id: 'demo-001', role_type: 'cto', active_skill_id: null, active_skill: null, config: {}, status: 'idle', last_output: null },
  { id: 'r3', company_id: 'demo-001', role_type: 'strategist', active_skill_id: 'psar-001', active_skill: null, config: {}, status: 'active', last_output: null },
  { id: 'r4', company_id: 'demo-001', role_type: 'risk_officer', active_skill_id: 'risk-001', active_skill: null, config: {}, status: 'active', last_output: null },
  { id: 'r5', company_id: 'demo-001', role_type: 'collector', active_skill_id: null, active_skill: null, config: {}, status: 'idle', last_output: null },
  { id: 'r6', company_id: 'demo-001', role_type: 'executor', active_skill_id: null, active_skill: null, config: {}, status: 'idle', last_output: null },
  { id: 'r7', company_id: 'demo-001', role_type: 'analyst', active_skill_id: null, active_skill: null, config: {}, status: 'idle', last_output: null },
  { id: 'r8', company_id: 'demo-001', role_type: 'researcher', active_skill_id: null, active_skill: null, config: {}, status: 'idle', last_output: null },
]

export async function GET() {
  return NextResponse.json({ ok: true, data: DEMO_ROLES, error: null })
}
