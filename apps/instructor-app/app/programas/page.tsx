'use client';

import { useMemo, useState } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { ProgramCard } from "@/components/program-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/shared/loading-state"
import { Plus, Search, Filter, Grid, List } from "lucide-react"
import { ProgramWizard } from "@/components/wizard/program-wizard"
import type { Program } from "@/types/program"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || "Error al cargar los programas")
  }
  return response.json()
}

const filters = ["Todos", "Publicados", "Borradores", "Archivados"] as const
type FilterType = (typeof filters)[number]

export default function ProgramasPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("Todos")
  const [showWizard, setShowWizard] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const { sidebarCollapsed } = useUIStore()

  const {
    data: programas,
    error,
    isLoading,
    mutate,
  } = useSWR<Program[]>("/api/v1/programas", fetcher, { revalidateOnFocus: false })

  const programasList = programas ?? []

  const filteredPrograms = useMemo(() => {
    return programasList.filter((program) => {
      if (activeFilter === "Todos") return true
      if (activeFilter === "Publicados") return program.estado === "publicado"
      if (activeFilter === "Borradores") return program.estado === "draft"
      if (activeFilter === "Archivados") return program.estado === "archivado"
      return true
    })
  }, [programasList, activeFilter])

  const handleCreateProgram = (nuevoPrograma: unknown) => {
    setShowWizard(false)
    mutate()
  }

  const headerSubtitle = isLoading
    ? "Cargando tus programas..."
    : error
      ? "No pudimos cargar tus programas"
      : `${filteredPrograms.length} programas en total`

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          <PageHeader
            title="Mis Programas"
            subtitle={headerSubtitle}
            actions={
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Programa
              </Button>
            }
          />

          {isLoading && <LoadingState text="Cargando tus programas..." />}

          {!isLoading && error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Error al cargar los programas: {error.message}
            </div>
          )}

          {!isLoading && !error && (
            <>
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

              <div className={cn(viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6")}>
                {filteredPrograms.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>

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
            </>
          )}
        </div>
      </main>

      {showWizard && <ProgramWizard onClose={() => setShowWizard(false)} onComplete={handleCreateProgram} />}
    </div>
  )
}
