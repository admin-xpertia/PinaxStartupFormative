"use client"

import { use, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Bot, Loader2 } from "lucide-react"
import { fetcher } from "@/lib/fetcher"
import { useToast } from "@/hooks/use-toast"

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

export default function GradingWorkspacePage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>
}) {
  const { id: rawProgramId, submissionId: rawSubmissionId } = use(params)
  const programId = decodeURIComponent(rawProgramId)
  const submissionId = decodeURIComponent(rawSubmissionId)
  const { toast } = useToast()

  const { data, error, isLoading, mutate } = useSWR<SubmissionDetail>(
    submissionId ? `${API_BASE}/instructor/submissions/${encodeURIComponent(submissionId)}` : null,
    fetcher,
    { revalidateOnFocus: false },
  )

  const [score, setScore] = useState<number | "">("")
  const [feedback, setFeedback] = useState("")
  const [isSaving, setIsSaving] = useState(false)

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
          ? "La calificación final fue publicada al estudiante."
          : "Guardamos tu borrador de calificación.",
      })

      mutate()
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

  const strengths = Array.isArray(aiFeedback?.strengths) ? aiFeedback?.strengths : []
  const improvements = Array.isArray(aiFeedback?.improvements)
    ? aiFeedback?.improvements
    : []

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
                <Button variant="outline" onClick={() => window.history.back()}>
                  Volver
                </Button>
              }
            />

            {error ? (
              <Card>
                <CardHeader>
                  <CardTitle>Error al cargar la entrega</CardTitle>
                  <CardDescription>{error.message}</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trabajo del estudiante</CardTitle>
                    <CardDescription>
                      Vista de sólo lectura de la entrega para el ejercicio {data?.exerciseInstance || "N/D"}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        Estado: {data?.status || "pending_review"}
                      </Badge>
                      {data?.aiScore !== undefined && data?.aiScore !== null && (
                        <Badge variant="secondary">IA: {data.aiScore}</Badge>
                      )}
                    </div>
                    <Separator />
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground mb-2">Contenido entregado</p>
                      <pre className="text-xs whitespace-pre-wrap">
                        {studentWork ? JSON.stringify(studentWork, null, 2) : "Sin datos"}
                      </pre>
                    </div>
                    {aiFeedback && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Bot className="h-4 w-4" />
                          Insights de IA
                        </div>
                        {aiFeedback.summary && (
                          <p className="text-sm text-muted-foreground">{aiFeedback.summary}</p>
                        )}
                        {strengths.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-1">Fortalezas</div>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {strengths.map((item: string, idx: number) => (
                                <li key={`s-${idx}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {improvements.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-1">Áreas de mejora</div>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {improvements.map((item: string, idx: number) => (
                                <li key={`i-${idx}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Calificación</CardTitle>
                    <CardDescription>
                      Ajusta el puntaje sugerido, agrega feedback y decide si publicar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Puntaje final</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={score}
                        onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Prellenado con la sugerencia de IA. Puedes ajustarlo antes de publicar.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Feedback del instructor</label>
                      <Textarea
                        rows={6}
                        placeholder="Escribe comentarios personalizados..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </div>

                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="text-sm text-muted-foreground">
                      Al publicar, el estudiante recibirá esta nota como definitiva.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        disabled={isSaving || isLoading}
                        onClick={() => handleGrade(false)}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Guardar borrador
                      </Button>
                      <Button
                        disabled={isSaving || isLoading}
                        onClick={() => handleGrade(true)}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Publicar nota
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
