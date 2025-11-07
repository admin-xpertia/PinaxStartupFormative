"use client"

import { useState } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { StatsCard } from "@/components/stats-card"
import { ProgramCard } from "@/components/program-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, BookOpen } from "lucide-react"
import { ProgramWizard } from "@/components/wizard/program-wizard"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { fetcher } from "@/lib/fetcher"
import { programsApi } from "@/services/api"

const filters = ["Todos", "Publicados", "Borradores", "Archivados"] as const
type FilterType = (typeof filters)[number]

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("Todos")
  const [showWizard, setShowWizard] = useState(false)
  const { sidebarCollapsed } = useUIStore()

  // Fetch programs and stats from API
  const { data: programs, error: programsError, isLoading: loadingPrograms, mutate } = useSWR(
    'programs',
    programsApi.getAll
  )
  const { data: stats, error: statsError, isLoading: loadingStats } = useSWR(
    '/api/v1/dashboard/stats',
    fetcher
  )

  // Show loading state
  if (loadingPrograms || loadingStats) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <Sidebar />
        <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
          <LoadingState text="Cargando dashboard..." />
        </main>
      </div>
    )
  }

  // Show error state
  if (programsError || statsError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <Sidebar />
        <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
          <ErrorState
            message={programsError?.message || statsError?.message || "Error al cargar datos"}
            retry={() => {
              mutate()
            }}
          />
        </main>
      </div>
    )
  }

  const programList = Array.isArray(programs) ? programs : []

  const filteredPrograms = programList.filter((program: any) => {
    if (activeFilter === "Todos") return true
    if (activeFilter === "Publicados") return program.estado === "publicado"
    if (activeFilter === "Borradores") return program.estado === "draft"
    if (activeFilter === "Archivados") return program.estado === "archivado"
    return true
  })

  // Transform stats to match StatsCard format
  const quickStats = stats ? [
    {
      metrica: "programas",
      label: "Programas Totales",
      valor: (stats as any).totalPrograms?.toString() || "0",
      descripcion: "Programas creados",
      tendencia: "neutral" as const,
      icono: "BookOpen" as const,
    },
    {
      metrica: "estudiantes",
      label: "Estudiantes Activos",
      valor: (stats as any).totalStudents?.toString() || "0",
      descripcion: "En todas las cohortes",
      tendencia: "neutral" as const,
      icono: "Users" as const,
    },
    {
      metrica: "cohortes",
      label: "Cohortes Activas",
      valor: (stats as any).activeCohortes?.toString() || "0",
      descripcion: "En progreso",
      tendencia: "neutral" as const,
      icono: "Calendar" as const,
    },
    {
      metrica: "completacion",
      label: "Tasa de Completación",
      valor: `${(stats as any).avgCompletionRate || 0}%`,
      descripcion: "Promedio general",
      tendencia: "neutral" as const,
      icono: "TrendingUp" as const,
    },
  ] : []

  const handleCreateProgram = (data: unknown) => {
    console.log("[Dashboard] Program created:", data)
    setShowWizard(false)
    mutate() // Revalidate programs list
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
