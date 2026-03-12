import { NextResponse } from 'next/server'
import { demoRoles } from '@/lib/demo-store'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; roleType: string }> }) {
  const body = await request.json()
  const { id, roleType } = await params
  const role = demoRoles.find((r) => r.company_id === id && r.role_type === roleType)

  if (!role) {
    return NextResponse.json({ ok: false, data: null, error: 'Role not found' }, { status: 404 })
  }

  role.active_skill_id = body.skill_id
  role.config = body.config || {}
  role.status = 'active'
  role.last_output = `已切换到技能 ${body.skill_id}`

  return NextResponse.json({ ok: true, data: role, error: null })
}
