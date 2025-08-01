"use client"

import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Edit, Trash2 } from "lucide-react"
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

interface Movement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  category: string;
}

interface MovementTableRowProps {
  movement: Movement;
  canEdit: boolean;
  canDelete: boolean;
  isDeleteDialogOpen: boolean;
  onEdit: (movement: Movement) => void;
  onDeleteClick: (movementId: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

// Memoized component for movement table rows - critical for performance with large datasets
const MovementTableRow = React.memo(function MovementTableRow({
  movement,
  canEdit,
  canDelete,
  isDeleteDialogOpen,
  onEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: MovementTableRowProps) {
  
  // Memoized date formatting
  const formattedDate = React.useMemo(() => {
    return new Date(movement.date).toLocaleDateString("pt-BR");
  }, [movement.date]);

  // Memoized amount formatting
  const formattedAmount = React.useMemo(() => {
    return formatCurrency(movement.amount);
  }, [movement.amount]);

  // Memoized type badge classes
  const typeBadgeClasses = React.useMemo(() => {
    return movement.type === "entrada" 
      ? "bg-green-100 text-green-700" 
      : "bg-red-100 text-red-700";
  }, [movement.type]);

  // Memoized amount color classes
  const amountColorClasses = React.useMemo(() => {
    return movement.type === "entrada" 
      ? "text-green-600" 
      : "text-red-600";
  }, [movement.type]);

  return (
    <TableRow>
      <TableCell className="text-primary-700">
        {formattedDate}
      </TableCell>
      
      <TableCell className="text-primary-700">
        {movement.description}
      </TableCell>
      
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadgeClasses}`}>
          {movement.type.toUpperCase()}
        </span>
      </TableCell>
      
      <TableCell className={`text-right font-medium ${amountColorClasses}`}>
        {formattedAmount}
      </TableCell>
      
      {(canEdit || canDelete) && (
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-2">
            {canEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit(movement)}
                className="p-1 text-primary-600 hover:text-primary-800"
                title="Editar Movimento"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            
            {canDelete && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) { onDeleteCancel(); } }}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDeleteClick(movement.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Excluir Movimento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Movimento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este movimento? Esta ação não poderá ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteConfirm}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
});

export default MovementTableRow;