"use client"

import { useState, useEffect, useCallback } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live em milissegundos
  key?: string // Chave customizada
}

export function useCache<T = any>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, key } = options // 5 minutos padrão
  const [cache, setCache] = useState<Map<string, CacheItem<T>>>(new Map())

  // Limpar cache expirado
  const cleanupExpired = useCallback(() => {
    const now = Date.now()
    setCache(prev => {
      const newCache = new Map()
      for (const [k, v] of prev.entries()) {
        if (now - v.timestamp < v.ttl) {
          newCache.set(k, v)
        }
      }
      return newCache
    })
  }, [])

  // Executar limpeza periodicamente
  useEffect(() => {
    const interval = setInterval(cleanupExpired, 60 * 1000) // Limpar a cada minuto
    return () => clearInterval(interval)
  }, [cleanupExpired])

  const get = useCallback((cacheKey: string): T | null => {
    const item = cache.get(cacheKey)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      cache.delete(cacheKey)
      return null
    }

    return item.data
  }, [cache])

  const set = useCallback((cacheKey: string, data: T, customTtl?: number) => {
    setCache(prev => {
      const newCache = new Map(prev)
      newCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: customTtl || ttl
      })
      return newCache
    })
  }, [ttl])

  const invalidate = useCallback((pattern?: string) => {
    if (!pattern) {
      setCache(new Map())
      return
    }

    setCache(prev => {
      const newCache = new Map()
      for (const [k, v] of prev.entries()) {
        if (!k.includes(pattern)) {
          newCache.set(k, v)
        }
      }
      return newCache
    })
  }, [])

  const has = useCallback((cacheKey: string): boolean => {
    return get(cacheKey) !== null
  }, [get])

  return {
    get,
    set,
    invalidate,
    has,
    clear: () => setCache(new Map())
  }
} 