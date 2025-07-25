import { 
  Coffee, 
  Heart, 
  Wrench, 
  Users, 
  Calendar, 
  ShoppingCart, 
  Folder,
  FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mapa centralizado de ícones
export const iconMap: Record<string, LucideIcon> = {
  Coffee,
  Heart,
  Wrench,
  Users,
  Calendar,
  ShoppingCart,
  Folder,
  FileText
};

// Opções para formulários de categoria
export const iconOptions = [
  { value: "Coffee", label: "Café", icon: Coffee },
  { value: "Heart", label: "Coração", icon: Heart },
  { value: "Wrench", label: "Chave", icon: Wrench },
  { value: "Users", label: "Usuários", icon: Users },
  { value: "Calendar", label: "Calendário", icon: Calendar },
  { value: "ShoppingCart", label: "Carrinho", icon: ShoppingCart },
  { value: "Folder", label: "Pasta", icon: Folder },
];

// Mapa centralizado de cores
export const colorMap: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  pink: 'text-pink-600',
  indigo: 'text-indigo-600',
  gray: 'text-gray-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  lime: 'text-lime-600',
  cyan: 'text-cyan-600',
  teal: 'text-teal-600'
};

// Opções para formulários de categoria
export const colorOptions = [
  { value: "amber", label: "Âmbar", color: "bg-amber-500" },
  { value: "blue", label: "Azul", color: "bg-blue-500" },
  { value: "green", label: "Verde", color: "bg-green-500" },
  { value: "red", label: "Vermelho", color: "bg-red-500" },
  { value: "purple", label: "Roxo", color: "bg-purple-500" },
  { value: "orange", label: "Laranja", color: "bg-orange-500" },
  { value: "pink", label: "Rosa", color: "bg-pink-500" },
  { value: "indigo", label: "Índigo", color: "bg-indigo-500" },
  { value: "gray", label: "Cinza", color: "bg-gray-500" },
  { value: "emerald", label: "Esmeralda", color: "bg-emerald-500" },
  { value: "lime", label: "Lima", color: "bg-lime-500" },
  { value: "cyan", label: "Ciano", color: "bg-cyan-500" },
  { value: "teal", label: "Verde-azulado", color: "bg-teal-500" },
  { value: "yellow", label: "Amarelo", color: "bg-yellow-500" }
];

// Função utilitária para obter o componente do ícone
export function getIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return Coffee;
  const IconComponent = iconMap[iconName];
  return IconComponent || Coffee;
}

// Função utilitária para obter a classe CSS da cor
export function getColorClass(colorName?: string): string {
  if (!colorName) return colorMap.blue;
  return colorMap[colorName] || colorMap.blue;
}

// Função utilitária para obter a classe de background da cor (para categorias)
export function getColorBgClass(colorName?: string): string {
  if (!colorName) return 'bg-blue-500';
  const colorOption = colorOptions.find((opt) => opt.value === colorName);
  return colorOption?.color || 'bg-blue-500';
}