import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;
let isInitialized = false;

function initializeDatabase() {
  if (isInitialized) {
    return;
  }

  console.log('💾 Initializing local SQLite database...');

  // Render: usa disk persistente (/data) | Local: usa project root
  const basePath = process.env.RENDER_DISK_MOUNT_PATH || process.cwd();
  const dbPath = path.join(basePath, 'iab_finance.db');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

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
    CREATE TABLE IF NOT EXISTS church_profile (
      id TEXT PRIMARY KEY,
      image TEXT,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);

  // Corrigir slugs das categorias do sistema (executa apenas uma vez)
  const updateSlugs = db.prepare('UPDATE categories SET slug = ? WHERE id = ? AND slug IS NULL');
  const systemCategories = [
    { id: 'aquisicao', slug: 'aquisicao' },
    { id: 'cantinas', slug: 'cantinas' },  
    { id: 'eventos', slug: 'eventos' },
    { id: 'jovens', slug: 'jovens' },
    { id: 'melhorias', slug: 'melhorias' },
    { id: 'missoes', slug: 'missoes' }
  ];
  
  systemCategories.forEach(({ id, slug }) => {
    const result = updateSlugs.run(slug, id);
    if (result.changes > 0) {
      console.log(`🔧 Fixed slug for ${id} → ${slug}`);
    }
  });

  console.log('✅ SQLite database initialized successfully!');
  isInitialized = true;
}

function getDb() {
  if (!isInitialized) {
    initializeDatabase();
  }
  return db;
}

export { getDb as db };