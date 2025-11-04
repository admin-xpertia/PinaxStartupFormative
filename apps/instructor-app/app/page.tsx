"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { StatsCard } from "@/components/stats-card"
import { ProgramCard } from "@/components/program-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter } from "lucide-react"
import { programs, quickStats } from "@/lib/mock-data"
import { ProgramWizard } from "@/components/wizard/program-wizard"
import type { ProgramFormData } from "@/types/wizard"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"

const filters = ["Todos", "Publicados", "Borradores", "Archivados"] as const
type FilterType = (typeof filters)[number]

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("Todos")
  const [showWizard, setShowWizard] = useState(false)
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
    // TODO: Save program to backend
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      {/* Main Content */}
      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          <PageHeader
            title="Dashboard"
            subtitle="Bienvenida de nuevo, María. Aquí está el resumen de tu actividad."
            actions={
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Programa
              </Button>
            }
          />

          {/* Quick Stats */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStats.map((stat, index) => (
                <StatsCard key={index} stat={stat} />
              ))}
            </div>
          </section>

          {/* Programs Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mis Programas</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar programas..." className="pl-9 w-[300px]" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
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

            {/* Program Cards */}
            <div className="grid grid-cols-1 gap-6">
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
          </section>
        </div>
      </main>

      {/* Wizard Modal */}
      {showWizard && <ProgramWizard onClose={() => setShowWizard(false)} onComplete={handleCreateProgram} />}
    </div>
  )
}
