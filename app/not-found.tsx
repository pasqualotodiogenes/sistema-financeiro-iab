"use client"

import { useRouter } from 'next/navigation'
import Church404 from '@/components/Church404'

export default function NotFound() {
  const router = useRouter()
  
  return (
    <Church404 
      title="Ovelha Perdida"
      subtitle='"O Senhor é o meu pastor; nada me faltará." - Salmos 23:1'
      message="Categoria não encontrada."
      onRetry={() => router.push("/dashboard")}
    />
  )
}