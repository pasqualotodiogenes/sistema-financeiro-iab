import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { AuthService } from '@/lib/auth'
import { Category } from '@/lib/types'

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { params } = context;
  const slug = (await params).slug;
  
  // Validar slug antes de prosseguir
  if (!slug || slug === 'null' || slug === 'undefined') {
    return NextResponse.json({ error: 'Slug de categoria inválido.' }, { status: 400 })
  }
  
  const token = req.cookies.get('session-token')?.value
  let session = null
  if (token) {
    session = AuthService.getCurrentSession(token)
  }
  const user = session?.user || null

<<<<<<< HEAD
  const db = getDb()
  const category = await db.prepare('SELECT * FROM categories WHERE lower(slug) = lower(?)').get(slug) as Category | undefined
=======
  const category = db.prepare('SELECT * FROM categories WHERE lower(slug) = lower(?)').get(slug) as Category | undefined
>>>>>>> 8c7ee621e6097d5d86f5297726a3fafed9a905c4
  if (!category) return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 })

  // Se não autenticado, só permitir acesso a categorias públicas ou fixas
  if (!user && !(category.isPublic || category.isSystem)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const response = NextResponse.json({ ...category, isSystem: !!category.isSystem, isPublic: !!category.isPublic })
  
  // Headers de segurança para cache
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  
  return response
} 