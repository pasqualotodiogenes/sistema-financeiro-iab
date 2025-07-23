import { db as getDb } from './database'

export interface Movement {
  id: string
  date: string
  description: string
  amount: number
  type: "entrada" | "saida"
  category: string
  createdBy: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isSystem: boolean
  isPublic: boolean
}

export const FIXED_CATEGORIES: Category[] = [
  { id: "cantinas", name: "Cantinas", icon: "Coffee", color: "amber", isSystem: true, isPublic: false },
  { id: "missoes", name: "Missões", icon: "Heart", color: "red", isSystem: true, isPublic: false },
  { id: "melhorias", name: "Melhorias", icon: "Wrench", color: "blue", isSystem: true, isPublic: false },
  { id: "jovens", name: "Jovens", icon: "Users", color: "green", isSystem: true, isPublic: false },
  { id: "eventos", name: "Eventos Especiais", icon: "Calendar", color: "purple", isSystem: true, isPublic: false },
  { id: "aquisicao", name: "Aquisição", icon: "ShoppingCart", color: "orange", isSystem: true, isPublic: false },
]

export class DataStorage {
  static initializeDefaultData(): void {
    // Garante que as categorias fixas existam; não remove personalizadas
    const db = getDb()
    for (const category of FIXED_CATEGORIES) {
      const exists = db.prepare('SELECT 1 FROM categories WHERE id = ?').get(category.id) as { 1: number } | undefined
      if (!exists) {
        db.prepare('INSERT INTO categories (id, name, icon, color, isSystem, isPublic) VALUES (?, ?, ?, ?, 1, ?)')
          .run(category.id, category.name, category.icon, category.color, category.isPublic ? 1 : 0)
      } else {
        // Atualiza o campo isPublic para garantir consistência
        db.prepare('UPDATE categories SET isPublic = ? WHERE id = ?')
          .run(category.isPublic ? 1 : 0, category.id)
      }
    }
    // Só inserir movimentações padrão se root e categorias fixas existirem e não houver nenhuma movimentação
    const rootUser = db.prepare('SELECT id FROM users WHERE username = ?').get('root') as { id: string } | undefined
    const categoriesOk = FIXED_CATEGORIES.every(cat => db.prepare('SELECT 1 FROM categories WHERE id = ?').get(cat.id) as { 1: number } | undefined)
    const movementsCount = db.prepare('SELECT COUNT(*) as count FROM movements').get() as { count: number }
    if (rootUser && categoriesOk && movementsCount.count === 0) {
      try {
        const rootId = rootUser.id as string
        const defaultMovements: Movement[] = [
          { id: "1", date: "2024-01-14", description: "Venda de lanches - evento domingo", amount: 150.0, type: "entrada", category: "cantinas", createdBy: rootId, createdAt: new Date().toISOString() },
          { id: "2", date: "2024-01-15", description: "Compra de ingredientes", amount: 80.0, type: "saida", category: "cantinas", createdBy: rootId, createdAt: new Date().toISOString() },
          { id: "3", date: "2024-06-28", description: "Entradas culto especial", amount: 450.0, type: "entrada", category: "cantinas", createdBy: rootId, createdAt: new Date().toISOString() },
        ]
        const insertMovement = db.prepare('INSERT INTO movements (id, date, description, amount, type, category, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        for (const movement of defaultMovements) {
          insertMovement.run(movement.id, movement.date, movement.description, movement.amount, movement.type, movement.category, movement.createdBy, movement.createdAt)
        }
      } catch (err) {
        console.error('Erro ao inserir movimentações padrão:', err)
      }
    }
  }

  static getMovements(): Movement[] {
    const db = getDb()
    return db.prepare('SELECT * FROM movements ORDER BY date DESC, createdAt DESC').all() as Movement[]
  }

  static addMovement(movement: Omit<Movement, "id" | "createdAt">): Movement {
    const db = getDb()
    const id = Date.now().toString()
    const createdAt = new Date().toISOString()
    db.prepare('INSERT INTO movements (id, date, description, amount, type, category, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, movement.date, movement.description, movement.amount, movement.type, movement.category, movement.createdBy, createdAt)
    return { ...movement, id, createdAt }
  }

  static updateMovement(id: string, updates: Partial<Movement>): boolean {
    const db = getDb()
    const movement = db.prepare('SELECT * FROM movements WHERE id = ?').get(id) as Movement | undefined
    if (!movement) return false
    const updatedMovement = { ...movement, ...updates }
    db.prepare('UPDATE movements SET date = ?, description = ?, amount = ?, type = ?, category = ?, createdBy = ? WHERE id = ?')
      .run(updatedMovement.date, updatedMovement.description, updatedMovement.amount, updatedMovement.type, updatedMovement.category, updatedMovement.createdBy, id)
      return true
  }

  static deleteMovement(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM movements WHERE id = ?').run(id)
    return result.changes > 0
  }

  static getCategories(): Category[] {
    const db = getDb()
    // Sempre retorna as fixas + personalizadas
    const dbCategories = db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[]
    // Garante que as fixas estejam presentes e ordenadas primeiro
    const fixed = FIXED_CATEGORIES.map(f => dbCategories.find(c => c.id === f.id) || f)
    const custom = dbCategories.filter(c => !FIXED_CATEGORIES.some(f => f.id === c.id))
    return [...fixed, ...custom]
  }

  static addCategory(category: Omit<Category, "id">, userRole: string): Category {
    if (category.isSystem) throw new Error("Não é permitido criar categorias fixas pelo app")
    if (userRole !== "root") throw new Error("Apenas root pode criar categorias personalizadas")
    const id = Date.now().toString()
    db.prepare('INSERT INTO categories (id, name, icon, color, isSystem, isPublic) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, category.name, category.icon, category.color, category.isSystem ? 1 : 0, category.isPublic ? 1 : 0)
    return { ...category, id }
  }

  static updateCategory(id: string, updates: Partial<Category>, userRole: string): boolean {
    if (FIXED_CATEGORIES.some(c => c.id === id)) throw new Error("Não é permitido editar categorias fixas")
    if (userRole !== "root") throw new Error("Apenas root pode editar categorias personalizadas")
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
    if (!category) return false
    const updatedCategory = { ...category, ...updates }
    db.prepare('UPDATE categories SET name = ?, icon = ?, color = ?, isSystem = ?, isPublic = ? WHERE id = ?')
      .run(updatedCategory.name, updatedCategory.icon, updatedCategory.color, updatedCategory.isSystem ? 1 : 0, updatedCategory.isPublic ? 1 : 0, id)
    return true
  }

  static deleteCategory(id: string, userRole: string): boolean {
    if (FIXED_CATEGORIES.some(c => c.id === id)) throw new Error("Não é permitido excluir categorias fixas")
    if (userRole !== "root") throw new Error("Apenas root pode excluir categorias personalizadas")
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined
    if (category?.isSystem) throw new Error("Não é possível excluir categorias do sistema")
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    if (result.changes > 0) {
      db.prepare('DELETE FROM movements WHERE category = ?').run(id)
      return true
    }
    return false
  }

  static getMovementsByCategory(categoryId: string): Movement[] {
    return db.prepare('SELECT * FROM movements WHERE category = ? ORDER BY date DESC, createdAt DESC').all(categoryId) as Movement[]
  }

  static getMovementsByDateRange(startDate: string, endDate: string): Movement[] {
    return db.prepare('SELECT * FROM movements WHERE date >= ? AND date <= ? ORDER BY date DESC, createdAt DESC').all(startDate, endDate) as Movement[]
  }

  static getMovementsByYearMonth(year: number, month?: number): Movement[] {
    if (month) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`
      return db.prepare('SELECT * FROM movements WHERE date >= ? AND date <= ? ORDER BY date DESC, createdAt DESC').all(startDate, endDate) as Movement[]
    } else {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      return db.prepare('SELECT * FROM movements WHERE date >= ? AND date <= ? ORDER BY date DESC, createdAt DESC').all(startDate, endDate) as Movement[]
    }
  }

  static filterMovementsByDate(movements: Movement[], selectedYear?: number, selectedMonth?: number): Movement[] {
    if (!selectedYear && !selectedMonth) return movements
    return movements.filter((m) => {
      const movementDate = new Date(m.date)
      const movementYear = movementDate.getFullYear()
      const movementMonth = movementDate.getMonth() + 1
      if (selectedYear && selectedMonth) return movementYear === selectedYear && movementMonth === selectedMonth
      else if (selectedYear) return movementYear === selectedYear
      return true
    })
  }

  static getAvailableYears(categoryId: string): number[] {
    const years = db.prepare('SELECT DISTINCT strftime("%Y", date) as year FROM movements WHERE category = ? ORDER BY year DESC').all(categoryId) as { year: string }[]
    return years.map(y => parseInt(y.year)).filter(y => !isNaN(y))
  }
}
