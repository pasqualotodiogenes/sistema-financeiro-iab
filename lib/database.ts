// 🪄 MAGIA AKITA: Troca automática entre SQLite local e Turso
// LOCAL (VPS):     USE_TURSO=false ou undefined
// TURSO (Vercel):  USE_TURSO=true + TURSO_DATABASE_URL + TURSO_AUTH_TOKEN

import { createClient } from '@libsql/client'
import Database from 'better-sqlite3'
import * as path from 'path'

const USE_TURSO = process.env.USE_TURSO === 'true'

let db: ReturnType<typeof createClient> | Database

if (USE_TURSO) {
  // 🌐 MODO TURSO (Vercel/Cloud)
  db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
  })
} else {
  // 💾 MODO SQLITE LOCAL (VPS/Desenvolvimento)
  const dbPath = path.join(process.cwd(), 'iab_finance.db')
  db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
}

// Schema SQL (funciona igual nos dois)
const schema = `
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
`

// 🪄 WRAPPER MÁGICO: Unifica APIs do SQLite e Turso
const dbWrapper = {
  // Método unificado para queries
  prepare: (sql: string) => {
    return {
      get: USE_TURSO 
        ? async (...params: unknown[]) => {
            const result = await (db as ReturnType<typeof createClient>).execute({ sql, args: params })
            return result.rows[0] || undefined
          }
        : (...params: unknown[]) => (db as Database).prepare(sql).get(...params),
      
      all: USE_TURSO
        ? async (...params: unknown[]) => {
            const result = await (db as ReturnType<typeof createClient>).execute({ sql, args: params })
            return result.rows
          }
        : (...params: unknown[]) => (db as Database).prepare(sql).all(...params),
      
      run: USE_TURSO
        ? async (...params: unknown[]) => {
            return await (db as ReturnType<typeof createClient>).execute({ sql, args: params })
          }
        : (...params: unknown[]) => (db as Database).prepare(sql).run(...params)
    }
  }
}

// Inicializar schema
if (USE_TURSO) {
  // Turso: execução assíncrona  
  await db.execute(schema)
} else {
  // SQLite: execução síncrona
  db.exec(schema)
}

// Exportar wrapper que funciona nos dois modos
export { dbWrapper as db } 