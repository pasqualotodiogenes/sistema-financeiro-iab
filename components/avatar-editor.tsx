"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AvatarDisplay } from "./avatar-display"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

type UserWithAvatar = {
  id: string
  username: string
  name?: string
  role: 'root' | 'admin' | 'editor' | 'viewer'
  password?: string
  createdAt?: string
  updatedAt?: string
  avatarUrl?: string | null
}

interface AvatarEditorProps {
  user: UserWithAvatar
  onAvatarChange?: () => void
}

export function AvatarEditor({ user, onAvatarChange }: AvatarEditorProps) {
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError("")
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.")
      toast({ title: "Erro", description: "Apenas imagens são permitidas.", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.")
      toast({ title: "Erro", description: "A imagem deve ter até 5MB.", variant: "destructive" })
      return
    }
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Erro ao enviar avatar.")
        toast({ title: "Erro", description: err.error || "Erro ao enviar avatar.", variant: "destructive" })
        return
      }
      onAvatarChange?.()
      toast({ title: "Avatar atualizado!", description: "A imagem do usuário foi alterada." })
    } catch {
      setError("Erro ao processar a imagem. Tente novamente.")
      toast({ title: "Erro", description: "Erro ao processar a imagem.", variant: "destructive" })
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/avatar`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Erro ao remover avatar.")
        toast({ title: "Erro", description: err.error || "Erro ao remover avatar.", variant: "destructive" })
        return
      }
      onAvatarChange?.()
      toast({ title: "Avatar removido!", description: "O avatar foi removido e voltou ao padrão." })
    } catch {
      setError("Erro ao remover avatar.")
      toast({ title: "Erro", description: "Erro ao remover avatar.", variant: "destructive" })
    }
  }

  return (
        <div className="space-y-4">
          {error && (
        <Alert variant="destructive" tabIndex={-1} autoFocus>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-center">
            <AvatarDisplay user={user} size="xl" />
          </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar-upload">Selecionar Arquivo</Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="cursor-pointer"
                    />
        <Button variant="destructive" onClick={handleRemoveAvatar} className="w-full mt-2">Remover Avatar</Button>
                  <p className="text-xs text-slate-500">Formatos aceitos: JPG, PNG, GIF, WebP. Tamanho máximo: 5MB.</p>
                    </div>
                  </div>
  )
}
