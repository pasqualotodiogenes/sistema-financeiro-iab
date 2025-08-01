"use client"

import React from "react"
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

interface MovementCardProps {
  movement: Movement;
  canEdit: boolean;
  canDelete: boolean;
  isDeleteDialogOpen: boolean;
  onEdit: (movement: Movement) => void;
  onDeleteClick: (movementId: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

// Memoized component for movement cards (mobile) - critical for performance with large datasets
const MovementCard = React.memo(function MovementCard({
  movement,
  canEdit,
  canDelete,
  isDeleteDialogOpen,
  onEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: MovementCardProps) {
  
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
    <div className="bg-white border border-cream-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-medium text-primary-800">{movement.description}</p>
          <p className="text-sm text-primary-600">{formattedDate}</p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeBadgeClasses}`}>
            {movement.type.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-lg font-bold ${amountColorClasses}`}>
          {formattedAmount}
        </span>
        {(canEdit || canDelete) && (
          <div className="flex gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(movement)}
                aria-label={`Editar movimentação de ${movement.description}`}
                className="h-10 w-10 p-0 text-cream-700 hover:text-cream-800 hover:bg-cream-100 rounded-lg"
              >
                <Edit className="h-5 w-5" />
              </Button>
            )}
            {canDelete && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) { onDeleteCancel(); } }}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteClick(movement.id)}
                    aria-label={`Excluir movimentação de ${movement.description}`}
                    className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Movimentação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir esta movimentação? Esta ação não poderá ser desfeita.
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
        )}
      </div>
    </div>
  );
});

export default MovementCard;