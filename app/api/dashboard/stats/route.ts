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

    // Calcular estatísticas por categoria
    const categoriesWithStats = categories.map((category: Category) => {
      const categoryMovements = movements.filter((m: Movement) => m.category === category.id)
      const categoryEntradas = categoryMovements
        .filter((m: Movement) => m.type === 'entrada')
        .reduce((sum: number, m: Movement) => sum + m.amount, 0)
      const categorySaidas = categoryMovements
        .filter((m: Movement) => m.type === 'saida')
        .reduce((sum: number, m: Movement) => sum + m.amount, 0)

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        slug: category.slug,
        isSystem: !!category.isSystem,
        isPublic: !!category.isPublic,
        totalEntradas: categoryEntradas,
        totalSaidas: categorySaidas,
        movementsCount: categoryMovements.length
      }
    })

    return NextResponse.json({
      totalEntradas,
      totalSaidas,
      totalMovements: movements.length,
      categories: categoriesWithStats
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 