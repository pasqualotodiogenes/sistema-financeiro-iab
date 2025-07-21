import { db as getDb } from './database'
import { User, Permission } from './types'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'

export interface AuthSession {
  user: User
  token: string
  expiresAt: string
}

const DEFAULT_USERS: User[] = [
  {
    id: "1",
    username: process.env.DEFAULT_ROOT_USERNAME || "root",
    password: process.env.DEFAULT_ROOT_PASSWORD,
    role: "root",
    name: "Administrador Root",
    email: "root@iabigrejinha.com",
    createdAt: new Date().toISOString(),
    permissions: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManageUsers: true,
      canViewReports: true,
      canManageCategories: true,
      categories: ["cantinas", "missoes", "melhorias", "jovens", "eventos", "aquisicao"],
    },
  },
]

const sanitize = (text: string) => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export class AuthService {
  static async initializeUsers(): Promise<void> {
    if (!process.env.DEFAULT_ROOT_PASSWORD) {
      throw new Error("A variável de ambiente DEFAULT_ROOT_PASSWORD deve ser definida.")
    }
    
    const db = await getDb()
    // Verifica se cada usuário padrão já existe antes de tentar criar
    for (const user of DEFAULT_USERS) {
      const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').get(user.username) as { id: string } | undefined
      if (!existingUser) {
        await this.createUserFromDefault(user)
      }
    }
  }

  private static async createUserFromDefault(defaultUser: User): Promise<void> {
    const db = await getDb()
    const hashedPassword = await bcrypt.hash(defaultUser.password || '', 10)
    await db.prepare('INSERT INTO users (id, username, password, role, name, email, createdAt, lastLogin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(defaultUser.id, defaultUser.username, hashedPassword, defaultUser.role, defaultUser.name, defaultUser.email, defaultUser.createdAt, defaultUser.lastLogin || null)
    await db.prepare('INSERT INTO user_permissions (userId, canCreate, canEdit, canDelete, canManageUsers, canViewReports, canManageCategories) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(defaultUser.id, defaultUser.permissions.canCreate ? 1 : 0, defaultUser.permissions.canEdit ? 1 : 0, defaultUser.permissions.canDelete ? 1 : 0, defaultUser.permissions.canManageUsers ? 1 : 0, defaultUser.permissions.canViewReports ? 1 : 0, defaultUser.permissions.canManageCategories ? 1 : 0)
    for (const categoryId of defaultUser.permissions.categories) {
      await db.prepare('INSERT INTO user_categories (userId, categoryId) VALUES (?, ?)').run(defaultUser.id, categoryId)
    }
  }

  static async getUsers(): Promise<User[]> {
    const db = await getDb()
    const query = `
      SELECT
        u.id, u.username, u.role, u.name, u.email, u.createdAt, u.lastLogin,
        p.canCreate, p.canEdit, p.canDelete, p.canManageUsers, p.canViewReports, p.canManageCategories,
        GROUP_CONCAT(uc.categoryId) as categories,
        a.data as avatarUrl
      FROM users u
      LEFT JOIN user_permissions p ON u.id = p.userId
      LEFT JOIN user_categories uc ON u.id = uc.userId
      LEFT JOIN avatars a ON u.id = a.userId AND a.type = 'upload'
      GROUP BY u.id
      ORDER BY u.name
    `;

    const rows = await db.prepare(query).all() as Array<Record<string, unknown>>;

    return rows.map(row => ({
      id: String(row.id),
      username: String(row.username),
      role: row.role as 'root' | 'admin' | 'editor' | 'viewer',
      name: row.name ? String(row.name) : undefined,
      email: row.email ? String(row.email) : undefined,
      createdAt: row.createdAt ? String(row.createdAt) : undefined,
      lastLogin: row.lastLogin ? String(row.lastLogin) : undefined,
      permissions: {
        canCreate: !!row.canCreate,
        canEdit: !!row.canEdit,
        canDelete: !!row.canDelete,
        canManageUsers: !!row.canManageUsers,
        canViewReports: !!row.canViewReports,
        canManageCategories: !!row.canManageCategories,
        categories: row.categories ? String(row.categories).split(',') : []
      },
      avatarUrl: row.avatarUrl ? String(row.avatarUrl) : null
    }));
  }

  static async authenticate(username: string, password: string): Promise<AuthSession | null> {
    try {
      const db = await getDb()
      const user = await db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User
      if (user) {
        const isValid = await bcrypt.compare(password, user.password || '')
        if (isValid) {
        const permissions = await db.prepare('SELECT * FROM user_permissions WHERE userId = ?').get(user.id) as Permission
        const categories = await db.prepare('SELECT categoryId FROM user_categories WHERE userId = ?').all(user.id) as { categoryId: string }[]
        const userWithPermissions: User = {
          ...user,
          permissions: {
            canCreate: Boolean(permissions?.canCreate),
            canEdit: Boolean(permissions?.canEdit),
            canDelete: Boolean(permissions?.canDelete),
            canManageUsers: Boolean(permissions?.canManageUsers),
            canViewReports: Boolean(permissions?.canViewReports),
            canManageCategories: Boolean(permissions?.canManageCategories),
            categories: Array.isArray(categories) ? categories.map(c => c.categoryId) : []
          }
        }
        await db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?').run(new Date().toISOString(), user.id)
        const session: AuthSession = {
          user: { ...userWithPermissions, lastLogin: new Date().toISOString() },
          token: this.generateToken(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }
        await db.prepare('INSERT OR REPLACE INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)').run(session.token, user.id, session.expiresAt)
        return session
      }
    }
    } catch (err) {
      console.error('Erro na autenticação:', err)
    }
    return null;
  }

  static async getCurrentSession(tokenFromRequest: string): Promise<AuthSession | null> {
    try {
      const db = await getDb()
      const token = tokenFromRequest;
      if (!token) {
        return null;
      }
      const sessionData = await db.prepare('SELECT s.token, s.expiresAt, u.id, u.username, u.role, u.name, u.email, u.createdAt, u.lastLogin FROM sessions s JOIN users u ON s.userId = u.id WHERE s.token = ? AND s.expiresAt > ?').get(token, new Date().toISOString()) as {
        token: string;
        expiresAt: string;
        id: string;
        username: string;
        role: string;
        name: string;
        email: string;
        createdAt: string;
        lastLogin: string | null;
      } | undefined;
      if (sessionData) {
        const permissions = await db.prepare('SELECT * FROM user_permissions WHERE userId = ?').get(sessionData.id) as Permission;
        const categories = await db.prepare('SELECT categoryId FROM user_categories WHERE userId = ?').all(sessionData.id) as { categoryId: string }[];
        let categoriesIds: string[] = Array.isArray(categories) ? categories.map(c => c.categoryId) : [];
        
        // Corrigir lógica para viewers: eles devem ter acesso a categorias públicas/sistema
        if (sessionData.role === 'viewer') {
          const publicAndSystemCategories = await db.prepare('SELECT id FROM categories WHERE isSystem = 1 OR isPublic = 1').all() as { id: string }[];
          categoriesIds = publicAndSystemCategories.map(c => c.id);
        }
        const user: User = {
          id: sessionData.id,
          username: sessionData.username,
          role: sessionData.role as 'root' | 'admin' | 'editor' | 'viewer',
          name: sessionData.name || undefined,
          email: sessionData.email || undefined,
          createdAt: sessionData.createdAt || undefined,
          lastLogin: sessionData.lastLogin || undefined,
          permissions: {
            canCreate: Boolean(permissions && permissions.canCreate),
            canEdit: Boolean(permissions && permissions.canEdit),
            canDelete: Boolean(permissions && permissions.canDelete),
            canManageUsers: Boolean(permissions && permissions.canManageUsers),
            canViewReports: Boolean(permissions && permissions.canViewReports),
            canManageCategories: Boolean(permissions && permissions.canManageCategories),
            categories: categoriesIds
          }
        };
        // Sobrescrever permissões para root/admin e forçar permissões de viewer
        if (user.role === 'root' || user.role === 'admin') {
          user.permissions = {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canManageUsers: user.role === 'root',
            canViewReports: true,
            canManageCategories: true,
            categories: ["cantinas", "missoes", "melhorias", "jovens", "eventos", "aquisicao"],
          }
        } else if (user.role === 'viewer') {
          // Forçar permissões corretas para viewer
          user.permissions = {
            ...user.permissions,
            categories: categoriesIds, // Garantir que as categorias são atribuídas
          }
        }
        return {
          user,
          token: sessionData.token as string,
          expiresAt: sessionData.expiresAt as string
        };
      }
    } catch (err) {
      console.error('Erro ao obter sessão:', err)
    }
    return null;
  }

  static async logout(token?: string): Promise<void> {
    if (token) {
      const db = await getDb()
      await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }
  }

  static async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const db = await getDb()
    const sanitizedUsername = sanitize(userData.username)
    const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').get(sanitizedUsername) as { id: string } | undefined
    if (existingUser) {
      throw new Error("Nome de usuário já existe")
    }
    const id = Date.now().toString()
    const createdAt = new Date().toISOString()
    const hashedPassword = await bcrypt.hash(userData.password || '', 10)
    const sanitizedName = sanitize(userData.name || '')
    const sanitizedEmail = userData.email ? sanitize(userData.email) : ''
    
    await db.prepare('INSERT INTO users (id, username, password, role, name, email, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, sanitizedUsername, hashedPassword, userData.role, sanitizedName, sanitizedEmail, createdAt)
    await db.prepare('INSERT INTO user_permissions (userId, canCreate, canEdit, canDelete, canManageUsers, canViewReports, canManageCategories) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, userData.permissions.canCreate ? 1 : 0, userData.permissions.canEdit ? 1 : 0, userData.permissions.canDelete ? 1 : 0, userData.permissions.canManageUsers ? 1 : 0, userData.permissions.canViewReports ? 1 : 0, userData.permissions.canManageCategories ? 1 : 0)
    for (const categoryId of userData.permissions.categories) {
      await db.prepare('INSERT INTO user_categories (userId, categoryId) VALUES (?, ?)').run(id, categoryId)
    }
    return { ...userData, id, createdAt, username: sanitizedUsername, name: sanitizedName }
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<boolean> {
    const db = await getDb()
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User
    if (!user) return false

    const sanitizedUsername = userData.username ? sanitize(userData.username) : undefined
    if (sanitizedUsername && sanitizedUsername !== user.username) {
      const existingUser = await db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(sanitizedUsername, userId) as { id: string } | undefined
      if (existingUser) {
          throw new Error("Nome de usuário já existe")
        }
      }

    const sanitizedName = userData.name ? sanitize(userData.name) : undefined
    const sanitizedEmail = userData.email ? sanitize(userData.email) : undefined

    if (sanitizedUsername || userData.password || sanitizedName || sanitizedEmail || userData.role) {
      const updates = []
      const values = []
      if (sanitizedUsername) { updates.push('username = ?'); values.push(sanitizedUsername) }
      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        updates.push('password = ?'); values.push(hashedPassword)
      }
      if (sanitizedName) { updates.push('name = ?'); values.push(sanitizedName) }
      if (sanitizedEmail) { updates.push('email = ?'); values.push(sanitizedEmail) }
      if (userData.role) { updates.push('role = ?'); values.push(userData.role) }
      values.push(userId)
      await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }
    if (userData.permissions) {
      await db.prepare('UPDATE user_permissions SET canCreate = ?, canEdit = ?, canDelete = ?, canManageUsers = ?, canViewReports = ?, canManageCategories = ? WHERE userId = ?')
        .run(userData.permissions.canCreate ? 1 : 0, userData.permissions.canEdit ? 1 : 0, userData.permissions.canDelete ? 1 : 0, userData.permissions.canManageUsers ? 1 : 0, userData.permissions.canViewReports ? 1 : 0, userData.permissions.canManageCategories ? 1 : 0, userId)
      await db.prepare('DELETE FROM user_categories WHERE userId = ?').run(userId)
      for (const categoryId of userData.permissions.categories) {
        await db.prepare('INSERT INTO user_categories (userId, categoryId) VALUES (?, ?)').run(userId, categoryId)
      }
    }
    return true
  }

  static async deleteUser(userId: string): Promise<boolean> {
    const db = await getDb()
    const user = await db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined
    if (user?.role === "root") {
      throw new Error("Não é possível excluir usuários root")
    }
    const result = await db.prepare('DELETE FROM users WHERE id = ?').run(userId)
    return result.changes > 0
  }

  static hasPermission(permission: keyof User["permissions"], category?: string, tokenFromRequest?: string): boolean {
    const session = this.getCurrentSession(tokenFromRequest || "");
    if (!session) return false;
    const { user } = session;
    const hasGeneralPermission = user.permissions[permission];
    if (
      category &&
      permission !== "canManageUsers" &&
      permission !== "canViewReports" &&
      permission !== "canManageCategories"
    ) {
      return (
        !!hasGeneralPermission &&
        Array.isArray(user.permissions.categories) &&
        user.permissions.categories.includes(category)
      );
    }
    return !!hasGeneralPermission;
  }

  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static getRolePermissions(role: User["role"]): User["permissions"] {
    switch (role) {
      case "root":
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canManageUsers: true,
          canViewReports: true,
          canManageCategories: true,
          categories: ["cantinas", "missoes", "melhorias", "jovens", "eventos", "aquisicao"],
        }
      case "admin":
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canManageUsers: false,
          canViewReports: true,
          canManageCategories: true,
          categories: ["cantinas", "missoes", "melhorias", "jovens", "eventos", "aquisicao"],
        }
      case "editor":
        return {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canManageUsers: false,
          canViewReports: true,
          canManageCategories: false,
          categories: [],
        }
      case "viewer":
        return {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canManageUsers: false,
          canViewReports: true,
          canManageCategories: false,
          categories: [],
        }
    }
  }

  static async resetDatabase(): Promise<void> {
    const db = await getDb()
    await db.prepare('DELETE FROM sessions').run()
    await db.prepare('DELETE FROM user_categories').run()
    await db.prepare('DELETE FROM user_permissions').run()
    await db.prepare('DELETE FROM users').run()
    await db.prepare('DELETE FROM movements').run()
    await db.prepare('DELETE FROM categories').run()
    await db.prepare('DELETE FROM avatars').run()
    await this.initializeUsers()
  }
}
