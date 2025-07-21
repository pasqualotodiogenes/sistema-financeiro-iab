// 🚀 TURSO IMPLEMENTATION - LAZY INITIALIZATION WITH DEBUG LOGS
const USE_TURSO = process.env.USE_TURSO === 'true'

let db: any
let isInitialized = false

// 🔍 DEBUG: Log configuration
console.log('🔧 DATABASE CONFIG:', {
  USE_TURSO,
  TURSO_URL: process.env.TURSO_DATABASE_URL ? 'SET ✅' : 'MISSING ❌',
  TURSO_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET ✅' : 'MISSING ❌'
})

async function initializeDatabase() {
  if (isInitialized) return
  
  console.log('🚀 Initializing database...', { USE_TURSO })
  
  if (USE_TURSO) {
    try {
      console.log('📡 Creating Turso client...')
      // @ts-ignore
      const { createClient } = require('@libsql/client')
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
      })
      
      console.log('🔧 Setting up Turso wrapper...')
      db = {
        prepare: (sql: string) => ({
          // @ts-ignore
          get: async (...params: any[]) => {
            const result = await client.execute({ sql, args: params })
            return result.rows[0] || undefined
          },
          // @ts-ignore
          all: async (...params: any[]) => {
            const result = await client.execute({ sql, args: params })
            return result.rows
          },
          // @ts-ignore
          run: async (...params: any[]) => {
            const result = await client.execute({ sql, args: params })
            return { changes: result.rowsAffected, lastInsertRowid: result.lastInsertRowid }
          }
        })
      }
      
      console.log('📋 Creating Turso schema...')
      // Initialize schema - TURSO REQUIRES INDIVIDUAL STATEMENTS
      const schemas = [
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('root', 'admin', 'editor', 'viewer')),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          lastLogin TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS user_permissions (
          userId TEXT PRIMARY KEY,
          canCreate BOOLEAN NOT NULL DEFAULT 0,
          canEdit BOOLEAN NOT NULL DEFAULT 0,
          canDelete BOOLEAN NOT NULL DEFAULT 0,
          canManageUsers BOOLEAN NOT NULL DEFAULT 0,
          canViewReports BOOLEAN NOT NULL DEFAULT 0,
          canManageCategories BOOLEAN NOT NULL DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS user_categories (
          userId TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          PRIMARY KEY (userId, categoryId),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          isSystem BOOLEAN NOT NULL DEFAULT 0,
          isPublic BOOLEAN NOT NULL DEFAULT 0,
          slug TEXT
        )`,
        `CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`,
        `CREATE TABLE IF NOT EXISTS movements (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
          category TEXT NOT NULL,
          createdBy TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (category) REFERENCES categories(id) ON DELETE CASCADE,
          FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS avatars (
          userId TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('upload', 'initials', 'icon')),
          data TEXT NOT NULL,
          backgroundColor TEXT,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          expiresAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`
      ]
      
      for (let i = 0; i < schemas.length; i++) {
        console.log(`📋 Creating table ${i + 1}/${schemas.length}...`)
        await client.execute(schemas[i])
      }
      
      console.log('✅ Turso database initialized successfully!')
      
    } catch (error) {
      console.error('❌ Turso initialization failed:', error)
      throw error
    }
    
  } else {
    console.log('💾 Using local SQLite...')
    // @ts-ignore  
    const Database = require('better-sqlite3')
    // @ts-ignore
    const path = require('path')
    
    const dbPath = path.join(process.cwd(), 'iab_finance.db')
    db = new Database(dbPath)
    db.pragma('foreign_keys = ON')
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('root', 'admin', 'editor', 'viewer')),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        lastLogin TEXT
      );
      CREATE TABLE IF NOT EXISTS user_permissions (
        userId TEXT PRIMARY KEY,
        canCreate BOOLEAN NOT NULL DEFAULT 0,
        canEdit BOOLEAN NOT NULL DEFAULT 0,
        canDelete BOOLEAN NOT NULL DEFAULT 0,
        canManageUsers BOOLEAN NOT NULL DEFAULT 0,
        canViewReports BOOLEAN NOT NULL DEFAULT 0,
        canManageCategories BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS user_categories (
        userId TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        PRIMARY KEY (userId, categoryId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        isSystem BOOLEAN NOT NULL DEFAULT 0,
        isPublic BOOLEAN NOT NULL DEFAULT 0,
        slug TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
      CREATE TABLE IF NOT EXISTS movements (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
        category TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (category) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS avatars (
        userId TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('upload', 'initials', 'icon')),
        data TEXT NOT NULL,
        backgroundColor TEXT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `)
    console.log('✅ SQLite database initialized successfully!')
  }
  
  isInitialized = true
}

// Wrapper to ensure initialization
const getDb = async () => {
  await initializeDatabase()
  return db
}

export { getDb as db } 