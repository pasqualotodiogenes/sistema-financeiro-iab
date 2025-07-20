import Database from 'better-sqlite3'
import path from 'path'
import type { User, Category, Movement } from './types'

const dbPath = path.join(process.cwd(), 'iab_finance.db')
const db = new Database(dbPath)

// Configurações de performance
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('cache_size = 10000')
db.pragma('temp_store = MEMORY')

// Cache em memória para queries frequentes
const queryCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// Função para limpar cache expirado
const cleanupCache = () => {
  const now = Date.now()
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key)
    }
  }
}

// Executar limpeza a cada 10 minutos
setInterval(cleanupCache, 10 * 60 * 1000)

// Função para executar queries com cache
const cachedQuery = <T>(key: string, queryFn: () => T): T => {
  const cached = queryCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  
  const result = queryFn()
  queryCache.set(key, { data: result, timestamp: Date.now() })
  return result
}

// Invalidação de cache
const invalidateCache = (pattern: string) => {
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key)
    }
  }
}

// Queries otimizadas
export const optimizedQueries = {
  // Buscar usuário com permissões em uma query
  getUserWithPermissions: (userId: string) => {
    return db.prepare(`
      SELECT 
        u.*,
        up.canCreate, up.canEdit, up.canDelete, 
        up.canManageUsers, up.canViewReports, up.canManageCategories,
        GROUP_CONCAT(uc.categoryId) as categories
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.userId
      LEFT JOIN user_categories uc ON u.id = uc.userId
      WHERE u.id = ?
      GROUP BY u.id
    `).get(userId) as User
  },

  // Buscar sessão com usuário em uma query
  getSessionWithUser: (token: string) => {
    return db.prepare(`
      SELECT 
        s.*,
        u.username, u.password, u.role, u.name, u.email, u.createdAt, u.lastLogin,
        up.canCreate, up.canEdit, up.canDelete, 
        up.canManageUsers, up.canViewReports, up.canManageCategories,
        GROUP_CONCAT(uc.categoryId) as categories
      FROM sessions s
      JOIN users u ON s.userId = u.id
      LEFT JOIN user_permissions up ON u.id = up.userId
      LEFT JOIN user_categories uc ON u.id = uc.userId
      WHERE s.token = ? AND s.expiresAt > ?
      GROUP BY u.id
    `).get(token, new Date().toISOString()) as User
  },

  // Buscar movimentações com filtros otimizados
  getMovementsWithFilters: (filters: {
    category?: string
    type?: string
    startDate?: string
    endDate?: string
    userId?: string
    limit?: number
    offset?: number
  }) => {
    let query = `
      SELECT m.*, c.name as categoryName, u.name as createdByName
      FROM movements m
      LEFT JOIN categories c ON m.category = c.id
      LEFT JOIN users u ON m.createdBy = u.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (filters.category) {
      query += ' AND m.category = ?'
      params.push(filters.category)
    }
    if (filters.type) {
      query += ' AND m.type = ?'
      params.push(filters.type)
    }
    if (filters.startDate) {
      query += ' AND m.date >= ?'
      params.push(filters.startDate)
    }
    if (filters.endDate) {
      query += ' AND m.date <= ?'
      params.push(filters.endDate)
    }
    if (filters.userId) {
      query += ' AND m.createdBy = ?'
      params.push(filters.userId)
    }

    query += ' ORDER BY m.date DESC, m.createdAt DESC'

    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }
    if (filters.offset) {
      query += ' OFFSET ?'
      params.push(filters.offset)
    }

    return db.prepare(query).all(...params) as Movement[]
  },

  // Estatísticas otimizadas
  getDashboardStats: (userId?: string, categories?: string[]) => {
    let query = `
      SELECT 
        COUNT(*) as totalMovements,
        SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) as totalEntradas,
        SUM(CASE WHEN type = 'saida' THEN amount ELSE 0 END) as totalSaidas,
        COUNT(DISTINCT category) as uniqueCategories,
        COUNT(DISTINCT createdBy) as uniqueUsers
      FROM movements
      WHERE 1=1
    `
    const params: unknown[] = []

    if (userId) {
      query += ' AND createdBy = ?'
      params.push(userId)
    }
    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',')
      query += ` AND category IN (${placeholders})`
      params.push(...categories)
    }

    return db.prepare(query).get(...params) as {
      totalMovements: number
      totalEntradas: number
      totalSaidas: number
      uniqueCategories: number
      uniqueUsers: number
    }
  },

  // Buscar categorias com estatísticas
  getCategoriesWithStats: (userCategories?: string[]) => {
    let query = `
      SELECT 
        c.*,
        COUNT(m.id) as movementsCount,
        SUM(CASE WHEN m.type = 'entrada' THEN m.amount ELSE 0 END) as totalEntradas,
        SUM(CASE WHEN m.type = 'saida' THEN m.amount ELSE 0 END) as totalSaidas
      FROM categories c
      LEFT JOIN movements m ON c.id = m.category
    `

    const params: unknown[] = []
    if (userCategories && userCategories.length > 0) {
      const placeholders = userCategories.map(() => '?').join(',')
      query += ` WHERE c.id IN (${placeholders})`
      params.push(...userCategories)
    }

    query += ' GROUP BY c.id ORDER BY c.name'

    return db.prepare(query).all(...params) as Category[]
  }
}

// Funções de cache
export const cacheUtils = {
  get: <T>(key: string, queryFn: () => T): T => {
    return cachedQuery(key, queryFn)
  },

  invalidate: (pattern: string) => {
    invalidateCache(pattern)
  },

  clear: () => {
    queryCache.clear()
  }
}

// Criar índices para melhor performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(date);
  CREATE INDEX IF NOT EXISTS idx_movements_category ON movements(category);
  CREATE INDEX IF NOT EXISTS idx_movements_type ON movements(type);
  CREATE INDEX IF NOT EXISTS idx_movements_created_by ON movements(createdBy);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expiresAt);
  CREATE INDEX IF NOT EXISTS idx_user_categories_user ON user_categories(userId);
  CREATE INDEX IF NOT EXISTS idx_user_categories_category ON user_categories(categoryId);
`)

export { db } 