"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { User } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

interface UsersContextType {
  users: User[];
  loading: boolean;
  refreshUsers: () => Promise<void>;
  invalidateCache: () => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

import { CACHE_CONFIG } from '@/lib/constants';

// Cache e deduplicação para evitar múltiplas chamadas
let usersCache: { data: User[]; timestamp: number } | null = null;
const CACHE_TTL = CACHE_CONFIG.TTL.USERS;
let pendingRequest: Promise<User[]> | null = null;

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);
  const { user: loggedUser, loading: authLoading } = useAuth();

  const refreshUsers = useCallback(async () => {
    // Só carregar se o usuário for root
    if (!loggedUser || loggedUser.role !== 'root') {
      return;
    }

    // Se já tem uma requisição pendente, aguarda ela
    if (pendingRequest) {
      const result = await pendingRequest;
      setUsers(result);
      return;
    }

    // Verificar cache
    if (usersCache && (Date.now() - usersCache.timestamp < CACHE_TTL)) {
      setUsers(usersCache.data);
      return;
    }

    setLoading(true);
    
    pendingRequest = (async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          const usrs = Array.isArray(data) ? data : (data.users || []);
          
          // Atualizar cache
          usersCache = { data: usrs, timestamp: Date.now() };
          
          return usrs;
        } else {
          return [];
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        return [];
      }
    })();

    try {
      const result = await pendingRequest;
      setUsers(result);
    } finally {
      setLoading(false);
      pendingRequest = null;
    }
  }, [loggedUser]);

  // Função para invalidar cache e forçar atualização
  const invalidateCache = useCallback(() => {
    usersCache = null;
    pendingRequest = null;
  }, []);

  // Carregar usuários ao montar (apenas uma vez)
  React.useEffect(() => {
    if (!mounted.current && !authLoading && loggedUser?.role === 'root') {
      mounted.current = true;
      refreshUsers();
    }
  }, [refreshUsers, authLoading, loggedUser?.role]);

  return (
    <UsersContext.Provider value={{ users, loading, refreshUsers, invalidateCache, setUsers }}>
      {children}
    </UsersContext.Provider>
  );
};

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers deve ser usado dentro de UsersProvider");
  return ctx;
}