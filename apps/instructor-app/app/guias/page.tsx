"use client"

import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { HelpCircle } from "lucide-react"

export default function GuiasPage() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          <PageHeader title="Guías y Tutoriales" subtitle="Aprende a usar Xpertia al máximo" />

          <EmptyState
            icon={HelpCircle}
            title="Guías en construcción"
            description="Pronto encontrarás tutoriales paso a paso, mejores prácticas y casos de uso para aprovechar al máximo la plataforma."
          />
        </div>
      </main>
    </div>
  )
}
