import { NextRequest, NextResponse } from 'next/server'
import { db as getDb } from '@/lib/database'
import { AuthService } from '@/lib/auth'
import { AuthUtils } from '@/lib/auth-utils'
import { DataStorage } from '@/lib/data-storage'
import type { Category } from '@/lib/types'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").max(50, "O nome deve ter no máximo 50 caracteres."),
  icon: z.string().min(1, "O ícone é obrigatório."),
  color: z.string().min(1, "A cor é obrigatória."),
  isPublic: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Garante seed das categorias fixas
    DataStorage.initializeDefaultData()

    // Verificar autenticação
    const token = req.cookies.get('session-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const session = await AuthService.getCurrentSession(token)
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
    }

    const db = await getDb()
    // Listar categorias com base nas permissões do usuário
    const allCategories = (await db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[]).map((cat) => {
      return {
        ...cat,
        isSystem: !!cat.isSystem,
        isPublic: !!cat.isPublic,
      }
    })
    
    const accessibleCategories = AuthUtils.getAccessibleCategories(session.user, allCategories)
    
    const response = NextResponse.json(accessibleCategories)
    
    // Headers de segurança para cache
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    
    return response
  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('session-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const session = await AuthService.getCurrentSession(token)
    if (!session || !AuthUtils.canCreateCategory(session.user)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
    }

    const db = await getDb()

    const data = await req.json()
    const validation = categorySchema.safeParse(data);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    const { name, icon, color, isPublic } = validation.data;

    // Gerar slug único
    function slugify(str: string) {
      return str
        .normalize('NFD')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    }
    const baseSlug = slugify(name)
    let slug = baseSlug
    let i = 1
    while (await db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(slug)) {
      slug = `${baseSlug}-${i++}`
    }

    const id = Date.now().toString()
    await db.prepare('INSERT INTO categories (id, name, icon, color, isSystem, isPublic, slug) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, icon, color, 0, isPublic ? 1 : 0, slug)
    
    return NextResponse.json({ ok: true, id, slug })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 