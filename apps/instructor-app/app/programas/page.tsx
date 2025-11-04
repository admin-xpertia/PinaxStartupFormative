"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { ProgramCard } from "@/components/program-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Grid, List } from "lucide-react"
import { programs } from "@/lib/mock-data"
import { ProgramWizard } from "@/components/wizard/program-wizard"
import type { ProgramFormData } from "@/types/wizard"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"

const filters = ["Todos", "Publicados", "Borradores", "Archivados"] as const
type FilterType = (typeof filters)[number]

export default function ProgramasPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("Todos")
  const [showWizard, setShowWizard] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const { sidebarCollapsed } = useUIStore()

  const filteredPrograms = programs.filter((program) => {
    if (activeFilter === "Todos") return true
    if (activeFilter === "Publicados") return program.estado === "publicado"
    if (activeFilter === "Borradores") return program.estado === "draft"
    if (activeFilter === "Archivados") return program.estado === "archivado"
    return true
  })

  const handleCreateProgram = (data: ProgramFormData) => {
    console.log("[v0] Program created:", data)
    setShowWizard(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          <PageHeader
            title="Mis Programas"
            subtitle={`${filteredPrograms.length} programas en total`}
            actions={
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Programa
              </Button>
            }
          />

          {/* Filters and Search */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar programas..." className="pl-9 w-[300px]" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Program Cards */}
          <div className={cn(viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6")}>
            {filteredPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>

          {/* Empty State */}
          {filteredPrograms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay programas en esta categoría</h3>
              <p className="text-muted-foreground mb-4">Comienza creando tu primer programa de aprendizaje</p>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Tu Primer Programa
              </Button>
            </div>
          )}
        </div>
      </main>

      {showWizard && <ProgramWizard onClose={() => setShowWizard(false)} onComplete={handleCreateProgram} />}
    </div>
  )
}
