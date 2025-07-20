"use client"

import { useAuth } from '@/contexts/auth-context'
import { AuthUtils } from '@/lib/auth-utils'

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: keyof NonNullable<typeof user>['permissions'], category?: string) => {
    return AuthUtils.hasPermission(user, permission, category)
  }

  const canAccessCategory = (categoryId: string, allCategories?: any[]) => {
    if (!user) return false
    return AuthUtils.canAccessCategory(user, categoryId, allCategories)
  }

  const canManageMovement = (movement: any, action: 'create' | 'edit' | 'delete') => {
    return AuthUtils.canManageMovement(user, movement, action)
  }

  const getAccessLevel = () => {
    return AuthUtils.getAccessLevel(user)
  }

  const getAccessibleCategories = (allCategories: any[]) => {
    return AuthUtils.getAccessibleCategories(user, allCategories)
  }

  // Permissões específicas para facilitar o uso
  const canCreate = (category?: string) => hasPermission('canCreate', category)
  const canEdit = (category?: string) => hasPermission('canEdit', category)
  const canDelete = (category?: string) => hasPermission('canDelete', category)
  const canManageUsers = () => hasPermission('canManageUsers')
  const canViewReports = () => hasPermission('canViewReports')
  const canManageCategories = () => hasPermission('canManageCategories')

  return {
    user,
    hasPermission,
    canAccessCategory,
    canManageMovement,
    getAccessLevel,
    getAccessibleCategories,
    // Permissões específicas
    canCreate,
    canEdit,
    canDelete,
    canManageUsers,
    canViewReports,
    canManageCategories,
    // Estado do usuário
    isRoot: user?.role === 'root',
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor',
    isViewer: user?.role === 'viewer',
    hasAnyPermission: !!(user && (user.permissions.canCreate || user.permissions.canEdit || user.permissions.canDelete))
  }
} 