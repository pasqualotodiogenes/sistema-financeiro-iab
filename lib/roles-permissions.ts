// Centralização das permissões por papel e entidade
export const ROLE_PERMISSIONS = {
  root: {
    categories: { create: true, edit: true, delete: true },
    users: { manage: true },
    reports: { view: true },
    // Pode expandir para outros módulos
  },
  admin: {
    categories: { create: true, edit: true, delete: true },
    users: { manage: false },
    reports: { view: true },
  },
  editor: {
    categories: { create: true, edit: true, delete: false },
    users: { manage: false },
    reports: { view: true },
  },
  viewer: {
    categories: { create: false, edit: false, delete: false },
    users: { manage: false },
    reports: { view: true },
  },
} as const;

export type Role = keyof typeof ROLE_PERMISSIONS; 