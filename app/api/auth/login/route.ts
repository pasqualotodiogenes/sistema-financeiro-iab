import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for SQLite compatibility
export const runtime = 'nodejs'
import { db } from '@/lib/database'
import { AuthService } from '@/lib/auth'
import * as crypto from 'crypto'

export async function POST(req: NextRequest) {
  // Inicializar usuários padrão apenas quando API é chamada (não durante build)
  await AuthService.initializeUsers();
  const { username, password } = await req.json()
  
  if (username === 'visitante' && password === '') {
    // Usuário visitante (agora persiste a sessão no banco)
    const now = new Date()
    const user = {
      id: 'guest',
      username: 'visitante',
      password: '',
      role: 'viewer',
      name: 'Visitante',
      email: '',
      createdAt: now.toISOString(),
      permissions: {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canViewReports: true,
        canManageCategories: false,
        categories: ["cantinas", "missoes", "melhorias", "jovens", "eventos", "aquisicao"],
      },
    }
    const session = {
      user,
      token: 'guest-token-' + crypto.randomBytes(16).toString('hex'),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas
    }
    const { token, expiresAt, user: userSafe } = session
    
    // Garante que o usuário guest existe no banco
    const existingGuest = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id) as { id: string } | undefined
    if (!existingGuest) {
      db.prepare('INSERT INTO users (id, username, password, role, name, email, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(user.id, user.username, user.password, user.role, user.name, user.email, user.createdAt)
      db.prepare('INSERT INTO user_permissions (userId, canCreate, canEdit, canDelete, canManageUsers, canViewReports, canManageCategories) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(user.id, 0, 0, 0, 0, 1, 0)
      for (const categoryId of user.permissions.categories) {
        db.prepare('INSERT INTO user_categories (userId, categoryId) VALUES (?, ?)').run(user.id, categoryId)
      }
    }
    
    // Salvar sessão do visitante no banco
    db.prepare('INSERT OR REPLACE INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, user.id, expiresAt)
    
    const response = NextResponse.json({ token, expiresAt, user: userSafe })
    response.cookies.set('session-token', token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 2 * 60 * 60, // 2 horas
      secure: true,
    })
    return response
  }
  
  if (!username || !password) {
    return NextResponse.json({ error: 'Usuário e senha obrigatórios.' }, { status: 400 })
  }
  
  try {
    const session = await AuthService.authenticate(username, password)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }
    
    // Retornar token e dados do usuário (sem senha)
    const { token, expiresAt, user } = session
    const { password: userPassword, ...userSafe } = user
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _password = userPassword
    
    // Cookie seguro HTTPOnly
    const response = NextResponse.json({ token, expiresAt, user: userSafe })
    response.cookies.set('session-token', token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 dia
      secure: true,
    })
    return response
  } catch (err) {
    console.error('Erro no login:', err)
    return NextResponse.json({ error: 'Erro interno no login.' }, { status: 500 })
  }
} 