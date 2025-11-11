"use client"

import { use, useState } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Users, Layers, Target, Clock, Rocket, Loader2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import type { Program } from "@/types/program"
import { programsApi } from "@/services/api"
import { toast } from "sonner"

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params)
  // Decode the URL parameter to get the actual program ID
  const id = decodeURIComponent(rawId)
  const {
    data: program,
    error,
    isLoading,
    mutate,
  } = useSWR<Program>(id ? `program-${id}` : null, () => (id ? programsApi.getById(id) : null))
  const [publishing, setPublishing] = useState(false)

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <LoadingState text="Cargando programa..." />
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <ErrorState message={error.message || "Error al cargar el programa"} retry={() => mutate()} />
          </main>
        </div>
      </div>
    )
  }

  if (!program) {
    notFound()
  }

  const programId = program.id ?? id
  const stats = program.estadisticas ?? {
    fases: 0,
    proof_points: 0,
    duracion: "-",
    estudiantes: 0,
  }
  const isPublished = program.estado === "publicado"

  const handlePublish = async () => {
    try {
      setPublishing(true)
      await programsApi.publish(programId)
      await mutate()
      toast.success("Programa publicado", {
        description: "Ahora puedes crear una cohorte desde Cohortes.",
      })
    } catch (err: any) {
      toast.error("No se pudo publicar", {
        description: err?.message || "Inténtalo nuevamente.",
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <Breadcrumbs />

            <PageHeader
              title={program.nombre}
              description={program.descripcion}
              actions={
                <div className="flex items-center gap-2">
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Publicado" : "Borrador"}
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/programas/${programId}/estructura`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Estructura
                    </Link>
                  </Button>
                  {!isPublished && (
                    <Button size="sm" onClick={handlePublish} disabled={publishing}>
                      {publishing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Rocket className="mr-2 h-4 w-4" />
                      )}
                      Publicar Programa
                    </Button>
                  )}
                </div>
              }
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    Fases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.fases}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Proof Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.proof_points}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Duración
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.duracion}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Estudiantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.estudiantes}</div>
                </CardContent>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
