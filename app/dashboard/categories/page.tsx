"use client"

import React, { useCallback } from "react"
import type { Category } from "@/lib/types"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Settings,
  Edit,
  Trash2,
  Coffee,
  Heart,
  Wrench,
  Users,
  Calendar,
  ShoppingCart,
  Folder,
} from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useCategories } from "@/components/ui/categories-context"
import { AuthUtils } from '@/lib/auth-utils'

const iconOptions = [
  { value: "Coffee", label: "Café", icon: Coffee },
  { value: "Heart", label: "Coração", icon: Heart },
  { value: "Wrench", label: "Ferramenta", icon: Wrench },
  { value: "Users", label: "Usuários", icon: Users },
  { value: "Calendar", label: "Calendário", icon: Calendar },
  { value: "ShoppingCart", label: "Carrinho", icon: ShoppingCart },
  { value: "Folder", label: "Pasta", icon: Folder },
]

const colorOptions = [
  { value: "amber", label: "Âmbar", color: "bg-amber-500" },
  { value: "red", label: "Vermelho", color: "bg-red-500" },
  { value: "blue", label: "Azul", color: "bg-blue-500" },
  { value: "green", label: "Verde", color: "bg-green-500" },
  { value: "purple", label: "Roxo", color: "bg-purple-500" },
  { value: "orange", label: "Laranja", color: "bg-orange-500" },
]

export default function CategoriesPage() {
  const { user: currentUser } = useAuth()
  const { refreshCategories } = useCategories()
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    icon: "Folder",
    color: "blue",
    isPublic: false,
  })

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories")
    const data = await res.json()
    setCategories(data)
    await refreshCategories()
  }, [refreshCategories])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      if (editingCategory) {
        await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            icon: formData.icon,
            color: formData.color,
            isPublic: formData.isPublic,
          })
        })
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            icon: formData.icon,
            color: formData.color,
            isSystem: false,
            isPublic: formData.isPublic,
          })
        })
      }
      await loadCategories()
      await refreshCategories()
      resetForm()
      setIsDialogOpen(false)
    } catch (err: unknown) {
      if (err instanceof Error) {
      setError(err.message || "Erro ao salvar categoria. Tente novamente.")
      } else {
        setError("Erro ao salvar categoria. Tente novamente.")
      }
    }
  }

  const handleEdit = (category: Category) => {
    if (category.isSystem) {
      setError("Não é possível editar categorias do sistema")
      return
    }
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      isPublic: category.isPublic ?? false,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    try {
      if (confirm("Tem certeza que deseja excluir esta categoria? Todos os dados relacionados serão perdidos.")) {
        await fetch(`/api/categories/${categoryId}`, { method: "DELETE" })
        await loadCategories()
        await refreshCategories()
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
      alert(err.message || "Erro ao excluir categoria")
      } else {
        alert("Erro ao excluir categoria")
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      icon: "Folder",
      color: "blue",
      isPublic: false,
    })
    setEditingCategory(null)
    setError("")
  }

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.value === iconName)
    return iconOption?.icon || Folder
  }

  const getColorClass = (colorName: string) => {
    const colorOption = colorOptions.find((opt) => opt.value === colorName)
    return colorOption?.color || "bg-blue-500"
  }

  return (
    <AuthGuard requiredPermission="canManageCategories">
      <div className="min-h-screen bg-cream-50">
        <div className="bg-white border-b border-cream-200 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg text-primary-700"
                  title="Voltar para o Dashboard"
                  aria-label="Voltar para o Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary-800">Gerenciar Categorias</h1>
                  <p className="text-primary-600">Configuração das categorias financeiras</p>
                </div>
              </div>
            </div>
            {AuthUtils.canCreateCategory(currentUser) && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                >
                  <Plus className="w-4 h-4" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-primary-800">
                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary-700">
                      Nome da Categoria
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-lg border-cream-300 focus:border-primary-500"
                      required
                      placeholder="Ex: Eventos Especiais"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon" className="text-primary-700">
                      Ícone
                    </Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger className="rounded-lg border-cream-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => {
                          const IconComponent = option.icon
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-primary-700">
                      Cor
                    </Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => setFormData({ ...formData, color: value })}
                    >
                      <SelectTrigger className="rounded-lg border-cream-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${option.color}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center py-4">
                    <div className="flex items-center gap-3 p-3 bg-cream-50 rounded-lg">
                      <div
                        className={`w-10 h-10 ${getColorClass(formData.color)} rounded-lg flex items-center justify-center`}
                      >
                        {React.createElement(getIconComponent(formData.icon), {
                          className: "w-5 h-5 text-white",
                        })}
                      </div>
                      <span className="font-medium text-primary-800">{formData.name || "Preview"}</span>
                    </div>
                  </div>

                  {currentUser?.role === 'root' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={formData.isPublic}
                        onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                        className="accent-primary-600"
                      />
                      <Label htmlFor="isPublic" className="text-primary-700">
                        Categoria aberta para todos (visitantes poderão ver)
                      </Label>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 rounded-lg bg-primary-600 hover:bg-primary-700">
                      {editingCategory ? "Atualizar" : "Criar Categoria"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
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
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Categories Grid */}
            <Card className="border-cream-300 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-800">
                  <Settings className="w-5 h-5" />
                  Categorias do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full max-w-full overflow-x-auto">
                  {categories.map((category) => {
                    const IconComponent = getIconComponent(category.icon)
                    const colorClass = getColorClass(category.color)

                    return (
                      <Card key={category.id} className="border-cream-300 hover:shadow-md transition-shadow h-full w-full max-w-full">
                        <CardContent className="p-2 sm:p-3 md:p-4 flex flex-col gap-2 h-full justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-primary-800 truncate text-xs sm:text-sm md:text-base">{category.name}</h3>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {category.isSystem ? (
                                  <Badge variant="outline" className="text-[9px] sm:text-xs md:text-sm">Sistema</Badge>
                                ) : (
                                  <Badge className="text-[9px] sm:text-xs md:text-sm bg-primary-100 text-primary-700">Personalizada</Badge>
                                )}
                                {currentUser?.role === 'root' && (
                                  <span className={`text-[9px] sm:text-xs md:text-sm ${category.isSystem || category.isPublic ? 'text-green-700' : 'text-gray-400'}`}>{category.isSystem || category.isPublic ? 'Pública' : 'Privada'}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!category.isSystem && (
                            <div className="flex items-center gap-1 mt-2">
                              {AuthUtils.canEditCategory(currentUser) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(category)}
                                className="h-8 w-8 rounded-lg hover:bg-primary-100 text-primary-600"
                                title="Editar Categoria"
                                aria-label="Editar Categoria"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              )}
                              {AuthUtils.canDeleteCategory(currentUser) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(category.id)}
                                className="h-8 w-8 rounded-lg hover:bg-red-100 text-red-600"
                                title="Excluir Categoria"
                                aria-label="Excluir Categoria"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-cream-300 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-primary-800">Informações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-primary-700">
                  <p>• Categorias do sistema não podem ser editadas ou excluídas</p>
                  <p>• Ao excluir uma categoria personalizada, todos os dados relacionados serão perdidos</p>
                  <p>• Novas categorias ficam disponíveis imediatamente para todos os usuários com acesso</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
