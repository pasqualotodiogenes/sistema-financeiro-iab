import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { User } from "@/lib/types";

interface UsersContextType {
  users: User[];
  loading: boolean;
  refreshUsers: () => Promise<void>;
  invalidateCache: () => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

// Cache e deduplicação para evitar múltiplas chamadas
let usersCache: { data: User[]; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 minuto
let pendingRequest: Promise<User[]> | null = null;

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);

  const refreshUsers = useCallback(async () => {
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
  }, []);

  // Função para invalidar cache e forçar atualização
  const invalidateCache = useCallback(() => {
    usersCache = null;
    pendingRequest = null;
  }, []);

  // Carregar usuários ao montar (apenas uma vez)
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      refreshUsers();
    }
  }, [refreshUsers]);

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