"use client"

import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AvatarDisplay } from "@/components/avatar-display"
import { formatDate } from "@/lib/utils"
import { User } from "@/lib/types"
import { useUserRoles } from "@/hooks/use-user-roles"
import { Camera, Edit, Trash2 } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

interface UserTableRowProps {
  user: User;
  categories: Array<{ id: string; name: string }>;
  currentUserRole: User["role"];
  isDeleteDialogOpen: boolean;
  isDeleting: boolean;
  onEdit: (user: User) => void;
  onEditAvatar: (user: User) => void;
  onDeleteClick: (userId: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

// Memoized component to prevent unnecessary re-renders
const UserTableRow = React.memo(function UserTableRow({
  user,
  categories,
  currentUserRole,
  isDeleteDialogOpen,
  isDeleting,
  onEdit,
  onEditAvatar,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: UserTableRowProps) {
  const { getRoleIcon, getRoleBadgeColor, canDeleteUser } = useUserRoles();

  // Memoized function to get category name
  const getCategoryName = React.useCallback((catId: string) => {
    const category = categories.find((c) => c.id === catId);
    return category?.name || catId;
  }, [categories]);

  return (
    <TableRow className="align-top">
      <TableCell className="py-2">
        <AvatarDisplay user={user} size="lg" />
      </TableCell>
      
      <TableCell className="font-medium text-primary-700 max-w-[8rem] truncate">
        {user.username}
      </TableCell>
      
      <TableCell className="text-primary-700 max-w-[10rem] truncate">
        {user.name}
      </TableCell>
      
      <TableCell className="text-primary-700 max-w-[14rem] truncate">
        {user.email}
      </TableCell>
      
      <TableCell>
        <Badge className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit text-xs md:text-sm px-2 py-1`}>
          {React.createElement(getRoleIcon(user.role), { className: "w-4 h-4" })}
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
                <span className="text-xs text-gray-400">
                  +{(user.permissions?.categories?.length ?? 0) - 2}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400">Nenhuma</span>
          )}
        </div>
      </TableCell>
      
      <TableCell className="text-primary-700 text-xs md:text-sm whitespace-nowrap">
        {user.lastLogin ? formatDate(user.lastLogin) : "-"}
      </TableCell>
      
      <TableCell className="flex items-center gap-2 justify-center">
        <button 
          onClick={() => onEditAvatar(user)} 
          className="p-1 text-primary-600 hover:text-primary-800" 
          title="Editar Avatar"
        >
          <Camera className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => onEdit(user)} 
          className="p-1 text-primary-600 hover:text-primary-800" 
          title="Editar Usuário"
        >
          <Edit className="w-4 h-4" />
        </button>
        
        {canDeleteUser(currentUserRole, user.role) && (
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) { onDeleteCancel(); } }}>
            <AlertDialogTrigger asChild>
              <button 
                onClick={() => onDeleteClick(user.id)} 
                className="p-1 text-red-500 hover:text-red-700" 
                title="Excluir Usuário"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este usuário? Esta ação não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? 'Excluindo...' : 'Confirmar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  );
});

export default UserTableRow;