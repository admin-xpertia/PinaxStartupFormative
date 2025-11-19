"use client"

import { use, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Loader2 } from "lucide-react"
import { fetcher } from "@/lib/fetcher"
import { useToast } from "@/hooks/use-toast"
import { SubmissionViewer } from "@/components/grading/SubmissionViewer"
import { AiAssessmentCard } from "@/components/grading/AiAssessmentCard"
import { exerciseInstancesApi } from "@/services/api"
import type { CohortAnalyticsResponse } from "../../types"
import type { SubmissionItem } from "../../components/SubmissionQueue"
import { LoadingState } from "@/components/shared/loading-state"

interface SubmissionDetail {
  id: string
  exerciseInstance: string
  status: string
  aiScore?: number | null
  instructorScore?: number | null
  scoreFinal?: number | null
  manualFeedback?: string | null
  feedbackJson?: Record<string, any> | null
  datosGuardados?: any
}

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "") || "http://localhost:3000/api/v1"
const PENDING_STATUSES: SubmissionItem["status"][] = ["submitted_for_review", "pending_review"]

export default function GradingWorkspacePage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>
}) {
  const { id: rawProgramId, submissionId: rawSubmissionId } = use(params)
  const programId = decodeURIComponent(rawProgramId)
  const submissionId = decodeURIComponent(rawSubmissionId)
  const { toast } = useToast()
  const router = useRouter()

  const { data, error, isLoading, mutate } = useSWR<SubmissionDetail>(
    submissionId ? `${API_BASE}/instructor/submissions/${encodeURIComponent(submissionId)}` : null,
    fetcher,
    { revalidateOnFocus: false },
  )
  const {
    data: analyticsData,
    mutate: mutateAnalyticsData,
  } = useSWR<CohortAnalyticsResponse>(
    programId ? `/api/cohorts/${encodeURIComponent(programId)}/analytics` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 0, dedupingInterval: 45_000 },
  )
  const exerciseInstanceId = data?.exerciseInstance
  const { data: exerciseInfo } = useSWR(
    exerciseInstanceId ? `exercise-instance-${exerciseInstanceId}` : null,
    () => exerciseInstancesApi.getById(exerciseInstanceId!),
  )
  const { data: exerciseContent } = useSWR(
    exerciseInstanceId ? `exercise-content-${exerciseInstanceId}` : null,
    () => exerciseInstancesApi.getContent(exerciseInstanceId!),
  )

  const [score, setScore] = useState<number | "">("")
  const [feedback, setFeedback] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false)

  const aiFeedback = useMemo(() => data?.feedbackJson ?? null, [data])
  const studentWork = useMemo(() => data?.datosGuardados ?? null, [data])
  useEffect(() => {
    if (data) {
      setScore(
        data.instructorScore ??
          data.scoreFinal ??
          data.aiScore ??
          "",
      )
      setFeedback(data.manualFeedback ?? "")
    }
  }, [data])

  useEffect(() => {
    setShowCompletionPrompt(false)
  }, [submissionId])

  const getNextPendingSubmissionId = (queue: SubmissionItem[]) => {
    if (!queue.length) {
      return null
    }
    const sorted = [...queue].sort(
      (a, b) => new Date(a.entregadoEl).getTime() - new Date(b.entregadoEl).getTime(),
    )
    const filtered = sorted.filter((item) => item.progressId !== submissionId)
    if (!filtered.length) {
      return null
    }
    const currentIndex = sorted.findIndex((item) => item.progressId === submissionId)
    if (currentIndex !== -1 && sorted[currentIndex + 1]) {
      return sorted[currentIndex + 1].progressId
    }
    return filtered[0].progressId
  }

  const advanceQueueAfterPublish = async () => {
    const refreshed = await mutateAnalyticsData()
    const source = refreshed?.submissions ?? analyticsData?.submissions ?? []
    const pending = source.filter((item) => PENDING_STATUSES.includes(item.status))
    const nextId = getNextPendingSubmissionId(pending)

    if (nextId) {
      setShowCompletionPrompt(false)
      router.replace(
        `/programas/${encodeURIComponent(programId)}/grade/${encodeURIComponent(nextId)}`,
      )
    } else {
      setShowCompletionPrompt(true)
      toast({
        title: "Todo al día",
        description: "No hay más entregas pendientes en esta cohorte.",
      })
    }
  }

  const handleGrade = async (publish: boolean) => {
    if (score === "" || isNaN(Number(score))) {
      toast({
        title: "Puntaje inválido",
        description: "Ingresa un número entre 0 y 100.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

      const res = await fetch(
        `${API_BASE}/instructor/submissions/${encodeURIComponent(submissionId)}/grade`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            instructorScore: Number(score),
            instructorFeedback: feedback,
            publish,
          }),
        },
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || "No se pudo actualizar la entrega")
      }

      toast({
        title: publish ? "Nota publicada" : "Borrador guardado",
        description: publish
          ? "Cargando siguiente estudiante..."
          : "Guardamos tu borrador de calificación.",
      })

      await mutate()
      if (publish) {
        await advanceQueueAfterPublish()
      }
    } catch (err: any) {
      toast({
        title: "Error al calificar",
        description: err.message || "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
              title="Calificación de entrega"
              description="Revisa la propuesta de la IA y publica la nota final."
              actions={
                <Button variant="outline" onClick={() => router.back()}>
                  Volver
                </Button>
              }
            />

            {showCompletionPrompt && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <AlertTitle>¡Todo revisado!</AlertTitle>
                <AlertDescription className="flex flex-col gap-3 pt-1 text-sm">
                  No hay más entregas pendientes en esta cohorte. Vuelve al dashboard para monitorear los KPIs.
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/programas/${encodeURIComponent(programId)}`}>Volver al programa</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => router.push("/programas")}>
                      Ir a Programas
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <LoadingState text="Cargando entrega..." />
            ) : error ? (
              <Card>
                <CardHeader>
                  <CardTitle>Error al cargar la entrega</CardTitle>
                  <CardDescription>{error.message}</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{exerciseInfo?.nombre || "Trabajo del estudiante"}</CardTitle>
                    <CardDescription>
                      {exerciseInfo?.descripcionBreve || `Instancia ${data?.exerciseInstance || "Sin ID"}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">Estado: {data?.status || "pending_review"}</Badge>
                      {typeof data?.aiScore === "number" && (
                        <Badge variant="secondary">IA sugiere: {data.aiScore}</Badge>
                      )}
                    </div>
                    <Separator />
                    <SubmissionViewer
                      template={exerciseInfo?.template}
                      submission={studentWork}
                      exerciseContent={exerciseContent}
                    />
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                  <AiAssessmentCard aiScore={data?.aiScore ?? null} feedback={aiFeedback} />
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b p-4">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Calificación final</p>
                      <p className="text-sm text-muted-foreground">
                        Ajusta la recomendación automática o publica la nota final directamente.
                      </p>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nota final</label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Estado actual</label>
                          <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                            {data?.status || "pending_review"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Comentarios al estudiante</label>
                        <Textarea
                          rows={4}
                          placeholder="Personaliza el feedback que verá el estudiante..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="sticky bottom-0 border-t bg-background/90 p-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur-lg">
                      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Al publicar, la nota se envía inmediatamente al estudiante.
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <Button
                          variant="outline"
                          disabled={isSaving || isLoading}
                          onClick={() => handleGrade(false)}
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Guardar borrador
                        </Button>
                        <Button disabled={isSaving || isLoading} onClick={() => handleGrade(true)}>
                          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Publicar nota
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
