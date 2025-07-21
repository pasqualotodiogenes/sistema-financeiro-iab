import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { cookies } from "next/headers"
import { z } from "zod"

const userSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  role: z.enum(['admin', 'editor', 'viewer']),
  permissions: z.object({
    categories: z.array(z.string()),
    // Outras permissões podem ser validadas aqui se necessário
  }).optional(),
});

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')?.value
    const session = await AuthService.getCurrentSession(sessionToken || '')
    if (!session?.user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }
    if (session.user.role !== 'root' && !session.user.permissions.canManageUsers) {
      return NextResponse.json({ error: "Sem permissão para gerenciar usuários" }, { status: 403 })
    }
    const users = await AuthService.getUsers()
    return NextResponse.json(users)
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar usuários' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')?.value
    const session = await AuthService.getCurrentSession(sessionToken || '')
    if (!session?.user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }
    if (session.user.role !== 'root') {
      return NextResponse.json({ error: "Apenas root pode criar usuários" }, { status: 403 })
    }
    
    const data = await request.json()
    const validation = userSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    const userData = validation.data
    const userWithPermissions = {
      ...userData,
      permissions: {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canViewReports: true,
        canManageCategories: false,
        categories: userData.permissions?.categories || []
      }
    }
    const user = AuthService.createUser(userWithPermissions)
    return NextResponse.json(user)
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao criar usuário' }, { status: 500 })
  }
} 