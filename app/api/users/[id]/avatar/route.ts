import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"
import { db } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID do usuário não informado." }, { status: 400 });
  }
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')?.value
    const session = AuthService.getCurrentSession(sessionToken || '')
    if (!session?.user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }
    if (session.user.role !== 'root') {
      return NextResponse.json({ error: "Apenas root pode remover avatar" }, { status: 403 })
    }
    // Buscar caminho do avatar atual no banco
<<<<<<< HEAD
    const db = getDb()
    const avatar = await db.prepare('SELECT data FROM avatars WHERE userId = ? AND type = ?').get(id, 'upload') as { data: string | null } | undefined
=======
    const avatar = db.prepare('SELECT data FROM avatars WHERE userId = ? AND type = ?').get(id, 'upload') as { data: string | null } | undefined
>>>>>>> 8c7ee621e6097d5d86f5297726a3fafed9a905c4
    if (avatar && avatar.data && avatar.data.startsWith('/avatars/')) {
      const filePath = path.join(process.cwd(), 'public', avatar.data)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    // Remover registro da tabela avatars
    db.prepare('DELETE FROM avatars WHERE userId = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao remover avatar" }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID do usuário não informado." }, { status: 400 });
  }
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    const session = AuthService.getCurrentSession(sessionToken || '');
    if (!session?.user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }
    // Root pode alterar qualquer avatar, admin/editor só o próprio
    if (session.user.role !== 'root' && session.user.id !== id) {
      return NextResponse.json({ error: "Sem permissão para alterar este avatar" }, { status: 403 });
    }

    // Aceita apenas multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: "Formato inválido. Use multipart/form-data." }, { status: 400 });
    }

    // Parse do form
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    }
    // Validação de tipo e tamanho
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato de imagem não suportado." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Tamanho máximo: 5MB." }, { status: 400 });
    }

    // Salvar arquivo
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${id}.${ext}`;
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    const filePath = path.join(avatarsDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    const publicPath = `/avatars/${fileName}`;

<<<<<<< HEAD
    const db = getDb()
=======
>>>>>>> 8c7ee621e6097d5d86f5297726a3fafed9a905c4
    // Remove avatar antigo se existir
    const oldAvatar = db.prepare('SELECT data FROM avatars WHERE userId = ? AND type = ?').get(id, 'upload') as { data: string } | undefined;
    if (oldAvatar && oldAvatar.data && oldAvatar.data.startsWith('/avatars/')) {
      const oldFilePath = path.join(process.cwd(), 'public', oldAvatar.data);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    // Atualiza banco
    db.prepare('DELETE FROM avatars WHERE userId = ?').run(id);
    db.prepare('INSERT INTO avatars (userId, data, type) VALUES (?, ?, ?)').run(id, publicPath, 'upload');

    return NextResponse.json({ success: true, url: publicPath });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao processar avatar" }, { status: 500 });
  }
} 