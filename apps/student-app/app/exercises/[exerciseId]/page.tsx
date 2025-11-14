"use client"

import { useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { exercisesApi } from "@/services/api"
import type { CompleteExerciseParams, SaveProgressParams } from "@/services/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useStudentSession } from "@/lib/hooks/use-student-session"

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
  const { estudianteId, cohorteId } = useStudentSession()
  const startedExercisesRef = useRef<Set<string>>(new Set())

  // Fetch exercise data and content
  const { data: exercise, error, isLoading } = useSWR(
    exerciseId ? `exercise-${exerciseId}` : null,
    async () => {
      const exerciseData = await exercisesApi.getById(exerciseId)
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

  const proofPointId = useMemo(() => {
    if (!exercise) return undefined
    return (
      (exercise as any).proofPointId ??
      (exercise as any).proofPoint ??
      (exercise as any).proof_point
    )
  }, [exercise])

  useEffect(() => {
    if (!exerciseId || !estudianteId || !cohorteId) {
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
          cohorteId,
        })
      } catch (error) {
        console.warn("Failed to start exercise", error)
      }
    }

    startExercise()
  }, [exerciseId, estudianteId, cohorteId])

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
    if (rawData && typeof rawData === "object") {
      const {
        datos,
        porcentajeCompletitud,
        tiempoInvertidoMinutos,
        estudianteId: payloadEstudianteId,
        cohorteId: payloadCohorteId,
        ...rest
      } = rawData as Record<string, any>

      return {
        estudianteId: (payloadEstudianteId as string) ?? estudianteId,
        cohorteId: (payloadCohorteId as string) ?? cohorteId,
        datos: ensureRecord(datos ?? rest),
        porcentajeCompletitud,
        tiempoInvertidoMinutos,
      }
    }

    return {
      estudianteId,
      cohorteId,
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
        cohorteId: (payloadCohorteId as string) ?? cohorteId,
        datos: ensureRecord(datos ?? rest),
        tiempoInvertidoMinutos,
        scoreFinal,
      }
    }

    return {
      estudianteId,
      cohorteId,
      datos: ensureRecord(rawData),
    }
  }

  const handleSave = async (data: any) => {
    try {
      const payload = normalizeSavePayload(data)
      await exercisesApi.saveProgress(exerciseId, payload)
      toast.success("Progreso guardado exitosamente")
    } catch (error) {
      console.error("Error saving progress:", error)
      toast.error("Error al guardar el progreso")
      throw error
    }
  }

  const handleComplete = async (data: any) => {
    try {
      const payload = normalizeCompletePayload(data)
      const result = await exercisesApi.complete(exerciseId, payload)
      toast.success("¡Ejercicio completado! 🎉")

      // Navigate based on completion result
      if (result.nextExerciseId) {
        router.push(`/exercises/${result.nextExerciseId}`)
      } else if (result.proofPointCompleted && proofPointId) {
        toast.success("¡Proof Point completado! 🌟")
        router.push("/dashboard")
      } else if (proofPointId) {
        router.push(`/proof-points/${proofPointId}`)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error completing exercise:", error)
      toast.error("Error al completar el ejercicio")
      throw error
    }
  }

  const handleExit = () => {
    if (proofPointId) {
      router.push(`/proof-points/${proofPointId}`)
    } else {
      router.push("/dashboard")
    }
  }

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
    onSave: handleSave,
    onComplete: handleComplete,
    onExit: handleExit,
  }

  // Player selection logic
  switch (exercise.tipo) {
    case "leccion_interactiva":
      return <LeccionInteractivaPlayer {...baseProps} content={exercise.content as any} />

    case "cuaderno_trabajo":
      return <CuadernoTrabajoPlayer {...baseProps} content={exercise.content as any} />

    case "simulacion_interaccion":
      return <SimulacionInteraccionPlayer {...baseProps} content={exercise.content as any} />

    case "mentor_ia":
      return <MentorIAPlayer {...baseProps} content={exercise.content as any} />

    case "herramienta_analisis":
      return <HerramientaAnalisisPlayer {...baseProps} content={exercise.content as any} />

    case "herramienta_creacion":
      return <HerramientaCreacionPlayer {...baseProps} content={exercise.content as any} />

    case "sistema_tracking":
      return <SistemaTrackingPlayer {...baseProps} content={exercise.content as any} />

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
