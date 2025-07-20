"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from 'next/image';
import {
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { Coffee, Heart, Wrench, Users, Calendar, ShoppingCart, LogOut, Folder, Menu, Home, ChevronDown, ChevronRight, X } from "lucide-react";
import { CategoriesProvider, useCategories } from "@/components/ui/categories-context";
import { ChurchProfileProvider, useChurchProfile } from '@/components/ui/church-profile-context';
import type { User } from '@/lib/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Coffee, Heart, Wrench, Users, Calendar, ShoppingCart, Folder };

// Função removida - não era necessária

function SidebarMenuContent({ 
  user, 
  pathname, 
  router,
  setSidebarOpen,
  openCategories, 
  setOpenCategories,
  logout 
}: {
  user: User | null;
  pathname: string;
  router: AppRouterInstance;
  setSidebarOpen: (open: boolean) => void;
  openCategories: boolean;
  setOpenCategories: (open: boolean) => void;
  logout: () => Promise<void>;
}) {
  const { categories, loading } = useCategories();
  const { image: churchImage } = useChurchProfile();
  const isActive = (slug: string) => pathname === `/dashboard/${slug}` || pathname.startsWith(`/dashboard/${slug}/`);
  
  return (
    <>
      <SidebarHeader>
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="relative h-12 w-12 rounded-full shadow-lg border-2 border-cream-400 bg-cream-100 ring-2 ring-cream-500 overflow-hidden flex items-center justify-center">
            {churchImage ? (
              <Image 
                src={churchImage} 
                alt="Logo da igreja" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 48px, 56px"
              />
            ) : (
              <span className="text-gray-400">Logo</span>
            )}
          </div>
          <span className="font-semibold text-base text-primary-800 text-center truncate max-w-[10rem] drop-shadow-sm tracking-wide">{user?.name}</span>
          <span className="text-xs text-primary-600 text-center truncate max-w-[10rem] tracking-wide">{user?.email}</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 min-h-0 px-2 overflow-hidden gap-1 md:gap-2 bg-gradient-to-b from-cream-50 via-cream-100 to-cream-50 border-r border-cream-200 shadow-xl">
        <SidebarMenu className="mb-1">
          {/* Dashboard */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { router.push("/dashboard"); setSidebarOpen(false); }}
              isActive={pathname === "/dashboard"}
              className={`rounded-lg px-2 py-1 font-medium transition-all duration-200 text-[15px] flex items-center group ${pathname === "/dashboard" ? 'bg-cream-200 border-l-4 border-[2.5px] border-cream-500 text-primary-800 shadow-md' : 'hover:bg-cream-100 hover:shadow-sm text-primary-700'}`}
            >
              <Home className="mr-2 w-5 h-5 text-primary-700 group-hover:text-cream-700 transition-all duration-200 drop-shadow-sm" />
              <span className="truncate">Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="my-1 border-cream-200" />
        {/* Categorias com submenu */}
        <SidebarMenu className="mb-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpenCategories(!openCategories)}
              isActive={pathname.startsWith("/dashboard/") && categories.some(cat => pathname.includes(cat.slug))}
              className="rounded-lg px-2 py-1 font-medium transition-all duration-200 hover:bg-cream-100 hover:shadow-sm flex items-center justify-between text-[15px] text-primary-700 group"
            >
              <div className="flex items-center">
                <Folder className="mr-2 w-5 h-5 text-primary-700 group-hover:text-cream-700 transition-all duration-200 drop-shadow-sm" />
                <span className="truncate">Categorias</span>
              </div>
              {openCategories ? <ChevronDown className="w-4 h-4 ml-2 text-cream-700" /> : <ChevronRight className="w-4 h-4 ml-2 text-cream-700" />}
            </SidebarMenuButton>
            {openCategories && (
              <ul className="ml-4 mt-1 space-y-0.5">
                {loading ? (
                  <li className="text-xs text-gray-500 px-2 py-1">Carregando categorias...</li>
                ) : categories.filter(cat => cat.slug && cat.slug !== 'null' && cat.slug !== 'undefined').length === 0 ? (
                  <li className="text-xs text-gray-500 px-2 py-1">Nenhuma categoria encontrada</li>
                ) : (
                  categories.filter(cat => cat.slug && cat.slug !== 'null' && cat.slug !== 'undefined').map((cat) => {
                    const Icon = iconMap[cat.icon] || Coffee;
                    return (
                      <li key={cat.id}>
                        <SidebarMenuButton
                          onClick={() => { router.push(`/dashboard/${cat.slug}`); setSidebarOpen(false); }}
                          isActive={isActive(cat.slug)}
                          className={`rounded-lg px-2 py-1 font-medium transition-all duration-200 text-xs flex items-center group ${isActive(cat.slug) ? 'bg-cream-200 border-l-4 border-[2.5px] border-cream-500 text-primary-800 shadow-md' : 'hover:bg-cream-100 hover:shadow-sm text-primary-700'}`}
                        >
                          <Icon className="mr-2 w-4 h-4 text-primary-700 group-hover:text-cream-700 transition-all duration-200 drop-shadow-sm" />
                          <span className="truncate text-xs">{cat.name}</span>
                        </SidebarMenuButton>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Administração */}
        {(user?.role === "root" || user?.role === "admin" || user?.role === "editor") && (
          <>
            <SidebarSeparator className="my-1 border-cream-200" />
            <SidebarMenu className="mb-1">
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => { router.push("/dashboard/perfil-igreja"); setSidebarOpen(false); }} isActive={pathname === "/dashboard/perfil-igreja"} className={`rounded-lg px-2 py-1 font-medium transition-all duration-200 text-[15px] flex items-center group ${pathname === "/dashboard/perfil-igreja" ? 'bg-cream-200 border-l-4 border-[2.5px] border-cream-500 text-primary-800 shadow-md' : 'hover:bg-cream-100 hover:shadow-sm text-primary-700'}`}> <Home className="mr-2 w-5 h-5 text-primary-700 group-hover:text-cream-700 transition-all duration-200 drop-shadow-sm" /> Perfil da Igreja </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.role === 'root' && (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => { router.push("/dashboard/users"); setSidebarOpen(false); }} isActive={pathname === "/dashboard/users"} className={`rounded-lg px-2 py-1 font-medium transition-all duration-200 text-[15px] flex items-center group ${pathname === "/dashboard/users" ? 'bg-cream-200 border-l-4 border-[2.5px] border-cream-500 text-primary-800 shadow-md' : 'hover:bg-cream-100 hover:shadow-sm text-primary-700'}`}> <Users className="mr-2 w-5 h-5 text-primary-700 group-hover:text-cream-700 transition-all duration-200 drop-shadow-sm" /> Usuários </SidebarMenuButton>
              </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => { router.push("/dashboard/categories"); setSidebarOpen(false); }} isActive={pathname === "/dashboard/categories"} className={`rounded-lg px-2 py-1 font-medium transition-all duration-200 text-[15px] flex items-center group ${pathname === "/dashboard/categories" ? 'bg-cream-200 border-l-4 border-[2.5px] border-cream-500 text-primary-800 shadow-md' : 'hover:bg-cream-100 hover:shadow-sm text-primary-700'}`}> <Wrench className="mr-2 w-5 h-5 text-primary-700 group-hover:text-cream-700 transition-all duration-200 drop-shadow-sm" /> Categorias </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="px-2 pb-4 pt-3 border-t border-cream-200 flex-shrink-0 mt-2 bg-cream-50">
        <SidebarMenuButton onClick={async () => { await logout(); document.cookie = "session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"; window.location.href = "/login"; }} className="w-full flex items-center justify-center gap-2 text-white bg-red-500 hover:bg-red-600 hover:text-white rounded-lg py-2 text-sm font-medium transition-colors shadow-md">
          <LogOut className="w-5 h-5" /> Sair
        </SidebarMenuButton>
      </SidebarFooter>
    </>
  );
}

// Componente interno que usa os hooks corretamente
function DashboardContent({ children, user, logout }: { children: React.ReactNode; user: User | null; logout: () => Promise<void> }) {
  const { image: churchImage } = useChurchProfile(); // ✅ Agora dentro do Provider
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [openCategories, setOpenCategories] = React.useState(true);
  const [headerOpacity, setHeaderOpacity] = React.useState(90);

  // Monitor sidebar state changes
  React.useEffect(() => {
    // Optional: Add analytics or logging here
  }, [sidebarOpen]);

  // Efeito de opacidade no scroll
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const opacity = Math.max(70, 95 - scrollY * 0.05);
      setHeaderOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fechar sidebar ao clicar fora (overlay)
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <CategoriesProvider>
        {/* SidebarProvider NECESSÁRIO para useSidebar() hooks */}
        <SidebarProvider 
          open={sidebarOpen} 
          onOpenChange={setSidebarOpen}
        >
          <div className="min-h-screen w-full bg-gray-100 flex overflow-x-hidden relative">
          
          {/* HEADER FIXO - APENAS MOBILE */}
          <header 
            className={`md:hidden fixed top-0 left-0 right-0 z-[9999] border-b border-gray-200 shadow-sm transition-all duration-300 ${
              sidebarOpen ? '' : 'backdrop-blur-sm'
            }`}
            style={{ 
              backgroundColor: sidebarOpen 
                ? 'rgb(255, 255, 255)' 
                : `rgba(255, 255, 255, ${headerOpacity / 100})`
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              {/* MENU HAMBÚRGUER - TOGGLE */}
              <button
                className="md:hidden bg-primary-600 hover:bg-primary-700 rounded-lg p-2 transition-all duration-200 transform active:scale-95"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
                type="button"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
              
              {/* LOGO CENTRO - CONSISTENTE COM SIDEBAR */}
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full shadow-md border border-cream-300 bg-cream-50 ring-1 ring-cream-400 overflow-hidden flex items-center justify-center">
                  {churchImage ? (
                    <Image 
                      src={churchImage} 
                      alt="Logo da igreja" 
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Logo</span>
                  )}
                </div>
                <span className="font-semibold text-primary-800 text-sm hidden sm:block">Igreja Assembléia de Deus</span>
              </div>
              
              {/* ESPAÇO DIREITA (para balanceamento) */}
              <div className="w-9 h-9 md:hidden"></div>
            </div>
          </header>

          {/* SIDEBAR DESKTOP - FIXA */}
          <aside className="hidden md:flex fixed top-0 left-0 h-screen w-56 md:w-60 bg-white shadow-md border-r border-gray-100 flex-col z-20">
            <SidebarMenuContent
              user={user}
              pathname={pathname}
              router={router}
              setSidebarOpen={setSidebarOpen}
              openCategories={openCategories}
              setOpenCategories={setOpenCategories}
              logout={logout}
            />
          </aside>

          {/* OVERLAY MOBILE - AGORA SEMPRE DISPONÍVEL */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-70 z-[65] md:hidden backdrop-blur-sm"
              onClick={closeSidebar}
              onTouchStart={closeSidebar}
            />
          )}

          {/* SIDEBAR MOBILE */}
          <aside 
            className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-xl border-r border-cream-200 z-[75] md:hidden transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Header do drawer com botão fechar - DESIGN CREAM */}
            <div className="flex items-center justify-between p-4 border-b border-cream-200 bg-cream-50">
              <span className="font-semibold text-primary-800">Menu</span>
              <button
                onClick={closeSidebar}
                className="p-2 rounded-lg hover:bg-cream-100 transition-colors text-primary-700"
                aria-label="Fechar menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Conteúdo da sidebar */}
            <div className="flex-1 overflow-y-auto">
              <SidebarMenuContent
                user={user}
                pathname={pathname}
                router={router}
                setSidebarOpen={setSidebarOpen}
                openCategories={openCategories}
                setOpenCategories={setOpenCategories}
                logout={logout}
              />
            </div>
          </aside>

          {/* CONTEÚDO PRINCIPAL */}
          <div className="flex-1 flex flex-col min-h-screen w-full md:ml-60 pt-16 md:pt-0 p-2 sm:p-4 md:p-8 transition-all">
            <main className="flex-1 flex flex-col items-center justify-start w-full">
              <section className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-200 p-2 sm:p-4 md:p-10 mt-2 md:mt-6">
                {children}
              </section>
            </main>
          </div>
          </div>
        </SidebarProvider>
      </CategoriesProvider>
  );
}

// Componente principal - estrutura correta dos Providers
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  
  return (
    <ChurchProfileProvider>
      <DashboardContent user={user} logout={logout}>
        {children}
      </DashboardContent>
    </ChurchProfileProvider>
  );
} 