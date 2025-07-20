export interface User {
  id: string
  username: string
  name?: string
  role: 'root' | 'admin' | 'editor' | 'viewer'
  password?: string // hash, nunca expor em API
  createdAt?: string
  updatedAt?: string
  email?: string
  lastLogin?: string
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    canManageCategories: boolean;
    categories: string[];
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  description?: string
  isPublic?: boolean
  isSystem?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Movement {
  id: string
  category: string
  amount: number
  type: 'entrada' | 'saida'
  description?: string
  date: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface Permission {
  userId: string
  categories: string[]
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canManageUsers?: boolean
  canViewReports?: boolean
  canManageCategories?: boolean
}

export type UserWithPermissions = User & { permissions: { categories: string[]; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean } } 