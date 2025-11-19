"use client"

import { use, useState, useEffect } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { notFound } from "next/navigation"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import type { Program } from "@/types/program"
import { programsApi } from "@/services/api"
import { toast } from "sonner"
import { PedagogicalAssistantModal } from "@/components/assistant/PedagogicalAssistantModal"
import type { CohortAnalyticsResponse } from "./types"
import { ProgramActionBar } from "./components/ProgramActionBar"
import { ProgramMetrics, type ProgramMetric } from "./components/ProgramMetrics"
import { ProgramAnalyticsGrid } from "./components/ProgramAnalyticsGrid"

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
  const {
    data: analytics,
    error: analyticsError,
    isLoading: analyticsLoading,
    isValidating: analyticsValidating,
    mutate: mutateAnalytics,
  } = useSWR<CohortAnalyticsResponse>(
    id ? `/api/cohorts/${encodeURIComponent(id)}/analytics` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 0, dedupingInterval: 30_000, keepPreviousData: true, revalidateOnReconnect: false },
  )
  const [publishing, setPublishing] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  const ejerciciosCount = program?.estadisticas?.ejercicios ?? 0
  const proofPointsCount = program?.estadisticas?.proof_points ?? 0
  const stats = {
    fases: program?.estadisticas?.fases ?? 0,
    proof_points: proofPointsCount,
    ejercicios: ejerciciosCount,
    duracion: program?.estadisticas?.duracion ?? "-",
    estudiantes: program?.estadisticas?.estudiantes ?? 0,
  }
  const isPublished = program?.estado === "publicado"
  const programId = program?.id ?? id
  const submissions = analytics?.submissions ?? []
  const atRiskStudents = analytics?.atRiskStudents ?? []
  const phases = analytics?.phases ?? []
  const proofPoints = analytics?.proofPoints ?? []
  const pendingReviews = submissions.filter(
    (item) => item.status === "submitted_for_review" || item.status === "pending_review",
  ).length
  const totalStudents = analytics?.totalStudents ?? stats.estudiantes
  const scoreAverages = phases.filter((phase) => typeof phase.promedioScore === "number")
  const globalScore =
    scoreAverages.length > 0
      ? Math.round(
          scoreAverages.reduce((acc, phase) => acc + (phase.promedioScore || 0), 0) /
            scoreAverages.length,
        )
      : null
  const kpis: ProgramMetric[] = [
    {
      label: "Estudiantes activos",
      value: analyticsLoading ? "..." : totalStudents.toString(),
      helper: "Inscritos en la cohorte",
    },
    {
      label: "Entregas pendientes",
      value: analyticsLoading ? "..." : pendingReviews.toString(),
      helper: "Listas para calificar",
      variant: "warning" as const,
    },
    {
      label: "Promedio general",
      value: analyticsLoading ? "..." : globalScore !== null ? `${globalScore}%` : "--",
      helper: "Score IA + instructores",
    },
  ]
  const isRefreshingAnalytics = analyticsLoading || analyticsValidating

  // Auto-launch assistant if no exercises and has proof points
  useEffect(() => {
    if (!program || isLoading || error) {
      return
    }

    if (ejerciciosCount === 0 && proofPointsCount > 0 && !isPublished) {
      setIsAssistantOpen(true)
    }
  }, [program, isLoading, error, ejerciciosCount, proofPointsCount, isPublished])

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

  const handlePublish = async () => {
    try {
      setPublishing(true)
      await programsApi.publish(programId)
      await mutate()
      await mutateAnalytics()
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
              description={program.descripcion || "Monitorea la salud del cohorte, revisa entregas y actúa sin salir de esta vista."}
              actions={
                <ProgramActionBar
                  isPublished={isPublished}
                  proofPointsCount={stats.proof_points}
                  isRefreshingAnalytics={isRefreshingAnalytics}
                  onRefreshAnalytics={() => mutateAnalytics()}
                  onOpenAssistant={() => setIsAssistantOpen(true)}
                  onPublishProgram={handlePublish}
                  publishing={publishing}
                  programId={programId}
                />
              }
            />

            <ProgramMetrics metrics={kpis} />

            {analyticsError ? (
              <Alert variant="destructive">
                <AlertTitle>No se pudieron cargar las métricas</AlertTitle>
                <AlertDescription>
                  {analyticsError.message || "Verifica el endpoint /api/cohorts/:id/analytics"}
                </AlertDescription>
              </Alert>
            ) : null}

            <ProgramAnalyticsGrid
              programId={programId}
              submissions={submissions}
              phases={phases}
              atRiskStudents={atRiskStudents}
              proofPoints={proofPoints}
            />

          </div>
        </main>

        {/* AI Assistant Modal */}
        <PedagogicalAssistantModal
          programId={programId}
          programName={program.nombre}
          open={isAssistantOpen}
          onOpenChange={setIsAssistantOpen}
          onComplete={() => {
            mutate() // Refresh program data
            mutateAnalytics()
            setIsAssistantOpen(false)
            toast.success("¡Plan de ejercicios creado!", {
              description: "Ve a 'Editar Estructura' para revisarlos.",
            })
          }}
        />
      </div>
    </div>
  )
}
