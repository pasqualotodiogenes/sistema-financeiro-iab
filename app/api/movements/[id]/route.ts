import { NextRequest, NextResponse } from 'next/server'
import { db as getDb } from '@/lib/database'
import { AuthService } from '@/lib/auth'
import { AuthUtils } from '@/lib/auth-utils'
import type { Movement, UserWithPermissions } from '@/lib/types'
import { z } from 'zod'

const movementUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD.").optional(),
  description: z.string().min(1, "A descrição é obrigatória.").max(100, "A descrição deve ter no máximo 100 caracteres.").optional(),
  amount: z.number().positive("O valor deve ser um número positivo.").optional(),
  type: z.enum(['entrada', 'saida']).optional(),
});

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const token = req.cookies.get('session-token')?.value
    const session = await AuthService.getCurrentSession(token || '') as { user: UserWithPermissions }
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
    }

    const db = await getDb()
    const movement = await db.prepare('SELECT * FROM movements WHERE id = ?').get(id) as Movement
    if (!movement) {
      return NextResponse.json({ error: 'Movimentação não encontrada' }, { status: 404 })
    }

    if (!AuthUtils.canManageMovement(session.user, movement, 'edit')) {
      return NextResponse.json({ error: 'Permissão negada para editar esta movimentação' }, { status: 403 })
    }

    const data = await req.json()
    const validation = movementUpdateSchema.safeParse(data);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    const { date, description, amount, type } = validation.data;
    
    await db.prepare('UPDATE movements SET date = ?, description = ?, amount = ?, type = ? WHERE id = ?')
      .run(date || movement.date, description || movement.description, amount || movement.amount, type || movement.type, id)
    
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('Erro ao atualizar movimentação:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar movimentação' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const token = req.cookies.get('session-token')?.value
    const session = await AuthService.getCurrentSession(token || '') as { user: UserWithPermissions }
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
    }

    const db = await getDb()
    const movement = await db.prepare('SELECT * FROM movements WHERE id = ?').get(id) as Movement
    if (!movement) {
      return NextResponse.json({ error: 'Movimentação não encontrada' }, { status: 404 })
    }

    if (!AuthUtils.canManageMovement(session.user, movement, 'delete')) {
      return NextResponse.json({ error: 'Permissão negada para excluir esta movimentação' }, { status: 403 })
    }

    await db.prepare('DELETE FROM movements WHERE id = ?').run(id)
    
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('Erro ao excluir movimentação:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao excluir movimentação' }, { status: 500 })
  }
}