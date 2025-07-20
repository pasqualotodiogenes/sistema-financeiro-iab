"use client"

// Sistema de pré-carregamento de páginas para reduzir compilação inicial
class PagePreloader {
  private preloadedPages = new Set<string>()
  private preloadPromises = new Map<string, Promise<void>>()
  private lastPreload = 0
  private readonly PRELOAD_COOLDOWN = 5 * 60 * 1000 // 5 minutos

  // Pré-carregar páginas críticas em background
  async preloadCriticalPages() {
    // Rate limiting - evitar abuso
    const now = Date.now()
    if (now - this.lastPreload < this.PRELOAD_COOLDOWN) {
      return // Skip se muito recente
    }
    this.lastPreload = now
    const criticalPages = [
      '/dashboard/aquisicao',
      '/dashboard/cantinas', 
      '/dashboard/eventos-especiais',
      '/dashboard/jovens',
      '/dashboard/melhorias',
      '/dashboard/missoes'
    ]

    // Pré-carregar em paralelo mas com delay para não sobrecarregar
    for (let i = 0; i < criticalPages.length; i++) {
      setTimeout(() => {
        this.preloadPage(criticalPages[i])
      }, i * 200) // 200ms entre cada pré-carregamento
    }
  }

  // Pré-carregar APIs críticas
  async preloadCriticalAPIs() {
    const criticalAPIs = [
      '/api/categories',
      '/api/dashboard/stats',
      '/api/church/avatar'
    ]

    try {
      // Fazer chamadas em paralelo para aquecer cache
      await Promise.allSettled(
        criticalAPIs.map(api => 
          fetch(api, { 
            credentials: 'include',
            // Apenas para cache, não aguardar resposta
            signal: AbortSignal.timeout(5000)
          }).catch(() => {}) // Ignorar erros
        )
      )
    } catch {
      // Ignorar erros de pré-carregamento
    }
  }

  private async preloadPage(path: string) {
    if (this.preloadedPages.has(path) || this.preloadPromises.has(path)) {
      return
    }

    const promise = this.loadPageInBackground(path)
    this.preloadPromises.set(path, promise)
    
    try {
      await promise
      this.preloadedPages.add(path)
    } catch {
      // Ignorar erros de pré-carregamento
    } finally {
      this.preloadPromises.delete(path)
    }
  }

  private async loadPageInBackground(path: string): Promise<void> {
    try {
      // Usar fetch para triggar compilação do Next.js
      await fetch(path, {
        method: 'HEAD', // Apenas headers, sem body
        credentials: 'include'
      })
    } catch {
      // Ignorar erros
    }
  }

  // Verificar se página foi pré-carregada
  isPreloaded(path: string): boolean {
    return this.preloadedPages.has(path)
  }

  // Pré-carregar página específica sob demanda
  async preloadSpecific(path: string): Promise<void> {
    if (!this.preloadedPages.has(path)) {
      return this.preloadPage(path)
    }
  }
}

// Instância global
export const pagePreloader = new PagePreloader()

// Hook para usar o preloader
export function usePagePreloader() {
  const triggerPreload = () => {
    // Aguardar um pouco para não interferir com navegação atual
    setTimeout(() => {
      pagePreloader.preloadCriticalPages()
      pagePreloader.preloadCriticalAPIs()
    }, 1000)
  }

  return {
    triggerPreload,
    preloadSpecific: pagePreloader.preloadSpecific.bind(pagePreloader),
    isPreloaded: pagePreloader.isPreloaded.bind(pagePreloader)
  }
}