"use client"

import { useState } from 'react'
import { useToast } from './use-toast'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Função para obter o token CSRF dos cookies
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith('csrf-token=')) {
      return cookie.substring('csrf-token='.length, cookie.length)
    }
  }
  return null
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  })
  const { toast } = useToast()

  const request = async <R = T>(
    url: string, 
    options: RequestInit = {}, 
    showToast: boolean = true
  ): Promise<ApiResponse<R>> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const res = await fetch(url, {
        credentials: 'include',
        ...options
      })

      const data = await res.json()

      if (res.ok) {
        setState({ data, loading: false, error: null })
        if (showToast && data.message) {
          toast({
            title: "Sucesso",
            description: data.message,
            variant: "default"
          })
        }
        return { data, error: null, success: true }
      } else {
        const error = data.error || 'Erro na requisição'
        setState({ data: null, loading: false, error })
        if (showToast) {
          toast({
            title: "Erro",
            description: error,
            variant: "destructive"
          })
        }
        return { data: null, error, success: false }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão'
      setState({ data: null, loading: false, error: errorMessage })
      if (showToast) {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        })
      }
      return { data: null, error: errorMessage, success: false }
    }
  }

  const get = <R = T>(url: string, showToast: boolean = false) => {
    return request<R>(url, { method: 'GET' }, showToast)
  }

  const post = <R = T>(url: string, body: any, showToast: boolean = true) => {
    const csrfToken = getCsrfToken()
    return request<R>(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify(body)
    }, showToast)
  }

  const put = <R = T>(url: string, body: any, showToast: boolean = true) => {
    const csrfToken = getCsrfToken()
    return request<R>(url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || ''
      },
      body: JSON.stringify(body)
    }, showToast)
  }

  const del = <R = T>(url: string, showToast: boolean = true) => {
    const csrfToken = getCsrfToken()
    return request<R>(url, { 
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken || ''
      }
    }, showToast)
  }

  return {
    ...state,
    request,
    get,
    post,
    put,
    delete: del
  }
} 