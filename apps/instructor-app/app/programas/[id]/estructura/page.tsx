"use client"

import { use, useState } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Layers, Target, Sparkles, Check } from "lucide-react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { programsApi, fasesApi } from "@/services/api"
import type { Program } from "@/types/program"
import type { FaseResponse } from "@/types/api"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { FaseManager, ProofPointManager } from "@/components/program"
import { ExerciseSelector } from "@/components/exercises"
import { toast } from "sonner"

export default function ProgramEstructuraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params)
  // Decode the URL parameter to get the actual program ID
  const id = decodeURIComponent(rawId)
  const router = useRouter()
  const { sidebarCollapsed } = useUIStore()
  const [selectedFaseId, setSelectedFaseId] = useState<string | null>(null)
  const [fasesRefreshKey, setFasesRefreshKey] = useState(0)

  // Load program
  const {
    data: program,
    error: programError,
    isLoading: programLoading,
  } = useSWR<Program>(id ? `program-${id}` : null, () => (id ? programsApi.getById(id) : null))

  // Load fases
  const {
    data: fases,
    error: fasesError,
    isLoading: fasesLoading,
    mutate: mutateFases,
  } = useSWR<FaseResponse[]>(
    id ? `fases-${id}-${fasesRefreshKey}` : null,
    () => (id ? fasesApi.getByProgram(id) : null)
  )

  const handleFaseCreated = () => {
    setFasesRefreshKey(prev => prev + 1)
    toast.success("Fase creada exitosamente")
  }

  const handleFaseUpdated = () => {
    setFasesRefreshKey(prev => prev + 1)
    toast.success("Fase actualizada exitosamente")
  }

  const handleFaseDeleted = () => {
    setFasesRefreshKey(prev => prev + 1)
    setSelectedFaseId(null)
    toast.success("Fase eliminada exitosamente")
  }

  if (programLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <Sidebar />
        <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
          <LoadingState text="Cargando programa..." />
        </main>
      </div>
    )
  }

  if (programError || !program) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <Sidebar />
        <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
          <div className="p-6">
            <ErrorState message="Error al cargar el programa" retry={() => window.location.reload()} />
          </div>
        </main>
      </div>
    )
  }

  const selectedFase = fases?.find(f => f.id === selectedFaseId)

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />

      <main className={cn("pt-16 transition-all duration-300", sidebarCollapsed ? "ml-[70px]" : "ml-[280px]")}>
        <div className="p-6 space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" asChild className="mb-2">
                <Link href={`/programas/${id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Programa
                </Link>
              </Button>
              <PageHeader
                title={`Estructura - ${program.nombre}`}
                subtitle="Gestiona fases, proof points y ejercicios"
              />
            </div>
            <div className="flex gap-2">
              {program.estado === "borrador" && (
                <Button onClick={() => {
                  // TODO: Implement publish
                  toast.info("Funcionalidad de publicación próximamente")
                }}>
                  <Check className="mr-2 h-4 w-4" />
                  Publicar Programa
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Fases */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Fases del Programa
                  </CardTitle>
                  <CardDescription>
                    {fases?.length || 0} fase{fases?.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FaseManager
                    programId={id}
                    onFaseCreated={handleFaseCreated}
                    onFaseUpdated={handleFaseUpdated}
                    onFaseDeleted={handleFaseDeleted}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Proof Points & Exercises */}
            <div className="lg:col-span-2 space-y-6">
              {!fases || fases.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Layers className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Comienza creando fases</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                      Las fases son los bloques principales de tu programa. Una vez creadas,
                      podrás agregar proof points y ejercicios.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs value={selectedFaseId || fases[0]?.id} onValueChange={setSelectedFaseId}>
                  <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 h-auto">
                    {fases.map((fase, index) => (
                      <TabsTrigger
                        key={fase.id}
                        value={fase.id}
                        className="whitespace-normal h-auto py-3"
                      >
                        <div className="text-left w-full">
                          <Badge variant="outline" className="mb-1">Fase {index + 1}</Badge>
                          <div className="font-medium text-sm truncate">{fase.nombre}</div>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {fases.map(fase => (
                    <TabsContent key={fase.id} value={fase.id} className="space-y-6">
                      {/* Proof Points Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Proof Points
                          </CardTitle>
                          <CardDescription>
                            Hitos de aprendizaje de la fase "{fase.nombre}"
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ProofPointManager
                            faseId={fase.id}
                            faseName={fase.nombre}
                          />
                        </CardContent>
                      </Card>

                      {/* Exercises Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Ejercicios
                          </CardTitle>
                          <CardDescription>
                            Selecciona ejercicios para cada proof point de esta fase
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Show exercises organized by proof point */}
                          {fasesLoading ? (
                            <LoadingState text="Cargando proof points..." />
                          ) : (
                            <div className="space-y-8">
                              <p className="text-sm text-muted-foreground">
                                Selecciona un proof point de la lista arriba para agregar ejercicios
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
