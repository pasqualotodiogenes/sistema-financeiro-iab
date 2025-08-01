"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { Category } from "@/lib/types";
import { CACHE_CONFIG } from "@/lib/constants";

interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  refreshCategories: () => Promise<void>;
  invalidateCache: () => void;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

// Cache e deduplicação para evitar múltiplas chamadas
let categoriesCache: { data: Category[]; timestamp: number } | null = null;
const CACHE_TTL = CACHE_CONFIG.TTL.CATEGORIES;
let pendingRequest: Promise<Category[]> | null = null;

export const CategoriesProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);

  const refreshCategories = useCallback(async () => {
    // Se já tem uma requisição pendente, aguarda ela
    if (pendingRequest) {
      const result = await pendingRequest;
      setCategories(result);
      return;
    }

    // Verificar cache
    if (categoriesCache && (Date.now() - categoriesCache.timestamp < CACHE_TTL)) {
      setCategories(categoriesCache.data);
      return;
    }

    setLoading(true);
    
    pendingRequest = (async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          const cats = Array.isArray(data) ? data : (data.categories || []);
          
          // Atualizar cache
          categoriesCache = { data: cats, timestamp: Date.now() };
          
          return cats;
        } else {
          return [];
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        return [];
      }
    })();

    try {
      const result = await pendingRequest;
      setCategories(result);
    } finally {
      setLoading(false);
      pendingRequest = null;
    }
  }, []);

  // Função para invalidar cache e forçar atualização
  const invalidateCache = useCallback(() => {
    categoriesCache = null;
    pendingRequest = null;
  }, []);

  // Carregar categorias ao montar (apenas uma vez)
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      refreshCategories();
    }
  }, [refreshCategories]);

  return (
    <CategoriesContext.Provider value={{ categories, loading, refreshCategories, invalidateCache, setCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories deve ser usado dentro de CategoriesProvider");
  return ctx;
} 