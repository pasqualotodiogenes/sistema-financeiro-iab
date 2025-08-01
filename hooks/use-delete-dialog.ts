import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseDeleteDialogProps {
  onSuccess?: () => void;
  refreshData?: () => Promise<void>;
  invalidateCache?: () => void;
  apiEndpoint: string;
  itemName?: string;
}

export function useDeleteDialog({ 
  onSuccess, 
  refreshData, 
  invalidateCache, 
  apiEndpoint,
  itemName = 'item'
}: UseDeleteDialogProps) {
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open delete dialog
  const openDeleteDialog = useCallback((itemId: string) => {
    setItemIdToDelete(itemId);
    setIsOpen(true);
  }, []);

  // Close delete dialog
  const closeDeleteDialog = useCallback(() => {
    setIsOpen(false);
    setItemIdToDelete(null);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!itemIdToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const res = await fetch(`${apiEndpoint}/${itemIdToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      // Success
      invalidateCache?.();
      await refreshData?.();
      closeDeleteDialog();
      onSuccess?.();
      
      toast({
        title: `${itemName} excluído com sucesso!`,
        description: `O ${itemName.toLowerCase()} foi removido do sistema.`
      });
      
    } catch (error) {
      console.error(`Erro ao excluir ${itemName}:`, error);
      toast({
        title: `Erro ao excluir ${itemName}`,
        description: error instanceof Error ? error.message : `Erro desconhecido ao excluir ${itemName}.`,
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  }, [itemIdToDelete, apiEndpoint, itemName, invalidateCache, refreshData, onSuccess, toast, closeDeleteDialog]);

  return {
    // State
    isOpen,
    itemIdToDelete,
    isDeleting,
    
    // Actions
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    
    // Utils
    isDeleteDialogOpen: (itemId: string) => isOpen && itemIdToDelete === itemId,
  };
}