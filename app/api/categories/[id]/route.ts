import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { AuthService } from '@/lib/auth'
import { Category } from '@/lib/types'
import { z } from 'zod'
import { AuthUtils } from '@/lib/auth-utils'

const categoryUpdateSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").max(50, "O nome deve ter no máximo 50 caracteres.").optional(),
  icon: z.string().min(1, "O ícone é obrigatório.").optional(),
  color: z.string().min(1, "A cor é obrigatória.").optional(),
  isPublic: z.boolean().optional(),
});

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const token = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('session-token='))?.split('=')[1]
    if (!token) {
      return NextResponse.json({ error: 'Token de sessão não encontrado' }, { status: 401 })
    }
    const session = AuthService.getCurrentSession(token)
    if (!session || !AuthUtils.canEditCategory(session.user)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
    }

<<<<<<< HEAD
    const db = getDb()
    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
=======
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
>>>>>>> 8c7ee621e6097d5d86f5297726a3fafed9a905c4
    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }
    if (category.isSystem) {
        return NextResponse.json({ error: 'Não é possível editar uma categoria do sistema.' }, { status: 403 })
    }

    const data = await req.json()
    const validation = categoryUpdateSchema.safeParse(data);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    const { name, icon, color, isPublic } = validation.data;

    db.prepare('UPDATE categories SET name = ?, icon = ?, color = ?, isPublic = ? WHERE id = ?')
      .run(name || category.name, icon || category.icon, color || category.color, isPublic === undefined ? category.isPublic : (isPublic ? 1 : 0), id)
    
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar categoria' }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const token = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('session-token='))?.split('=')[1]
    if (!token) {
      return NextResponse.json({ error: 'Token de sessão não encontrado' }, { status: 401 })
    }
    const session = AuthService.getCurrentSession(token)
    if (!session || !AuthUtils.canDeleteCategory(session.user)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
    }

<<<<<<< HEAD
    const db = getDb()
    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
=======
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
>>>>>>> 8c7ee621e6097d5d86f5297726a3fafed9a905c4
    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }
    if (category.isSystem) {
        return NextResponse.json({ error: 'Não é possível excluir uma categoria do sistema.' }, { status: 403 })
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao excluir categoria' }, { status: 500 })
  }
}