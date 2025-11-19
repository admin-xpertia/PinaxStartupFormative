"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { APIError, exercisesApi } from "@/services/api"
import type {
  CompleteExerciseParams,
  SaveProgressParams,
  SubmitForGradingParams,
  SubmitForGradingResponse,
} from "@/services/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useStudentSession } from "@/lib/hooks/use-student-session"
import { Button } from "@/components/ui/button"
import { PreliminaryScoreModal } from "@/components/preliminary-score-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { SubmissionFeedbackDialog } from "@/components/student/shared/SubmissionFeedbackDialog"

const READ_ONLY_STATUSES = new Set(["pending_review", "graded"])
const SUBMISSION_STATUS_MESSAGES: Record<string, { label: string; description: string }> = {
  pending_review: {
    label: "En revisión",
    description:
      "Ya enviaste esta entrega y está pendiente de revisión. Puedes consultar el feedback preliminar de la IA mientras esperas al instructor.",
  },
  graded: {
    label: "Calificado",
    description:
      "Esta entrega ya fue calificada. Solo puedes revisar el feedback registrado.",
  },
}

// Import all players
import {
  LeccionInteractivaPlayer,
  CuadernoTrabajoPlayer,
  SimulacionInteraccionPlayer,
  MentorIAPlayer,
  HerramientaAnalisisPlayer,
  HerramientaCreacionPlayer,
  SistemaTrackingPlayer,
  HerramientaRevisionPlayer,
  SimuladorEntornoPlayer,
  SistemaProgresionPlayer,
  CasoPlayer,
  InstruccionesPlayer,
  MetacognicionPlayer,
} from "@/components/players"

export default function ExercisePage() {
  const params = useParams()
  const router = useRouter()
  const exerciseId = params.exerciseId as string
  const { estudianteId, cohortId } = useStudentSession()
  const startedExercisesRef = useRef<Set<string>>(new Set())
  const [aiResult, setAiResult] = useState<SubmitForGradingResponse | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

  // Fetch exercise data and content
  const swrKey =
    exerciseId && estudianteId && cohortId
      ? ["exercise", exerciseId, estudianteId, cohortId]
      : null

  const { data: exercise, error, isLoading } = useSWR(
    swrKey,
    async () => {
      const exerciseData = await exercisesApi.getById(exerciseId, {
        estudianteId,
        cohorteId: cohortId,
      })
      const contentResponse = await exercisesApi.getContent(exerciseId)

      // Extract exercise type from template (format: "template:exercise_type")
      const tipo = (exerciseData as any).template?.split(":")[1] || "leccion_interactiva"

      // Extract contenido_generado from the response
      const content = (contentResponse as any)?.contenido_generado || contentResponse

      const proofPointId =
        (exerciseData as any).proofPointId ??
        (exerciseData as any).proofPoint ??
        (exerciseData as any).proof_point

      return { ...exerciseData, proofPointId, content, tipo }
    }
  )

  const {
    data: progress,
    mutate: mutateProgress,
  } = useSWR(
    exerciseId && estudianteId && cohortId
      ? ["exercise-progress", exerciseId, estudianteId, cohortId]
      : null,
    async () => {
      try {
        return await exercisesApi.getProgress(exerciseId, {
          estudianteId: estudianteId!,
          cohorteId: cohortId!,
        })
      } catch (err) {
        if (err instanceof APIError && err.statusCode === 404) {
          return null
        }
        throw err
      }
    }
  )

  const proofPointId = useMemo(() => {
    if (!exercise) return undefined
    return (
      (exercise as any).proofPointId ??
      (exercise as any).proofPoint ??
      (exercise as any).proof_point
    )
  }, [exercise])

  const isReadOnly = Boolean(progress && READ_ONLY_STATUSES.has(progress.status))
  const readOnlyStatusMeta = useMemo(() => {
    if (!progress || !isReadOnly) return undefined
    return SUBMISSION_STATUS_MESSAGES[progress.status] ?? {
      label: "Entrega enviada",
      description: "Esta entrega ya fue enviada y se encuentra bloqueada.",
    }
  }, [progress, isReadOnly])

  const submissionFeedback = useMemo(() => {
    if (!progress || !exercise) return null
    return {
      exerciseName: exercise.nombre,
      status: progress.status,
      score: progress.scoreFinal ?? progress.instructorScore ?? progress.aiScore ?? null,
      aiScore: progress.aiScore ?? null,
      instructorScore: progress.instructorScore ?? null,
      manualFeedback: progress.manualFeedback ?? null,
      feedbackJson: progress.feedbackJson ?? null,
    }
  }, [exercise, progress])

  useEffect(() => {
    if (!exerciseId || !estudianteId || !cohortId || isReadOnly) {
      return
    }

    if (startedExercisesRef.current.has(exerciseId)) {
      return
    }

    startedExercisesRef.current.add(exerciseId)

    const startExercise = async () => {
      try {
        await exercisesApi.start(exerciseId, {
          estudianteId,
          cohorteId: cohortId,
        })
      } catch (error) {
        console.warn("Failed to start exercise", error)
      }
    }

    startExercise()
  }, [exerciseId, estudianteId, cohortId, isReadOnly])

  const isAuthenticated = Boolean(estudianteId && cohortId)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Inicia sesión para continuar con tus ejercicios.</p>
        <Button onClick={() => router.push("/login")}>Ir a login</Button>
      </div>
    )
  }

  const ensureRecord = (value: any): Record<string, any> => {
    if (value && typeof value === "object") {
      return value as Record<string, any>
    }
    if (value === undefined || value === null) {
      return {}
    }
    return { value }
  }

  const normalizeSavePayload = (rawData: any): SaveProgressParams => {
    console.log('[DEBUG] normalizeSavePayload - Input rawData:', rawData)

    if (rawData && typeof rawData === "object") {
      const {
        datos,
        porcentajeCompletitud,
        tiempoInvertidoMinutos,
        estudianteId: payloadEstudianteId,
        cohorteId: payloadCohorteId,
        ...rest
      } = rawData as Record<string, any>

      console.log('[DEBUG] normalizeSavePayload - Extracted datos:', datos)
      console.log('[DEBUG] normalizeSavePayload - Rest:', rest)
      console.log('[DEBUG] normalizeSavePayload - Will use:', datos ?? rest)

      return {
        estudianteId: (payloadEstudianteId as string) ?? estudianteId,
        cohorteId: (payloadCohorteId as string) ?? cohortId,
        datos: ensureRecord(datos ?? rest),
        porcentajeCompletitud,
        tiempoInvertidoMinutos,
      }
    }

    console.log('[DEBUG] normalizeSavePayload - Using rawData directly')
    return {
      estudianteId: estudianteId!,
      cohorteId: cohortId!,
      datos: ensureRecord(rawData),
    }
  }

  const normalizeCompletePayload = (rawData: any): CompleteExerciseParams => {
    if (rawData && typeof rawData === "object") {
      const {
        datos,
        tiempoInvertidoMinutos,
        scoreFinal,
        estudianteId: payloadEstudianteId,
        cohorteId: payloadCohorteId,
        ...rest
      } = rawData as Record<string, any>

      return {
        estudianteId: (payloadEstudianteId as string) ?? estudianteId,
        cohorteId: (payloadCohorteId as string) ?? cohortId,
        datos: ensureRecord(datos ?? rest),
        tiempoInvertidoMinutos,
        scoreFinal,
      }
    }

    return {
      estudianteId: estudianteId!,
      cohorteId: cohortId!,
      datos: ensureRecord(rawData),
    }
  }

  const handleSave = async (data: any) => {
    if (!estudianteId || !cohortId) {
      toast.error("Falta el contexto de estudiante/cohorte para guardar el progreso")
      return
    }

    try {
      console.log('[DEBUG] handleSave - Raw data received:', data)
      const payload = normalizeSavePayload(data)
      console.log('[DEBUG] handleSave - Normalized payload:', payload)
      console.log('[DEBUG] handleSave - Payload.datos:', payload.datos)
      await exercisesApi.saveProgress(exerciseId, payload)
      toast.success("Progreso guardado exitosamente")
    } catch (error) {
      console.error("Error saving progress:", error)
      toast.error("Error al guardar el progreso")
      throw error
    }
  }

  const handleComplete = async (data: any) => {
    if (!estudianteId || !cohortId) {
      toast.error("Falta el contexto de estudiante/cohorte para completar el ejercicio")
      return
    }

    try {
      const payload = normalizeCompletePayload(data) as SubmitForGradingParams
      const result: SubmitForGradingResponse = await exercisesApi.submitForGrading(
        exerciseId,
        payload,
      )

      setAiResult(result)
      setShowResultModal(true)
      mutateProgress()
    } catch (error) {
      console.error("Error completing exercise:", error)
      toast.error("Error al enviar la entrega")
      throw error
    }
  }

  const handleCloseResults = () => {
    setShowResultModal(false)
    setAiResult(null)
    if (proofPointId) {
      router.push(`/proof-points/${proofPointId}`)
      return
    }
    router.push("/dashboard")
  }

  const handleExit = () => {
    if (proofPointId) {
      router.push(`/proof-points/${proofPointId}`)
    } else {
      router.push("/dashboard")
    }
  }

  const blockedCompletionMessage = readOnlyStatusMeta?.description ??
    "Esta entrega ya fue enviada y no se puede modificar."

  const readOnlyCompleteHandler = async () => {
    toast.error(blockedCompletionMessage)
  }

  const effectiveSaveHandler = isReadOnly ? async () => {} : handleSave
  const effectiveCompleteHandler = isReadOnly ? readOnlyCompleteHandler : handleComplete

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando ejercicio...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error al cargar el ejercicio</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-primary hover:underline"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Check if content is available
  if (!exercise.content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">El contenido del ejercicio no está disponible</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-primary hover:underline"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Select the appropriate player based on exercise type
  const baseProps = {
    exerciseId: exercise.id,
    exerciseName: exercise.nombre,
    proofPointName: exercise.proofPointName ?? "Proof Point",
    savedData: exercise.savedData,
    onSave: effectiveSaveHandler,
    onComplete: effectiveCompleteHandler,
    onExit: handleExit,
    readOnly: isReadOnly,
  }

  const renderPlayer = () => {
    switch (exercise.tipo) {
      case "leccion_interactiva":
        return <LeccionInteractivaPlayer {...baseProps} content={exercise.content as any} />

      case "cuaderno_trabajo":
        return (
          <CuadernoTrabajoPlayer
            {...baseProps}
            content={exercise.content as any}
            initialResponses={(exercise as any).savedData || {}}
          />
        )

      case "simulacion_interaccion":
        return (
          <SimulacionInteraccionPlayer
            {...baseProps}
            content={exercise.content as any}
            savedData={(exercise as any).savedData}
          />
        )

      case "mentor_ia":
        return (
          <MentorIAPlayer
            {...baseProps}
            content={exercise.content as any}
            initialResponses={(exercise as any).savedData || {}}
          />
        )

      case "herramienta_analisis":
        return <HerramientaAnalisisPlayer {...baseProps} content={exercise.content as any} />

      case "herramienta_creacion":
        return (
          <HerramientaCreacionPlayer
            {...baseProps}
            content={exercise.content as any}
            savedData={(exercise as any).savedData}
          />
        )

      case "sistema_tracking":
        return (
          <SistemaTrackingPlayer
            {...baseProps}
            content={exercise.content as any}
            savedData={(exercise as any).savedData}
          />
        )

      case "herramienta_revision":
        return <HerramientaRevisionPlayer {...baseProps} content={exercise.content as any} />

      case "simulador_entorno":
        return <SimuladorEntornoPlayer {...baseProps} content={exercise.content as any} />

      case "sistema_progresion":
        return <SistemaProgresionPlayer {...baseProps} content={exercise.content as any} />

      case "caso":
        return <CasoPlayer {...baseProps} content={exercise.content as any} />

      case "instrucciones":
        return <InstruccionesPlayer {...baseProps} content={exercise.content as any} />

      case "metacognicion":
        return <MetacognicionPlayer {...baseProps} content={exercise.content as any} />

      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive mb-4">
                Tipo de ejercicio no soportado: {exercise.tipo}
              </p>
              <button
                onClick={handleExit}
                className="text-primary hover:underline"
              >
                Volver
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      {isReadOnly && readOnlyStatusMeta && (
        <div className="mx-auto w-full max-w-5xl px-4 pt-6">
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <Badge variant="secondary">{readOnlyStatusMeta.label}</Badge>
              Entrega enviada
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-3 text-sm">
              <p>{readOnlyStatusMeta.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                {submissionFeedback?.score !== null && submissionFeedback?.score !== undefined && (
                  <span className="text-sm font-semibold text-foreground">
                    Nota IA: {submissionFeedback.score}
                  </span>
                )}
                {submissionFeedback && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowFeedbackDialog(true)}
                  >
                    Ver feedback
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      {renderPlayer()}
      <PreliminaryScoreModal
        open={showResultModal}
        result={aiResult}
        onClose={handleCloseResults}
        actionLabel={proofPointId ? "Volver al proof point" : "Ir al dashboard"}
      />
      <SubmissionFeedbackDialog
        open={showFeedbackDialog && Boolean(submissionFeedback)}
        onOpenChange={(open) => {
          if (!open) {
            setShowFeedbackDialog(false)
          } else if (!submissionFeedback) {
            setShowFeedbackDialog(false)
          }
        }}
        submission={submissionFeedback}
      />
    </>
  )
}
