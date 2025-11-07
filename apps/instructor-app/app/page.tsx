"use client"

import { useState } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { StatsCard } from "@/components/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, BookOpen, Users, BarChart3, Sparkles, Layers } from "lucide-react"
import { ProgramWizard } from "@/components/wizard/program-wizard"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { programsApi } from "@/services/api"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [showWizard, setShowWizard] = useState(false)
  const { sidebarCollapsed } = useUIStore()
  const router = useRouter()

  // Fetch programs
  const { data: programs, error, isLoading, mutate } = useSWR(
    'programs',
    programsApi.getAll
  )

  const programsList = programs ?? []

  // Calculate stats
  const stats = {
    totalPrograms: programsList.length,
    draftPrograms: programsList.filter(p => p.estado === 'borrador').length,
    publishedPrograms: programsList.filter(p => p.estado === 'publicado').length,
    totalStudents: 0, // TODO: Implement when students API is ready
  }

  const handleCreateProgram = () => {
    setShowWizard(false)
    mutate()
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-8 border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Xpertia Classroom</h1>
                <p className="text-lg text-muted-foreground">
                  Crea experiencias de aprendizaje potenciadas por IA
                </p>
              </div>
              <Button size="lg" onClick={() => setShowWizard(true)} className="gap-2">
                <Plus className="h-5 w-5" />
                Crear Nuevo Programa
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              stat={{
                metrica: stats.totalPrograms.toString(),
                label: "Programas Totales",
                icono: "BookOpen",
                tendencia: stats.totalPrograms > 0 ? `${stats.totalPrograms} activos` : undefined,
              }}
            />
            <StatsCard
              stat={{
                metrica: stats.draftPrograms.toString(),
                label: "Borradores",
                icono: "BookOpen",
              }}
            />
            <StatsCard
              stat={{
                metrica: stats.publishedPrograms.toString(),
                label: "Publicados",
                icono: "BookOpen",
                tendencia: stats.publishedPrograms > 0 ? "Disponibles" : undefined,
              }}
            />
            <StatsCard
              stat={{
                metrica: stats.totalStudents.toString(),
                label: "Estudiantes",
                icono: "Users",
              }}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Create Program */}
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setShowWizard(true)}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Crear Programa</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Inicia el asistente para crear un nuevo programa educativo con fases, proof points y ejercicios de IA
                </CardDescription>
              </CardContent>
            </Card>

            {/* Manage Programs */}
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/programas')}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">Mis Programas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ver y gestionar todos tus programas, editar estructura, agregar fases y proof points
                </CardDescription>
              </CardContent>
            </Card>

            {/* View Analytics */}
            <Card className="cursor-pointer hover:border-primary/50 transition-colors opacity-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Próximamente: Visualiza el progreso de tus estudiantes y métricas de aprendizaje
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Recent Programs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Programas Recientes</CardTitle>
                  <CardDescription>Tus últimos programas creados</CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/programas">Ver Todos</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="mt-2 text-sm text-muted-foreground">Cargando programas...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive">Error al cargar programas</p>
                </div>
              )}

              {!isLoading && !error && programsList.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay programas aún</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comienza creando tu primer programa educativo
                  </p>
                  <Button onClick={() => setShowWizard(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Programa
                  </Button>
                </div>
              )}

              {!isLoading && !error && programsList.length > 0 && (
                <div className="space-y-3">
                  {programsList.slice(0, 5).map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(`/programas/${program.id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{program.nombre}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {program.descripcion}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium capitalize">{program.estado}</div>
                          <div className="text-xs text-muted-foreground">
                            {program.duracionSemanas} semanas
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/programas/${program.id}/estructura`}>
                            <Layers className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Getting Started Guide */}
          {programsList.length === 0 && !isLoading && (
            <Card className="border-dashed">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Guía de Inicio Rápido</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Crear un Programa</h4>
                      <p className="text-sm text-muted-foreground">
                        Define el nombre, descripción y duración de tu programa educativo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Agregar Fases</h4>
                      <p className="text-sm text-muted-foreground">
                        Organiza tu programa en bloques temáticos de aprendizaje
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Definir Proof Points</h4>
                      <p className="text-sm text-muted-foreground">
                        Establece los hitos de aprendizaje específicos para cada fase
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Seleccionar Ejercicios</h4>
                      <p className="text-sm text-muted-foreground">
                        Elige entre 10 tipos de ejercicios potenciados por IA para cada proof point
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {showWizard && (
        <ProgramWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleCreateProgram}
        />
      )}
    </div>
  )
}
