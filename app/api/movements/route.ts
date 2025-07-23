import { NextRequest, NextResponse } from 'next/server'
import { db as getDb } from '@/lib/database'
import { AuthService } from '@/lib/auth'
import { AuthUtils } from '@/lib/auth-utils'
import type { Movement, UserWithPermissions } from '@/lib/types'
import { z } from 'zod'

const movementSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD."),
  description: z.string().min(1, "A descrição é obrigatória.").max(100, "A descrição deve ter no máximo 100 caracteres."),
  amount: z.number().positive("O valor deve ser um número positivo."),
  type: z.enum(['entrada', 'saida']),
  category: z.string().min(1, "A categoria é obrigatória."),
});

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('session-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const session = await AuthService.getCurrentSession(token) as { user: UserWithPermissions }
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
    }

    const db = getDb()
    // Verificar se há filtro por categoria
    const url = new URL(req.url)
    const categorySlug = url.searchParams.get('categorySlug')
    
    let movements: Movement[]
    
    if (categorySlug) {
      // Filtrar por categoria específica (OTIMIZAÇÃO)
      // Primeiro buscar o ID da categoria pelo slug
      const category = await db.prepare('SELECT id FROM categories WHERE slug = ?').get(categorySlug) as { id: string } | undefined
      
      if (!category) {
        return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
      }
      
      // Verificar se o usuário tem acesso à categoria
      if (session.user.role !== 'root' && session.user.role !== 'admin') {
        if (!session.user.permissions.categories.includes(category.id)) {
          return NextResponse.json({ error: 'Acesso negado à categoria' }, { status: 403 })
        }
      }
      
      // Buscar movimentações apenas da categoria especificada
      movements = await db.prepare('SELECT * FROM movements WHERE category = ? ORDER BY date DESC, createdAt DESC').all(category.id) as Movement[]
    } else {
      // Comportamento original: buscar todas as movimentações que o usuário pode ver
      if (session.user.role === 'root' || session.user.role === 'admin') {
        // Root e admin veem todas as movimentações
        movements = await db.prepare('SELECT * FROM movements ORDER BY date DESC').all() as Movement[]
      } else {
        // Outros usuários veem apenas movimentações das categorias que têm acesso
        const categoryPlaceholders = session.user.permissions.categories.map(() => '?').join(',')
        const query = `
          SELECT * FROM movements 
          WHERE category IN (${categoryPlaceholders})
          ORDER BY date DESC, createdAt DESC
        `
        movements = await db.prepare(query).all(...session.user.permissions.categories) as Movement[]
      }
    }
    
    return NextResponse.json(movements)
  } catch (error: unknown) {
    console.error('Erro ao listar movimentações:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar movimentações' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('session-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const session = await AuthService.getCurrentSession(token) as { user: UserWithPermissions }
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
    }

    const db = getDb()
    const data = await req.json()
    const validation = movementSchema.safeParse(data);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    const { date, description, amount, type, category } = validation.data;

    // Verificar se pode criar movimentações na categoria
    const mockMovement = { 
      id: '',
      date,
      description,
      amount,
      type,
      category,
      createdBy: session.user.id,
      createdAt: new Date().toISOString()
    }
    if (!AuthUtils.canManageMovement(session.user, mockMovement, 'create')) {
      return NextResponse.json({ error: 'Permissão negada para esta categoria' }, { status: 403 })
    }

    const id = Date.now().toString()
    const createdAt = new Date().toISOString()
    
    await db.prepare('INSERT INTO movements (id, date, description, amount, type, category, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, date, description, amount, type, category, session.user.id, createdAt)
    
    return NextResponse.json({ ok: true, id })
  } catch (error: unknown) {
    console.error('Erro ao criar movimentação:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao criar movimentação' }, { status: 500 })
  }
} 