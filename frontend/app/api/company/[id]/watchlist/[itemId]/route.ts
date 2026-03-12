import { NextResponse } from 'next/server'
import { demoWatchlist } from '@/lib/demo-store'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { itemId } = await params
  const idx = demoWatchlist.findIndex(w => w.id === itemId)
  if (idx === -1) return NextResponse.json({ ok: false, data: null, error: 'Not found' }, { status: 404 })
  const [removed] = demoWatchlist.splice(idx, 1)
  return NextResponse.json({ ok: true, data: { deleted: itemId, symbol: removed.symbol }, error: null })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { itemId } = await params
  const body = await request.json()
  const item = demoWatchlist.find(w => w.id === itemId)
  if (!item) return NextResponse.json({ ok: false, data: null, error: 'Not found' }, { status: 404 })

  if (body.notes !== undefined) item.notes = body.notes
  if (body.tags !== undefined) item.tags = body.tags
  if (body.priority !== undefined) item.priority = body.priority

  return NextResponse.json({ ok: true, data: item, error: null })
}
