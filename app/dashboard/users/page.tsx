"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
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
import { useUserForm } from "@/hooks/use-user-form"
import { useDeleteDialog } from "@/hooks/use-delete-dialog"
import { useUserRoles } from "@/hooks/use-user-roles"
import UserTableRow from "@/components/user-table-row"
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
  const { users, refreshUsers, invalidateCache } = useUsers();
  
  // Custom hooks para lógica complexa
  const userForm = useUserForm({
    onSuccess: () => setIsUserFormDialogOpen(false),
    refreshUsers,
    invalidateCache
  });
  
  const deleteDialog = useDeleteDialog({
    refreshData: refreshUsers,
    invalidateCache,
    apiEndpoint: '/api/users',
    itemName: 'Usuário'
  });
  
  const { getRoleIcon, getRoleBadgeColor, canDeleteUser } = useUserRoles();
  const { toast } = useToast();
  
  // Estados locais reduzidos
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUserFormDialogOpen, setIsUserFormDialogOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [editingAvatarUser, setEditingAvatarUser] = useState<User | null>(null);
  const [canRender, setCanRender] = useState(false);
  const [error, setError] = useState("");

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

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      setError("Erro ao carregar categorias")
    }
  }, [])

  useEffect(() => {
    if (canRender && loggedUser?.role === 'root') {
      refreshUsers();
      loadCategories();
    }
  }, [canRender, refreshUsers, loggedUser?.role, loadCategories]);

  // Stable callback functions for React.memo optimization
  const handleEdit = useCallback((user: User) => {
    userForm.startEdit(user);
    setIsUserFormDialogOpen(true);
  }, [userForm]);

  const handleEditAvatar = useCallback((user: User) => {
    setEditingAvatarUser(user);
    setIsAvatarEditorOpen(true);
  }, []);

  // Memoized filtered users (exclude visitante viewer)
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter(user => !(user.role === "viewer" && user.username === "visitante"));
  }, [users]);

  if (!canRender) return null;

  const handleAvatarChange = () => {
    invalidateCache()
    refreshUsers()
    setIsAvatarEditorOpen(false)
    toast({
      title: "Avatar atualizado com sucesso!",
      description: "A imagem do usuário foi alterada."
    })
  }

  const getCategoryName = (catId: string) => {
    const category = categories.find((c) => c.id === catId)
    return category?.name || catId
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
            <Button className="gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white" onClick={() => { setIsUserFormDialogOpen(true); userForm.resetForm(); }}>
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
                      {filteredUsers.map((user) => (
                          <UserTableRow
                            key={user.id}
                            user={user}
                            categories={categories}
                            currentUserRole={loggedUser?.role || 'viewer'}
                            isDeleteDialogOpen={deleteDialog.isDeleteDialogOpen(user.id)}
                            isDeleting={deleteDialog.isDeleting}
                            onEdit={handleEdit}
                            onEditAvatar={handleEditAvatar}
                            onDeleteClick={deleteDialog.openDeleteDialog}
                            onDeleteConfirm={deleteDialog.confirmDelete}
                            onDeleteCancel={deleteDialog.closeDeleteDialog}
                          />
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
                    {userForm.editingUser ? "Editar Usuário" : "Novo Usuário"}
                  </DialogTitle>
            <DialogDescription id="user-form-desc">
              Preencha os dados do usuário e salve.
            </DialogDescription>
                </DialogHeader>
                <form onSubmit={userForm.handleSubmit} className="space-y-4">
                  {userForm.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{userForm.error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-primary-700">
                        Usuário
                      </Label>
                      <Input
                        id="username"
                        value={userForm.formData.username}
                        onChange={(e) => userForm.setFormData({ ...userForm.formData, username: e.target.value })}
                        className="rounded-lg border-cream-300 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-primary-700">
                        Função
                      </Label>
                      <Select value={userForm.formData.role} onValueChange={userForm.handleRoleChange} 
                        disabled={!!(userForm.editingUser && loggedUser && userForm.editingUser.id === loggedUser.id && loggedUser.role === 'root')}
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
                      value={userForm.formData.name}
                      onChange={(e) => userForm.setFormData({ ...userForm.formData, name: e.target.value })}
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
                      value={userForm.formData.email}
                      onChange={(e) => userForm.setFormData({ ...userForm.formData, email: e.target.value })}
                      className="rounded-lg border-cream-300 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-primary-700">
                      {userForm.editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={userForm.showPassword ? "text" : "password"}
                        value={userForm.formData.password}
                        onChange={(e) => userForm.setFormData({ ...userForm.formData, password: e.target.value })}
                        className="rounded-lg border-cream-300 focus:border-primary-500 pr-10"
                        required={!userForm.editingUser}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => userForm.setShowPassword(!userForm.showPassword)}
                      >
                        {userForm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {(userForm.formData.role === "editor" || userForm.formData.role === "viewer") && (
                    <div className="space-y-3">
                      <Label className="text-primary-700">Categorias com Acesso</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2">
                            <Checkbox
                          checked={userForm.formData.categories.includes(cat.id)}
                          onCheckedChange={(checked) => userForm.handleCategoryChange(cat.id, !!checked)}
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
                      {userForm.editingUser ? "Atualizar" : "Criar Usuário"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsUserFormDialogOpen(false)
                        userForm.resetForm()
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
