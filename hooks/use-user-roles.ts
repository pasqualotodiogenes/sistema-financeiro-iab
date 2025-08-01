import { useMemo } from 'react';
import type { User } from '@/lib/types';
import { Crown, Shield, UserCheck, UserX } from 'lucide-react';
import { BUSINESS_RULES } from '@/lib/constants';

export function useUserRoles() {
  
  // Get role icon component
  const getRoleIcon = (role: User["role"]) => {
    switch (role) {
      case "root":
        return Crown;
      case "admin": 
        return Shield;
      case "editor":
        return UserCheck;
      case "viewer":
        return UserX;
    }
  };

  // Get role badge color classes
  const getRoleBadgeColor = (role: User["role"]) => {
    switch (role) {
      case "root":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "editor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: User["role"]) => {
    const names = {
      root: 'ROOT',
      admin: 'ADMIN', 
      editor: 'EDITOR',
      viewer: 'VIEWER'
    };
    return names[role];
  };

  // Get role description
  const getRoleDescription = (role: User["role"]) => {
    const descriptions = {
      root: 'Acesso total + gerenciar usuários',
      admin: 'Criar, editar e excluir dados',
      editor: 'Criar e editar dados',
      viewer: 'Apenas visualizar relatórios'
    };
    return descriptions[role];
  };

  // Check if role can access all categories
  const hasAllCategories = (role: User["role"]) => {
    return role === "root" || role === "admin";
  };

  // Get available roles for selection (exclude root from regular selection)
  const getSelectableRoles = (currentUserRole?: User["role"]) => {
    const roles = BUSINESS_RULES.ROLES.HIERARCHY.filter(role => role !== 'viewer'); // Remove viewer padrão
    
    // Se não é root, não pode criar outros roots
    if (currentUserRole !== 'root') {
      return roles.filter(role => role !== 'root');
    }
    
    return roles;
  };

  // Check if user can edit another user based on roles
  const canEditUser = (currentUserRole: User["role"], targetUserRole: User["role"]) => {
    const hierarchy = BUSINESS_RULES.ROLES.HIERARCHY;
    const currentLevel = hierarchy.indexOf(currentUserRole);
    const targetLevel = hierarchy.indexOf(targetUserRole);
    
    // Root pode editar qualquer um
    if (currentUserRole === 'root') return true;
    
    // Usuários não podem editar usuários de nível igual ou superior
    return currentLevel > targetLevel;
  };

  // Check if user can delete another user
  const canDeleteUser = (currentUserRole: User["role"], targetUserRole: User["role"]) => {
    // Root nunca pode ser deletado
    if (targetUserRole === 'root') return false;
    
    // Apenas root pode deletar outros usuários
    return currentUserRole === 'root';
  };

  // Get role hierarchy level (higher number = more permissions)
  const getRoleLevel = (role: User["role"]) => {
    return BUSINESS_RULES.ROLES.HIERARCHY.indexOf(role);
  };

  // Role configuration for UI display
  const roleConfig = useMemo(() => [
    {
      role: 'root' as const,
      icon: Crown,
      name: 'Root',
      description: 'Acesso total + gerenciar usuários',
      color: 'yellow'
    },
    {
      role: 'admin' as const,
      icon: Shield,
      name: 'Admin',
      description: 'Criar, editar e excluir dados',
      color: 'blue'
    },
    {
      role: 'editor' as const,
      icon: UserCheck,
      name: 'Editor',
      description: 'Criar e editar dados',
      color: 'green'
    },
    {
      role: 'viewer' as const,
      icon: UserX,
      name: 'Viewer',
      description: 'Apenas visualizar relatórios',
      color: 'gray'
    }
  ], []);

  return {
    // Functions
    getRoleIcon,
    getRoleBadgeColor,
    getRoleDisplayName,
    getRoleDescription,
    hasAllCategories,
    getSelectableRoles,
    canEditUser,
    canDeleteUser,
    getRoleLevel,
    
    // Data
    roleConfig,
    roleHierarchy: BUSINESS_RULES.ROLES.HIERARCHY,
  };
}