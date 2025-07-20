import type { User } from './types'
import type { Category, Movement } from './types'
import { ROLE_PERMISSIONS, Role } from './roles-permissions'

export interface PermissionCheck {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManageUsers: boolean
  canViewReports: boolean
  canManageCategories: boolean
  categories: string[]
}

export class AuthUtils {
  /**
   * Verifica se o usuário tem permissão para uma ação específica
   */
  static hasPermission(user: User | null, permission: keyof PermissionCheck, category?: string): boolean {
    if (!user) return false
    
    // Root e admin têm todas as permissões, independentemente de categoria
    if (user.role === 'root' || user.role === 'admin') {
      return true
    }
    
    const hasGeneralPermission = user.permissions[permission]
    
    // Para permissões que não dependem de categoria
    if (permission === 'canManageUsers' || permission === 'canViewReports' || permission === 'canManageCategories') {
      return !!hasGeneralPermission
    }
    
    // Para permissões que dependem de categoria
    if (category) {
      return !!hasGeneralPermission && user.permissions.categories.includes(category)
    }
    
    return !!hasGeneralPermission
  }

  /**
   * Verifica se o usuário pode acessar uma categoria específica
   */
  static canAccessCategory(user: User | null, categoryId: string, allCategories?: Category[]): boolean {
    if (!user) return false
    // Root e admin têm acesso a todas as categorias
    if (user.role === 'root' || user.role === 'admin') {
      return true
    }
    // Visitante: acesso a categorias fixas ou públicas
    if (user.role === 'viewer' && allCategories) {
      const category = allCategories.find((c: Category) => c.id === categoryId)
      return !!(category?.isSystem || category?.isPublic)
    }
    // Usuários comuns: acesso apenas às permitidas
    return user.permissions.categories.includes(categoryId)
  }

  /**
   * Retorna as categorias que o usuário pode acessar
   */
  static getAccessibleCategories(user: User | null, allCategories: Category[]): Category[] {
    if (!user) return []
    if (user.role === 'root' || user.role === 'admin') {
      return allCategories
    }
    if (user.role === 'viewer') {
      // Visitante: só vê categorias fixas e públicas
      return allCategories.filter(category => category.isSystem || category.isPublic)
    }
    // Usuários comuns: veem todas, mas só acessam/modificam as que têm permissão
    return allCategories
  }

  /**
   * Verifica se o usuário pode realizar uma ação em uma movimentação
   */
  static canManageMovement(user: User | null, movement: Movement, action: 'create' | 'edit' | 'delete'): boolean {
    if (!user || !movement) return false
    
    // Verificar se pode acessar a categoria da movimentação
    if (!this.canAccessCategory(user, movement.category)) {
      return false
    }
    
    // Verificar permissão específica
    switch (action) {
      case 'create':
        return this.hasPermission(user, 'canCreate', movement.category)
      case 'edit':
        return this.hasPermission(user, 'canEdit', movement.category)
      case 'delete':
        return this.hasPermission(user, 'canDelete', movement.category)
      default:
        return false
    }
  }

  /**
   * Retorna o nível de acesso do usuário para exibição
   */
  static getAccessLevel(user: User | null): string {
    if (!user) return 'Nenhum'
    
    switch (user.role) {
      case 'root':
        return 'Acesso Total'
      case 'admin':
        return 'Administrador'
      case 'editor':
        return 'Editor'
      case 'viewer':
        return 'Visualizador'
      default:
        return 'Desconhecido'
    }
  }

  static canCreateCategory(user: User | null): boolean {
    if (!user) return false;
    return !!ROLE_PERMISSIONS[user.role as Role]?.categories.create;
  }
  static canEditCategory(user: User | null): boolean {
    if (!user) return false;
    return !!ROLE_PERMISSIONS[user.role as Role]?.categories.edit;
  }
  static canDeleteCategory(user: User | null): boolean {
    if (!user) return false;
    return !!ROLE_PERMISSIONS[user.role as Role]?.categories.delete;
  }
  static canManageUsers(user: User | null): boolean {
    if (!user) return false;
    return !!ROLE_PERMISSIONS[user.role as Role]?.users.manage;
  }
  static canViewReports(user: User | null): boolean {
    if (!user) return false;
    return !!ROLE_PERMISSIONS[user.role as Role]?.reports.view;
  }
} 