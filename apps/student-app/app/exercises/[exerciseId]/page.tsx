"use client"

import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { exercisesApi, progressApi } from "@/services/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
} from "@/components/players"

export default function ExercisePage() {
  const params = useParams()
  const router = useRouter()
  const exerciseId = params.exerciseId as string

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

      return { ...exerciseData, content, tipo }
    }
  )

  const handleSave = async (data: any) => {
    try {
      await exercisesApi.saveProgress(exerciseId, data)
      toast.success("Progreso guardado exitosamente")
    } catch (error) {
      console.error("Error saving progress:", error)
      toast.error("Error al guardar el progreso")
      throw error
    }
  }

  const handleComplete = async (data: any) => {
    try {
      const result = await exercisesApi.complete(exerciseId, data)
      toast.success("¡Ejercicio completado! 🎉")

      // Navigate based on completion result
      if (result.nextExerciseId) {
        router.push(`/exercises/${result.nextExerciseId}`)
      } else if (result.proofPointCompleted) {
        toast.success("¡Proof Point completado! 🌟")
        router.push("/dashboard")
      } else {
        router.push(`/proof-points/${exercise?.proofPointId}`)
      }
    } catch (error) {
      console.error("Error completing exercise:", error)
      toast.error("Error al completar el ejercicio")
      throw error
    }
  }

  const handleExit = () => {
    if (exercise?.proofPointId) {
      router.push(`/proof-points/${exercise.proofPointId}`)
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
