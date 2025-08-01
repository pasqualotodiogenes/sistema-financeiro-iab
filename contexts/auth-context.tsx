"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { User } from '@/lib/types'
import { useCache } from '@/hooks/use-cache'
import { pagePreloader } from '@/lib/page-preloader'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Request deduplication - evita múltiplas chamadas paralelas
const pendingRequests = new Map<string, Promise<any>>()

async function deduplicatedFetch(key: string, fetchFn: () => Promise<any>) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }
  
  const promise = fetchFn().finally(() => {
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, promise)
  return promise
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cache com TTL de 2 minutos para sessão (reduzido para menos requests)
  const cache = useCache({ ttl: 120 * 1000 })
  
  // Request deduplication para evitar múltiplas chamadas simultâneas
  const authRequestDebouncer = useRef(new Map<string, Promise<any>>())

  useEffect(() => {
    checkSession()
    
    // Limpar cache no beforeunload para evitar vazamento entre usuários
    const handleBeforeUnload = () => {
      cache.clear()
      pendingRequests.clear()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const checkSession = async () => {
    try {
      // Verificar cache primeiro COM validação de timestamp
      const cachedSession = cache.get('auth-session')
      if (cachedSession) {
        // Verificar se o cache não é muito antigo (90 segundos max)
        const isRecentLogin = cachedSession.loginTimestamp && 
          (Date.now() - cachedSession.loginTimestamp) < 90000
        
        if (isRecentLogin) {
          setUser(cachedSession.user)
          setLoading(false)
          return
        } else {
          // Cache muito antigo, invalidar
          cache.invalidate('auth-session')
        }
      }

      // Usar deduplicação para evitar múltiplas chamadas
      const data = await deduplicatedFetch('check-session', async () => {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (res.ok) {
          return res.json()
        }
        throw new Error('Session invalid')
      })

      // Cache com timestamp
      const sessionWithTimestamp = {
        ...data,
        verificationTimestamp: Date.now(),
        userId: data.user.id
      }
      
      cache.set('auth-session', sessionWithTimestamp)
      setUser(data.user)
      setError(null)
      
      // Triggerar pré-carregamento após verificar sessão válida
      if (data.user) {
        setTimeout(() => {
          pagePreloader.preloadCriticalPages()
          pagePreloader.preloadCriticalAPIs()
        }, 500)
      }
    } catch (err) {
      // Limpar cache se sessão inválida
      cache.invalidate('auth-session')
      setUser(null)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Limpeza preventiva antes do login
      cache.clear()
      pendingRequests.clear()
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Adicionar timestamp para evitar cache cross-contamination
        const sessionWithTimestamp = {
          ...data,
          loginTimestamp: Date.now(),
          userId: data.user.id
        }
        
        cache.set('auth-session', sessionWithTimestamp)
        setUser(data.user)
        setLoading(false)
        
        // Triggerar pré-carregamento após login bem-sucedido
        setTimeout(() => {
          pagePreloader.preloadCriticalPages()
          pagePreloader.preloadCriticalAPIs()
        }, 500)
        
        return { success: true }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Erro no login')
        setLoading(false)
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      const errorMsg = 'Erro de conexão'
      setError(errorMsg)
      setLoading(false)
      return { success: false, error: errorMsg }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      // Limpeza agressiva - evitar cache entre usuários
      cache.clear()
      pendingRequests.clear()
      
      // Limpar sessionStorage e localStorage também
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
        // Apenas remover chaves relacionadas à auth para não quebrar outras funcionalidades
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth') || key.includes('session') || key.includes('user')) {
            localStorage.removeItem(key)
          }
        })
      }
      
      setUser(null)
      setLoading(false)
      setError(null)
    }
  }

  const refreshSession = () => {
    // Limpar cache e buscar nova sessão
    cache.invalidate('auth-session')
    checkSession()
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshSession,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}