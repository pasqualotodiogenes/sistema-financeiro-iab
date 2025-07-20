"use client";

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Eye, EyeOff, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, refreshSession } = useAuth()
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const result = await login(username, password)
      if (result.success) {
        await refreshSession()
        toast({ title: "Login realizado com sucesso!", description: `Bem-vindo, ${username}!` });
        router.replace("/dashboard")
      } else {
        setError(result.error || "Credenciais inválidas. Verifique seu usuário e senha.")
        toast({ title: "Erro ao fazer login", description: result.error || "Credenciais inválidas." });
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.")
      toast({ title: "Erro ao fazer login", description: "Tente novamente." });
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestAccess = async () => {
    setError("")
    setIsLoading(true)
    try {
      const result = await login("visitante", "")
      if (result.success) {
        await refreshSession()
        toast({ title: "Acesso como visitante realizado!" });
        router.replace("/dashboard")
      } else {
        setError(result.error || "Erro ao acessar como visitante.")
        toast({ title: "Erro ao acessar como visitante", description: result.error || "Erro ao acessar como visitante." });
      }
    } catch {
      setError("Erro ao acessar como visitante.")
      toast({ title: "Erro ao acessar como visitante", description: "Tente novamente." });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-cream-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-cream-300 shadow-lg bg-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary-800">IAB IGREJINHA</CardTitle>
            <CardDescription className="text-primary-600">Sistema de Administração Financeira</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-primary-700">
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-cream-300 focus:border-primary-500"
                required
                disabled={isLoading}
                placeholder="Digite seu usuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary-700">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-cream-300 focus:border-primary-500 pr-10"
                  required
                  disabled={isLoading}
                  placeholder="Digite sua senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-cream-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-primary-500">ou</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-cream-300 hover:bg-cream-50 text-primary-700 bg-transparent"
            onClick={handleGuestAccess}
            disabled={isLoading}
          >
            <Users className="w-4 h-4 mr-2" />
            Acesso como Visitante
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 