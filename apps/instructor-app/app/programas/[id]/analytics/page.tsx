"use client"

import { use, useState } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Bot, Loader2 } from "lucide-react"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { CohortProgressChart } from "./components/CohortProgressChart"
import { StudentRiskList } from "./components/StudentRiskList"
import { SubmissionQueue } from "./components/SubmissionQueue"

interface CohortAnalyticsResponse {
  phases: {
    id: string
    nombre: string
    progreso: number
    promedioScore?: number
  }[]
  atRiskStudents: {
    id: string
    nombre: string
    progreso: number
    diasInactivo: number
    ejercicioActual?: string
  }[]
  submissions: {
    progressId: string
    estudiante: string
    ejercicio: string
    entregadoEl: string
    status: "submitted_for_review" | "requires_iteration" | "approved" | "in_progress"
  }[]
  hasPublishedExercises: boolean
  publishedExercisesCount: number
  totalStudents: number
}

export default function ProgramAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = use(params)
  const programId = decodeURIComponent(rawId)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    data,
    error,
    isLoading,
  } = useSWR<CohortAnalyticsResponse>(
    programId ? `/api/cohorts/${encodeURIComponent(programId)}/analytics` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 0, dedupingInterval: 30_000, keepPreviousData: true, revalidateOnReconnect: false, },
  )

  const phases = data?.phases ?? []
  const risks = data?.atRiskStudents ?? []
  const submissions = data?.submissions ?? []
  const publishedExercisesCount = data?.publishedExercisesCount ?? 0
  const totalStudents = data?.totalStudents ?? 0
  const hasPublishedExercises = data?.hasPublishedExercises ?? false

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <Breadcrumbs />

            <PageHeader
              title="Analytics del Programa"
              description="Vista de salud del cohorte, alertas IA y bandeja de entregas para revisión."
              actions={
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Refrescar datos
                  </Button>
                  <Button variant="secondary" disabled>
                    <Bot className="mr-2 h-4 w-4" />
                    Analizar cohorte con IA
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/programas/${programId}`}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Volver al programa
                    </Link>
                  </Button>
                </div>
              }
            />

            {error ? (
              <Card>
                <CardHeader>
                  <CardTitle>Error al cargar analytics</CardTitle>
                  <CardDescription>{error.message || "No se pudo obtener la información"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Verifica que el endpoint <code>/api/cohorts/:id/analytics</code> esté implementado y disponible.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Ejercicios publicados</CardTitle>
                        <CardDescription>
                          {hasPublishedExercises
                            ? "Hay ejercicios listos en esta cohorte"
                            : "No hay ejercicios publicados aún"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{publishedExercisesCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Estudiantes en cohorte</CardTitle>
                        <CardDescription>Inscritos activos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Entregas en cola</CardTitle>
                        <CardDescription>submitted_for_review</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {submissions.filter((s) => s.status === "submitted_for_review").length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <CohortProgressChart phases={phases} />
                  <StudentRiskList students={risks} />
                </div>
                <SubmissionQueue submissions={submissions} programId={programId} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
