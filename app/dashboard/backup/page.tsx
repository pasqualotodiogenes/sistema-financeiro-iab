"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Database, FileText, Shield, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

export default function BackupPage() {
  const { user } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Só root e admin podem acessar
  if (!user || !['root', 'admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-6">
            <Shield className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600 text-center">
              Apenas administradores podem acessar o sistema de backup.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleDownloadBackup = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/backup/download')
      if (!response.ok) throw new Error('Erro ao baixar backup')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `iab_finance_backup_${new Date().toISOString().slice(0,10)}.db`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Backup baixado com sucesso!')
    } catch (error) {
      toast.error('Erro ao baixar backup')
      console.error(error)
    }
    setIsDownloading(false)
  }

  const handleExportSQL = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/backup/export')
      if (!response.ok) throw new Error('Erro ao exportar dados')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `iab_finance_export_${new Date().toISOString().slice(0,10)}.sql`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Dados exportados com sucesso!')
    } catch (error) {
      toast.error('Erro ao exportar dados')
      console.error(error)
    }
    setIsExporting(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Backup do Sistema</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Importante!</h3>
            <p className="text-blue-800 text-sm mt-1">
              Faça backup regularmente dos dados da igreja. Recomenda-se fazer backup antes de qualquer mudança importante no sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Backup Completo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Backup Completo</span>
            </CardTitle>
            <CardDescription>
              Baixa uma cópia completa do banco de dados (.db)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Todos os usuários e permissões</li>
              <li>• Categorias e movimentações</li>
              <li>• Perfil da igreja e avatars</li>
              <li>• Sessões ativas</li>
            </ul>
            <Button 
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Baixando...' : 'Baixar Backup (.db)'}
            </Button>
          </CardContent>
        </Card>

        {/* Export SQL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Export SQL</span>
            </CardTitle>
            <CardDescription>
              Exporta os dados em formato SQL (texto)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Estrutura das tabelas</li>
              <li>• Comandos INSERT para dados</li>
              <li>• Arquivo de texto legível</li>
              <li>• Fácil de importar em outros bancos</li>
            </ul>
            <Button 
              onClick={handleExportSQL}
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar SQL (.sql)'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar os backups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Arquivo .db (Recomendado)</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Salve em local seguro (Dropbox, Google Drive)</li>
                <li>• Contém todos os dados da igreja</li>
                <li>• Pode ser usado para restaurar completamente</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Arquivo .sql</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Arquivo de texto que pode ser lido</li>
                <li>• Útil para migrar para outro sistema</li>
                <li>• Pode ser editado se necessário</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}