import { NextResponse } from 'next/server'
import { demoRoles } from '@/lib/demo-store'

export async function GET() {
  return NextResponse.json({ ok: true, data: demoRoles, error: null })
}
