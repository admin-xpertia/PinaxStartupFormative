"use client"

import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { TemplateLibrary } from "@/components/fase3/template-library"

export default function TemplatesPage() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />
          <TemplateLibrary />
        </div>
      </main>
    </div>
  )
}
