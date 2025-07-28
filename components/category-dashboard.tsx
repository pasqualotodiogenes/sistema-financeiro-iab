import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, FileText, Printer, TrendingUp, TrendingDown, DollarSign, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { filterMovementsByDate, formatCurrency } from "@/lib/utils"
import { StatsCards } from "@/components/ui/stats-cards"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/ui/page-header"
import { AuthUtils } from '@/lib/auth-utils'
import { User } from '@/lib/types'
import { useCategories } from '@/components/ui/categories-context'
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Movement {
  id: string
  date: string
  description: string
  amount: number
  type: 'entrada' | 'saida'
  category: string
}

interface CategoryDashboardProps {
  categorySlug: string
  categoryName: string
  icon?: React.ReactNode
  color?: string
  description?: string
}

export default function CategoryDashboard({ categorySlug, categoryName, icon, color, description }: CategoryDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [selectedYear] = useState<number>()
  const [selectedMonth] = useState<number>()
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    type: "entrada" as "entrada" | "saida",
    amount: "",
  })
  // Removido isExportDialogOpen - não utilizado
  const { categories } = useCategories();
  const category = categories.find(cat => cat.slug === categorySlug);
  const categoryId = category?.id;
  const { toast } = useToast();
  // Removido toast de debug

  // LOGS DE DEPURAÇÃO (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log("Debug - Usuário:", currentUser?.name || 'N/A');
    console.log("Debug - Categorias carregadas:", categories.length);
    console.log("Debug - Slug atual:", categorySlug, "ID encontrado:", categoryId);
  }

  const fetchCurrentUser = async () => {
    const res = await fetch("/api/auth/session")
    if (!res.ok) return
    const data = await res.json()
    setCurrentUser(data.user)
  }

  // Carregar usuário uma vez
  useEffect(() => {
    fetchCurrentUser()
  }, [])

  // Carregar movimentações sempre que categorySlug mudar
  useEffect(() => {
    if (categorySlug) {
      loadMovements()
    }
  }, [categorySlug]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const filtered = filterMovementsByDate(movements, selectedYear, selectedMonth)
    setFilteredMovements(filtered)
  }, [movements, selectedYear, selectedMonth])

  // Callback separado para evitar parsing inline

  const loadMovements = async () => {
    if (!categorySlug) return
    try {
      // Otimização: filtrar no servidor em vez do client
      const res = await fetch(`/api/movements?categorySlug=${categorySlug}`)
      if (!res.ok) {
        console.error('Erro ao carregar movimentações:', res.statusText)
        return
      }
      const data = await res.json()
      setMovements(data)
      setFilteredMovements(data)
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
    }
  }

  const totalEntradas = filteredMovements.filter((m) => m.type === "entrada").reduce((sum, m) => sum + m.amount, 0)
  const totalSaidas = filteredMovements.filter((m) => m.type === "saida").reduce((sum, m) => sum + m.amount, 0)
  const saldo = totalEntradas - totalSaidas

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const movementData = {
      date: formData.date,
      description: formData.description,
      amount: Number.parseFloat(formData.amount),
      type: formData.type,
      category: categoryId, // Sempre enviar o ID
      createdBy: currentUser?.id || "1",
    };
    try {
    if (editingMovement) {
        const res = await fetch(`/api/movements/${editingMovement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movementData)
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error);
        }
        toast({ title: "Movimentação atualizada com sucesso!", description: "Movimentação atualizada com sucesso!" });
    } else {
        const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movementData)
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error);
        }
        toast({ title: "Movimentação criada com sucesso!", description: "Movimentação criada com sucesso!" });
      }
      setFormData({ date: "", description: "", type: "entrada", amount: "" });
      setEditingMovement(null);
      setIsDialogOpen(false);
      await loadMovements();
    } catch (error: unknown) {
      toast({ title: "Erro ao salvar movimentação", description: error instanceof Error ? error.message : 'Erro desconhecido', variant: "destructive" });
    }
  };

  const handleEdit = (movement: Movement) => {
    setEditingMovement(movement)
    setFormData({
      date: movement.date,
      description: movement.description,
      type: movement.type,
      amount: movement.amount.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    // Substituir confirm por modal customizado depois, por enquanto toast
    try {
      const res = await fetch(`/api/movements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      toast({ title: "Movimentação excluída com sucesso!", description: "Movimentação excluída com sucesso!" });
      await loadMovements();
    } catch (error: unknown) {
      toast({ title: "Erro ao excluir movimentação", description: error instanceof Error ? error.message : 'Erro desconhecido', variant: "destructive" });
    }
  }

  // Função generateReport removida - não utilizada

  const printReport = () => {
    const printContent = `\n      <html>\n        <head>\n          <title>Relatório ${categoryName} - IAB IGREJINHA</title>\n          <style>body { font-family: Arial, sans-serif; margin: 20px; color: #1a2b1e; } .header { text-align: center; margin-bottom: 30px; color: #4a7c59; } .summary { margin-bottom: 30px; background: #f0f4f0; padding: 15px; border-radius: 8px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #eed9b0; padding: 8px; text-align: left; } th { background-color: #f5e6cc; color: #2f5238; } .entrada { color: green; } .saida { color: red; }</style>\n        </head>\n        <body>\n          <div class="header">\n            <h1>IAB IGREJINHA</h1>\n            <h2>Relatório Financeiro - ${categoryName}</h2>\n            <p>Data: ${new Date().toLocaleDateString("pt-BR")}</p>\n            ${selectedYear ? `<p>Ano: ${selectedYear}</p>` : ""}\n            ${selectedMonth ? `<p>Mês: ${selectedMonth}</p>` : ""}\n          </div>\n          <div class="summary">\n            <p><strong>Total de Entradas:</strong> ${formatCurrency(totalEntradas)}</p>\n            <p><strong>Total de Saídas:</strong> ${formatCurrency(totalSaidas)}</p>\n            <p><strong>Saldo:</strong> ${formatCurrency(saldo)}</p>\n          </div>\n          <table>\n            <thead>\n              <tr>\n                <th>Data</th>\n                <th>Descrição</th>\n                <th>Tipo</th>\n                <th>Valor</th>\n              </tr>\n            </thead>\n            <tbody>\n              ${filteredMovements.map((m) => `<tr><td>${new Date(m.date).toLocaleDateString("pt-BR")}</td><td>${m.description}</td><td class="${m.type}">${m.type.toUpperCase()}</td><td>R$ ${m.amount.toFixed(2)}</td></tr>`).join("")}\n            </tbody>\n          </table>\n        </body>\n      </html>\n    `
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Nova função para exportar PDF (usando print) ou Excel (simples CSV)
  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      printReport()
    } else if (format === 'excel') {
      // Exportar como CSV
      let csv = 'Data,Descrição,Tipo,Valor\n'
      csv += filteredMovements.map((m) => `${new Date(m.date).toLocaleDateString('pt-BR')},${m.description},${m.type.toUpperCase()},${m.amount.toFixed(2)}`).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${categorySlug}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    // setIsExportDialogOpen(false) - removido
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader
        title={categoryName}
        description={description || `Gestão financeira de ${categoryName.toLowerCase()}`}
        icon={icon || <FileText className="w-5 h-5 text-gray-600" />}
        backHref="/dashboard"
      >
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-lg border-cream-300 text-primary-700 hover:bg-cream-50 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500">
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">Imprimir</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>Exportar como PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>Exportar como Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {categoryId && AuthUtils.hasPermission(currentUser, 'canCreate', categoryId) && (
            <Button className="gap-2 rounded-lg bg-primary-700 hover:bg-primary-800 text-white border border-primary-800" onClick={() => { setEditingMovement(null); setFormData({ date: '', description: '', type: 'entrada', amount: '' }); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          )}
        </div>
      </PageHeader>
      
      {/* Dialog Content - Fora dos layouts condicionais */}
      {categoryId && AuthUtils.hasPermission(currentUser, 'canCreate', categoryId) && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-primary-800">{editingMovement ? "Editar Movimentação" : "Nova Movimentação"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-primary-700">Data</Label>
                      <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="rounded-lg border-cream-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-primary-700">Descrição</Label>
                      <Textarea id="description" placeholder="Descreva a movimentação..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="rounded-lg border-cream-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-primary-700">Tipo</Label>
                      <Select value={formData.type} onValueChange={(value: "entrada" | "saida") => setFormData({ ...formData, type: value })}>
                        <SelectTrigger className="rounded-lg border-cream-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-primary-700">Valor (R$)</Label>
                      <Input id="amount" type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="rounded-lg border-cream-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 rounded-lg bg-cream-600 hover:bg-cream-700 text-primary-800 focus:outline-none focus:ring-2 focus:ring-cream-500 font-medium">
                        {editingMovement ? "Atualizar" : "Adicionar"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => { 
                          setIsDialogOpen(false); 
                          setEditingMovement(null); 
                          setFormData({ date: "", description: "", type: "entrada", amount: "" });
                        }} 
                        className="flex-1 rounded-lg text-primary-600 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-cream-300"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* <DateFilter onFilterChange={handleFilterChange} /> */}
          <StatsCards 
            totalEntradas={totalEntradas}
            totalSaidas={totalSaidas}
            saldo={saldo}
          />
          <Card className="border-cream-300 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-800">
                <FileText className="w-5 h-5" /> Movimentações Financeiras
                {(selectedYear || selectedMonth) && (
                  <span className="text-sm font-normal text-primary-600">({filteredMovements.length} de {movements.length} registros)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile: Layout em cards */}
              <div className="md:hidden space-y-3">
                {filteredMovements.length === 0 ? (
                  <div className="text-center py-8 text-primary-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 mx-auto text-cream-400" />
                      <p>Nenhuma movimentação encontrada para esta categoria</p>
                    </div>
                  </div>
                ) : (
                  filteredMovements.map((movement) => (
                    <div key={movement.id} className="bg-white border border-cream-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-primary-800">{movement.description}</p>
                          <p className="text-sm text-primary-600">{new Date(movement.date).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${movement.type === "entrada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {movement.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-lg font-bold ${movement.type === "entrada" ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(movement.amount)}
                        </span>
                        {(currentUser?.permissions?.canEdit || currentUser?.permissions?.canDelete) && (
                          <div className="flex gap-1">
                            {currentUser?.permissions?.canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(movement)}
                                aria-label={`Editar movimentação de ${movement.description}`}
                                className="h-10 w-10 p-0 text-cream-700 hover:text-cream-800 hover:bg-cream-100 rounded-lg"
                              >
                                <Edit className="h-5 w-5" />
                              </Button>
                            )}
                            {currentUser?.permissions?.canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(movement.id)}
                                aria-label={`Excluir movimentação de ${movement.description}`}
                                className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop: Tabela tradicional */}
              <div className="hidden md:block overflow-x-auto">
                <Table role="table" aria-label="Tabela de movimentações financeiras">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary-700">Data</TableHead>
                      <TableHead className="text-primary-700">Descrição</TableHead>
                      <TableHead className="text-primary-700">Tipo</TableHead>
                      <TableHead className="text-right text-primary-700">Valor</TableHead>
                      {(currentUser?.permissions?.canEdit || currentUser?.permissions?.canDelete) && (
                        <TableHead className="text-center text-primary-700">Ações</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={currentUser?.permissions?.canEdit || currentUser?.permissions?.canDelete ? 5 : 4} className="text-center py-8 text-primary-500" aria-live="polite">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-8 h-8 mx-auto text-cream-400" />
                            Nenhuma movimentação encontrada para esta categoria
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-primary-700">{new Date(movement.date).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="text-primary-700">{movement.description}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${movement.type === "entrada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{movement.type.toUpperCase()}</span>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${movement.type === "entrada" ? "text-green-600" : "text-red-600"}`}>{formatCurrency(movement.amount)}</TableCell>
                          {(currentUser?.permissions?.canEdit || currentUser?.permissions?.canDelete) && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                {currentUser?.permissions?.canEdit && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEdit(movement)} 
                                    aria-label={`Editar movimentação de ${movement.description}`}
                                    className="h-9 w-9 rounded-lg hover:bg-cream-100 text-cream-700 focus:outline-none focus:ring-2 focus:ring-cream-400"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {currentUser?.permissions?.canDelete && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        aria-label={`Excluir movimentação de ${movement.description}`}
                                        className="h-9 w-9 rounded-lg hover:bg-red-100 text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Movimentação</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir esta movimentação? <br />
                                          <span className="font-semibold text-red-600">Esta ação não poderá ser desfeita.</span>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="text-primary-600 hover:bg-cream-50">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white font-medium" onClick={() => handleDelete(movement.id)}>
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 