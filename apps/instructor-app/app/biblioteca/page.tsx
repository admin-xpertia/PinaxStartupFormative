"use client"

import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileCode, BookOpen, Sparkles } from "lucide-react"
import Link from "next/link"

export default function BibliotecaPage() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          <PageHeader title="Biblioteca de Recursos" subtitle="Accede a templates, ejemplos y recursos compartidos" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/biblioteca/templates">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Templates de Prompts</h3>
                    <p className="text-xs text-muted-foreground">Reutiliza configuraciones</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Guarda y reutiliza configuraciones exitosas de generación de contenido con IA
                </p>
                <Button variant="secondary" size="sm" className="w-full">
                  Ver Templates
                </Button>
              </Card>
            </Link>

            <Card className="p-6 opacity-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Ejemplos de Contenido</h3>
                  <p className="text-xs text-muted-foreground">Próximamente</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Explora ejemplos de lecciones, cuadernos y simulaciones de alta calidad
              </p>
              <Button variant="secondary" size="sm" className="w-full" disabled>
                Próximamente
              </Button>
            </Card>

            <Card className="p-6 opacity-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Recursos Compartidos</h3>
                  <p className="text-xs text-muted-foreground">Próximamente</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Accede a recursos compartidos por otros instructores del equipo
              </p>
              <Button variant="secondary" size="sm" className="w-full" disabled>
                Próximamente
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
