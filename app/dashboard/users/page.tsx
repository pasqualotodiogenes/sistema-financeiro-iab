"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Category } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Plus,
  Users,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Crown,
  UserCheck,
  UserX,
  Settings,
  Camera,
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { PageHeader } from "@/components/ui/page-header"
import { AvatarDisplay } from "@/components/avatar-display" // Import AvatarDisplay
import { AvatarEditor } from "@/components/avatar-editor" // Import AvatarEditor
import { useAuth } from "@/contexts/auth-context"
import { User } from "@/lib/types"
import { useUsers } from "@/components/ui/users-context"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function UsersPage() {
  // Hooks SEMPRE no topo
  const { user: loggedUser, loading } = useAuth();
  const router = useRouter();
  const { users, refreshUsers, invalidateCache } = useUsers()
  const [categories, setCategories] = useState<Category[]>([])
  const [isUserFormDialogOpen, setIsUserFormDialogOpen] = useState(false)
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingAvatarUser, setEditingAvatarUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "viewer" as User["role"],
    categories: [] as string[],
  })
  // Novo estado para controlar se pode renderizar
  const [canRender, setCanRender] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!loggedUser || loggedUser.role !== 'root') {
        router.replace('/dashboard');
        setCanRender(false);
      } else {
        setCanRender(true);
      }
    }
  }, [loggedUser, loading, router]);

  useEffect(() => {
    if (canRender) {
      refreshUsers();
      loadCategories();
    }
  }, [canRender, refreshUsers]);

  if (!canRender) return null;


  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      setError("Erro ao carregar categorias")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const permissions = getRolePermissions(formData.role)
      permissions.categories = formData.categories

      if (editingUser) {
        // Update user
        const updateData: Partial<User> = {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions,
        }

        // Só adiciona password se não estiver vazio
        if (formData.password && formData.password.trim() !== "") {
          updateData.password = formData.password
        }

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
          credentials: 'include'
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error)
        }
      } else {
        // Create new user
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            permissions,
          }),
          credentials: 'include'
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error)
        }
      }

      invalidateCache()
      await refreshUsers()
      resetForm()
      setIsUserFormDialogOpen(false)
      toast({
        title: editingUser ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!",
        description: editingUser ? "Os dados do usuário foram atualizados." : "O novo usuário foi cadastrado."
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar usuário. Tente novamente.")
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: "",
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      categories: user.permissions?.categories ?? [],
    })
    setIsUserFormDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    setUserIdToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userIdToDelete) return;
    try {
      const res = await fetch(`/api/users/${userIdToDelete}`, {
          method: 'DELETE',
          credentials: 'include'
      });
        if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      invalidateCache();
      await refreshUsers();
      setUserIdToDelete(null);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Usuário excluído com sucesso!"
      });
    } catch {
      toast({
        title: "Erro ao excluir usuário."
      });
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEditAvatar = (user: User) => {
    setEditingAvatarUser(user)
    setIsAvatarEditorOpen(true)
  }

  const handleAvatarChange = () => {
    invalidateCache()
    refreshUsers()
    setIsAvatarEditorOpen(false)
    toast({
      title: "Avatar atualizado com sucesso!",
      description: "A imagem do usuário foi alterada."
    })
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "viewer",
      categories: [],
    })
    setEditingUser(null)
    setError("")
    setShowPassword(false)
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
      categories: checked
        ? [...prev.categories, categoryId]
        : prev.categories.filter((id) => id !== categoryId),
      }))
  }

  const handleRoleChange = (role: User["role"]) => {
    const permissions = getRolePermissions(role)
    setFormData((prev) => ({
      ...prev,
      role,
      categories: permissions?.categories ?? [],
    }))
  }

  const getRoleIcon = (role: User["role"]) => {
    switch (role) {
      case "root":
        return <Crown className="w-4 h-4 text-yellow-600" />
      case "admin":
        return <Shield className="w-4 h-4 text-blue-600" />
      case "editor":
        return <UserCheck className="w-4 h-4 text-green-600" />
      case "viewer":
        return <UserX className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: User["role"]) => {
    switch (role) {
      case "root":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "editor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
    }
  }

  const getCategoryName = (catId: string) => {
    const category = categories.find((c) => c.id === catId)
    return category?.name || catId
  }

  const getRolePermissions = (role: User["role"]): User["permissions"] => {
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

  return (
    <AuthGuard requiredPermission="canManageUsers">
      <div className="min-h-screen bg-cream-50 min-w-0 overflow-x-hidden">
        <PageHeader
          title="Gerenciar Usuários"
          description="Controle de acesso e permissões"
          icon={<Users className="w-5 h-5 text-white" />}
          backHref="/dashboard"
        >
          {loggedUser?.role === 'root' && (
            <Button className="gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white" onClick={() => { setIsUserFormDialogOpen(true); resetForm(); }}>
              <Plus className="w-4 h-4" />
              Novo Usuário
            </Button>
          )}
        </PageHeader>

        <div className="p-6 min-w-0 max-w-full overflow-x-hidden">
          <div className="max-w-6xl mx-auto space-y-6 min-w-0 max-w-full">
            {/* Users Table */}
            <Card className="border-cream-300 shadow-sm bg-white min-w-0 max-w-full overflow-x-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-800">
                  <Settings className="w-5 h-5" />
                  Usuários do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto min-w-0 max-w-full">
                  <Table className="min-w-full max-w-full text-xs md:text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-primary-700 whitespace-nowrap">Avatar</TableHead>
                        <TableHead className="text-primary-700 whitespace-nowrap">Usuário</TableHead>
                        <TableHead className="text-primary-700 whitespace-nowrap">Nome</TableHead>
                        <TableHead className="text-primary-700 whitespace-nowrap">Email</TableHead>
                        <TableHead className="text-primary-700 whitespace-nowrap">Função</TableHead>
                        <TableHead className="text-primary-700 whitespace-nowrap">Categorias</TableHead>
                        <TableHead className="text-primary-700 whitespace-nowrap">Último Acesso</TableHead>
                        <TableHead className="text-center text-primary-700 whitespace-nowrap">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(user => !(user.role === "viewer" && user.username === "visitante"))
                        .map((user) => (
                          <TableRow key={user.id} className="align-top">
                            <TableCell className="py-2"><AvatarDisplay user={user} size="lg" /></TableCell>
                            <TableCell className="font-medium text-primary-700 max-w-[8rem] truncate">{user.username}</TableCell>
                            <TableCell className="text-primary-700 max-w-[10rem] truncate">{user.name}</TableCell>
                            <TableCell className="text-primary-700 max-w-[14rem] truncate">{user.email}</TableCell>
                            <TableCell>
                              <Badge className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit text-xs md:text-sm px-2 py-1`}>
                                {getRoleIcon(user.role)}
                                {user.role.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-primary-700">
                              <div className="flex flex-wrap gap-1">
                                {user.role === "root" || user.role === "admin" ? (
                                  <Badge variant="outline" className="text-xs md:text-sm px-2 py-1">
                                    Todas
                                  </Badge>
                                ) : (user.permissions?.categories?.length ?? 0) > 0 ? (
                                  <>
                                    {user.permissions?.categories?.slice(0, 2).map((catId) => (
                                      <Badge key={catId} variant="outline" className="text-xs md:text-sm px-2 py-1 max-w-[6rem] truncate">
                                        {getCategoryName(catId)}
                                      </Badge>
                                    ))}
                                    {(user.permissions?.categories?.length ?? 0) > 2 && (
                                      <span className="text-xs text-gray-400">+{user.permissions?.categories?.length - 2}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">Nenhuma</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-primary-700 text-xs md:text-sm whitespace-nowrap">{user.lastLogin ? formatDate(user.lastLogin) : "-"}</TableCell>
                            <TableCell className="flex items-center gap-2 justify-center">
                              <button onClick={() => handleEditAvatar(user)} className="p-1 text-primary-600 hover:text-primary-800" title="Editar Avatar">
                                <Camera className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEdit(user)} className="p-1 text-primary-600 hover:text-primary-800" title="Editar Usuário">
                                <Edit className="w-4 h-4" />
                              </button>
                              {user.role !== "root" && (
                                <AlertDialog open={isDeleteDialogOpen && userIdToDelete === user.id} onOpenChange={(open) => { if (!open) { setIsDeleteDialogOpen(false); setUserIdToDelete(null); } }}>
                                  <AlertDialogTrigger asChild>
                                <button onClick={() => handleDelete(user.id)} className="p-1 text-red-500 hover:text-red-700" title="Excluir Usuário">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                                      <AlertDialogDescription>Tem certeza que deseja excluir este usuário? Esta ação não poderá ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Permissions Legend */}
            <Card className="border-cream-300 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-primary-800">Níveis de Acesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Root</p>
                      <p className="text-xs text-yellow-600">Acesso total + gerenciar usuários</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Admin</p>
                      <p className="text-xs text-blue-600">Criar, editar e excluir dados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Editor</p>
                      <p className="text-xs text-green-600">Criar e editar dados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <UserX className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Viewer</p>
                      <p className="text-xs text-gray-600">Apenas visualizar relatórios</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {editingAvatarUser && (
        <Dialog open={isAvatarEditorOpen} onOpenChange={setIsAvatarEditorOpen}>
          <DialogContent className="sm:max-w-md" aria-labelledby="avatar-editor-title" aria-describedby="avatar-editor-desc">
            <DialogHeader>
              <DialogTitle id="avatar-editor-title">Alterar Avatar do Usuário</DialogTitle>
              <DialogDescription id="avatar-editor-desc">
                Selecione uma imagem ou personalize o avatar do usuário.
              </DialogDescription>
            </DialogHeader>
            <AvatarEditor user={editingAvatarUser} onAvatarChange={handleAvatarChange} />
          </DialogContent>
        </Dialog>
      )}

      {loggedUser?.role === 'root' && (
      <Dialog open={isUserFormDialogOpen} onOpenChange={setIsUserFormDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-labelledby="user-form-title" aria-describedby="user-form-desc">
                <DialogHeader>
            <DialogTitle id="user-form-title" className="text-primary-800">
                    {editingUser ? "Editar Usuário" : "Novo Usuário"}
                  </DialogTitle>
            <DialogDescription id="user-form-desc">
              Preencha os dados do usuário e salve.
            </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-primary-700">
                        Usuário
                      </Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="rounded-lg border-cream-300 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-primary-700">
                        Função
                      </Label>
                      <Select value={formData.role} onValueChange={handleRoleChange} 
                        disabled={!!(editingUser && loggedUser && editingUser.id === loggedUser.id && loggedUser.role === 'root')}
                      >
                        <SelectTrigger className="rounded-lg border-cream-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary-700">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-lg border-cream-300 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="rounded-lg border-cream-300 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-primary-700">
                      {editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="rounded-lg border-cream-300 focus:border-primary-500 pr-10"
                        required={!editingUser}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {(formData.role === "editor" || formData.role === "viewer") && (
                    <div className="space-y-3">
                      <Label className="text-primary-700">Categorias com Acesso</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2">
                            <Checkbox
                          checked={formData.categories.includes(cat.id)}
                          onCheckedChange={(checked) => handleCategoryChange(cat.id, !!checked)}
                          id={`cat-${cat.id}`}
                            />
                        <Label htmlFor={`cat-${cat.id}`}>{cat.name}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 rounded-lg bg-primary-600 hover:bg-primary-700">
                      {editingUser ? "Atualizar" : "Criar Usuário"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsUserFormDialogOpen(false)
                        resetForm()
                      }}
                      className="flex-1 rounded-lg border-cream-300 text-primary-700"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
      )}
    </AuthGuard>
  )
}
