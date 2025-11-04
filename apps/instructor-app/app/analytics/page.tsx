"use client"

import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          <PageHeader
            title="Analytics Global"
            subtitle="Visualiza métricas agregadas de todos tus programas y cohortes"
          />

          <EmptyState
            icon={BarChart3}
            title="Analytics en construcción"
            description="Pronto podrás ver métricas agregadas, comparaciones entre programas y análisis de tendencias."
          />
        </div>
      </main>
    </div>
  )
}
