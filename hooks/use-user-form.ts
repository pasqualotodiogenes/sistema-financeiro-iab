import { useState, useCallback } from 'react';
import type { User } from '@/lib/types';
import { VALIDATION, DEFAULTS, AUTH_CONFIG } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

interface UserFormData {
  username: string;
  password: string;
  name: string;
  email: string;
  role: User["role"];
  categories: string[];
}

interface UseUserFormProps {
  onSuccess?: () => void;
  refreshUsers?: () => Promise<void>;
  invalidateCache?: () => void;
}

export function useUserForm({ onSuccess, refreshUsers, invalidateCache }: UseUserFormProps = {}) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    password: "",
    name: "",
    email: "",
    role: DEFAULTS.USER.ROLE,
    categories: [],
  });
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation functions
  const validateForm = useCallback(() => {
    const errors: string[] = [];

    if (formData.username.length < VALIDATION.USER.USERNAME.MIN_LENGTH) {
      errors.push(`Username deve ter pelo menos ${VALIDATION.USER.USERNAME.MIN_LENGTH} caracteres`);
    }

    if (!VALIDATION.USER.USERNAME.PATTERN.test(formData.username)) {
      errors.push('Username deve conter apenas letras, números, pontos, underscores e hífens');
    }

    if (formData.name.length < VALIDATION.USER.NAME.MIN_LENGTH) {
      errors.push(`Nome deve ter pelo menos ${VALIDATION.USER.NAME.MIN_LENGTH} caracteres`);
    }

    if (!VALIDATION.USER.EMAIL.PATTERN.test(formData.email)) {
      errors.push('Email deve ter um formato válido');
    }

    if (!editingUser && formData.password.length < AUTH_CONFIG.PASSWORD.MIN_LENGTH) {
      errors.push(`Senha deve ter pelo menos ${AUTH_CONFIG.PASSWORD.MIN_LENGTH} caracteres`);
    }

    return errors;
  }, [formData, editingUser]);

  // Get role permissions
  const getRolePermissions = useCallback((role: User["role"]): User["permissions"] => {
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
        };
      case "admin":
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canManageUsers: false,
          canViewReports: true,
          canManageCategories: true,
          categories: ["cantinas", "missoes", "melhorias", "jovens", "eventos", "aquisicao"],
        };
      case "editor":
        return {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canManageUsers: false,
          canViewReports: true,
          canManageCategories: false,
          categories: [],
        };
      case "viewer":
        return DEFAULTS.USER.PERMISSIONS;
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const permissions = getRolePermissions(formData.role);
      permissions.categories = formData.categories;

      if (editingUser) {
        // Update user
        const updateData: Partial<User> = {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions,
        };

        // Só adiciona password se não estiver vazio
        if (formData.password && formData.password.trim() !== "") {
          updateData.password = formData.password;
        }

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
          credentials: 'include'
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error);
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
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error);
        }
      }

      // Success
      invalidateCache?.();
      await refreshUsers?.();
      resetForm();
      onSuccess?.();
      
      toast({
        title: editingUser ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!",
        description: editingUser ? "Os dados do usuário foram atualizados." : "O novo usuário foi cadastrado."
      });

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar usuário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingUser, validateForm, getRolePermissions, invalidateCache, refreshUsers, onSuccess, toast]);

  // Handle role change
  const handleRoleChange = useCallback((role: User["role"]) => {
    const permissions = getRolePermissions(role);
    setFormData(prev => ({
      ...prev,
      role,
      categories: permissions?.categories ?? [],
    }));
  }, [getRolePermissions]);

  // Handle category change
  const handleCategoryChange = useCallback((categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, categoryId]
        : prev.categories.filter(id => id !== categoryId),
    }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: DEFAULTS.USER.ROLE,
      categories: [],
    });
    setEditingUser(null);
    setError("");
    setShowPassword(false);
  }, []);

  // Start editing
  const startEdit = useCallback((user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      categories: user.permissions?.categories ?? [],
    });
  }, []);

  return {
    // State
    formData,
    editingUser,
    isSubmitting,
    error,
    showPassword,
    
    // Actions
    setFormData,
    handleSubmit,
    handleRoleChange,
    handleCategoryChange,
    resetForm,
    startEdit,
    setShowPassword,
    
    // Utils
    validateForm,
    getRolePermissions,
  };
}