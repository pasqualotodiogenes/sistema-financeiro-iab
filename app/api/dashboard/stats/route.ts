import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { AuthService } from '@/lib/auth'
import type { Movement, Category } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('session-token')?.value
    let session = null
    if (token) {
      session = AuthService.getCurrentSession(token)
    }
    const user = session?.user || { role: 'viewer', permissions: { categories: [] } }

    // Buscar estatísticas gerais
    let movementsQuery = 'SELECT * FROM movements'
    let categoriesQuery = 'SELECT * FROM categories ORDER BY name'
    
    if (user.role === 'viewer') {
      categoriesQuery = 'SELECT * FROM categories WHERE isSystem = 1 OR isPublic = 1 ORDER BY name'
      movementsQuery = 'SELECT * FROM movements WHERE category IN (SELECT id FROM categories WHERE isSystem = 1 OR isPublic = 1)'
    } else if (user.role !== 'root' && user.role !== 'admin') {
      const categoryPlaceholders = user.permissions.categories.map(() => '?').join(',')
      movementsQuery = `SELECT * FROM movements WHERE category IN (${categoryPlaceholders})`
      categoriesQuery = `SELECT * FROM categories WHERE id IN (${categoryPlaceholders}) ORDER BY name`
    }

    let movements: Movement[] = []
    let categories: Category[] = []
    if (user.role === 'viewer' || user.role === 'root' || user.role === 'admin') {
      movements = db().prepare(movementsQuery).all() as Movement[]
      categories = db().prepare(categoriesQuery).all() as Category[]
    } else {
      movements = db().prepare(movementsQuery).all(...user.permissions.categories) as Movement[]
      categories = db().prepare(categoriesQuery).all(...user.permissions.categories) as Category[]
    }

    // Calcular totais gerais
    const totalEntradas = movements
      .filter((m: Movement) => m.type === 'entrada')
      .reduce((sum: number, m: Movement) => sum + m.amount, 0)

    const totalSaidas = movements
      .filter((m: Movement) => m.type === 'saida')
      .reduce((sum: number, m: Movement) => sum + m.amount, 0)

    // Otimizado: Calcular estatísticas por categoria usando SQL agregado (evita problema N+1)
    let statsQuery = `
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        c.slug,
        c.isSystem,
        c.isPublic,
        COALESCE(SUM(CASE WHEN m.type = 'entrada' THEN m.amount ELSE 0 END), 0) as totalEntradas,
        COALESCE(SUM(CASE WHEN m.type = 'saida' THEN m.amount ELSE 0 END), 0) as totalSaidas,
        COALESCE(COUNT(m.id), 0) as movementsCount
      FROM categories c
      LEFT JOIN movements m ON c.id = m.category
    `

    // Aplicar filtros baseados no role do usuário
    if (user.role === 'viewer') {
      statsQuery += ' WHERE c.isSystem = 1 OR c.isPublic = 1'
    } else if (user.role !== 'root' && user.role !== 'admin') {
      const categoryPlaceholders = user.permissions.categories.map(() => '?').join(',')
      statsQuery += ` WHERE c.id IN (${categoryPlaceholders})`
    }

    statsQuery += ' GROUP BY c.id, c.name, c.icon, c.color, c.slug, c.isSystem, c.isPublic ORDER BY c.name'

    let categoriesWithStats
    if (user.role === 'viewer' || user.role === 'root' || user.role === 'admin') {
      categoriesWithStats = db().prepare(statsQuery).all()
    } else {
      categoriesWithStats = db().prepare(statsQuery).all(...user.permissions.categories)
    }

    // Converter para o formato esperado
    const processedCategories = categoriesWithStats.map((row: any) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      slug: row.slug,
      isSystem: !!row.isSystem,
      isPublic: !!row.isPublic,
      totalEntradas: row.totalEntradas,
      totalSaidas: row.totalSaidas,
      movementsCount: row.movementsCount
    }))

    return NextResponse.json({
      totalEntradas,
      totalSaidas,
      totalMovements: movements.length,
      categories: processedCategories
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 