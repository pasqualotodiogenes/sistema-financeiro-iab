import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { cookies } from "next/headers"
import { z } from "zod"

// Schema para atualização de usuário (senha opcional)
const updateUserSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres.").optional(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").optional().or(z.literal('')),
  name: z.string().min(1, "O nome é obrigatório.").optional(),
  email: z.string().email("Email inválido.").optional(),
  role: z.enum(['root', 'admin', 'editor', 'viewer']).optional(),
  permissions: z.object({
    canCreate: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
    canManageUsers: z.boolean(),
    canViewReports: z.boolean(),
    canManageCategories: z.boolean(),
    categories: z.array(z.string()),
  }).optional(),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: "ID do usuário não informado." }, { status: 400 });
    }
    const session = AuthService.getCurrentSession(sessionToken);
    // LOG: Sessão recebida
    console.log('[PUT /api/users/[id]] Sessão:', session);

    if (!session?.user) {
      console.error('[PUT /api/users/[id]] Sessão ausente ou inválida:', session);
      return NextResponse.json({ error: "Acesso negado (usuário não autenticado)." }, { status: 403 });
    }
    if (session.user.role !== 'root' && !session.user.permissions.canManageUsers) {
      console.error('[PUT /api/users/[id]] Permissão insuficiente:', session.user);
      return NextResponse.json({ error: "Acesso negado (sem permissão)." }, { status: 403 });
    }

    const data = await request.json();
    // LOG: Body recebido
    console.log('[PUT /api/users/[id]] Body recebido:', data);
    // LOG extra: payload recebido e role
    console.log('[PUT /api/users/[id]] Payload recebido:', data);
    console.log('[PUT /api/users/[id]] Role recebido:', data.role);
    const validation = updateUserSchema.safeParse(data);
    // LOG: Resultado do safeParse
    console.log('[PUT /api/users/[id]] Resultado safeParse:', validation);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    // Proteção: root não pode alterar seu próprio role
    if (session.user.role === 'root' && session.user.id === id) {
      validation.data.role = 'root';
      console.log('[PUT /api/users/[id]] Forçando role=root para root editando a si mesmo');
    }

    // Garantir que todas as permissões obrigatórias estejam presentes
    let permissions = validation.data.permissions;
    if (!permissions) {
      // Se não vier do frontend, usar permissões atuais do usuário
      const users = AuthService.getUsers()
      const user = users.find(u => u.id === id);
      if (user && user.permissions && typeof user.permissions.canCreate === 'boolean') {
        permissions = {
          canCreate: !!user.permissions.canCreate,
          canEdit: !!user.permissions.canEdit,
          canDelete: !!user.permissions.canDelete,
          canManageUsers: !!user.permissions.canManageUsers,
          canViewReports: !!user.permissions.canViewReports,
          canManageCategories: !!user.permissions.canManageCategories,
          categories: Array.isArray(user.permissions.categories) ? user.permissions.categories : [],
        };
      } else {
        permissions = {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canManageUsers: false,
          canViewReports: false,
          canManageCategories: false,
          categories: [],
        };
      }
    } else {
      permissions = {
        canCreate: typeof data.permissions?.canCreate === 'boolean' ? data.permissions.canCreate : false,
        canEdit: typeof data.permissions?.canEdit === 'boolean' ? data.permissions.canEdit : false,
        canDelete: typeof data.permissions?.canDelete === 'boolean' ? data.permissions.canDelete : false,
        canManageUsers: typeof data.permissions?.canManageUsers === 'boolean' ? data.permissions.canManageUsers : false,
        canViewReports: typeof data.permissions?.canViewReports === 'boolean' ? data.permissions.canViewReports : false,
        canManageCategories: typeof data.permissions?.canManageCategories === 'boolean' ? data.permissions.canManageCategories : false,
        categories: Array.isArray(data.permissions?.categories) ? data.permissions.categories : [],
      };
    }
    validation.data.permissions = permissions;

    const success = AuthService.updateUser(id, validation.data);
    if (!success) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[PUT /api/users/[id]] Erro inesperado:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: "ID do usuário não informado." }, { status: 400 });
    }
    const session = AuthService.getCurrentSession(sessionToken);

    if (!session?.user || !session.user.permissions.canManageUsers) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // Prevenção para não se auto-excluir
    if (session.user.id === id) {
        return NextResponse.json({ error: "Você não pode excluir a si mesmo." }, { status: 400 });
    }

    const success = AuthService.deleteUser(id);
    if (!success) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao excluir usuário' }, { status: 500 });
  }
}