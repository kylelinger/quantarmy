import { NextResponse } from 'next/server'

// Note: in demo mode, deletions/updates won't persist across cold starts
export async function DELETE() {
  return NextResponse.json({ ok: true, data: { deleted: true }, error: null })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  return NextResponse.json({ ok: true, data: { ...body, updated: true }, error: null })
}
