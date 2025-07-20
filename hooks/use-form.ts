"use client"

import { useState, useCallback } from 'react'
import { useApi } from './use-api'
import { useToast } from '@/components/ui/use-toast'

interface UseFormOptions<T> {
  initialData?: Partial<T>
  onSubmit?: (data: T) => Promise<{ success: boolean; error?: string }>
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  validate?: (data: T) => string | null
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T> = {}) {
  const { initialData = {}, onSubmit, onSuccess, onError, validate } = options
  const [data, setData] = useState<Partial<T>>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const setField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando alterado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const validateForm = useCallback(() => {
    if (validate) {
      const validationError = validate(data as T)
      if (validationError) {
        toast({
          title: "Erro de Validação",
          description: validationError,
          variant: "destructive"
        })
        return false
      }
    }
    return true
  }, [data, validate, toast])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      if (onSubmit) {
        const result = await onSubmit(data as T)
        if (result.success) {
          onSuccess?.(data as T)
        } else {
          onError?.(result.error || 'Erro desconhecido')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [data, validateForm, onSubmit, onSuccess, onError])

  const reset = useCallback(() => {
    setData(initialData)
    setErrors({})
  }, [initialData])

  const hasErrors = Object.keys(errors).some(key => errors[key as keyof T])

  return {
    data,
    errors,
    loading,
    setField,
    setFieldError,
    handleSubmit,
    reset,
    hasErrors,
    isValid: !hasErrors
  }
} 