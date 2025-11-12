"use client"

import { useRouter, useParams } from "next/navigation"
import useSWR from "swr"
import { exerciseInstancesApi } from "@/services/api"
import type { ExerciseCategory } from "@/types/api"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
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

type PreviewExercise = {
  id: string
  nombre: string
  tipo: ExercisePlayerType
  proofPointNombre: string
  contenido: Record<string, any>
}

export default function ExercisePage() {
  const router = useRouter()
  const params = useParams()
  const exerciseId = params?.exerciseId as string

  const {
    data: exercise,
    error,
    isLoading,
  } = useSWR(
    exerciseId ? `instructor-preview-${exerciseId}` : null,
    async (): Promise<PreviewExercise> => {
      const metadata = await exerciseInstancesApi.getById(exerciseId)
      const contentResponse = await exerciseInstancesApi.getContent(exerciseId)
      const content = (contentResponse as any)?.contenido_generado || contentResponse
      const tipo = normalizeExerciseType(metadata.template?.split(":")[1])

      return {
        id: metadata.id,
        nombre: metadata.nombre,
        tipo,
        proofPointNombre: metadata.proofPoint || "Proof Point",
        contenido: content,
      }
    },
  )

  const handleSave = async () => Promise.resolve()
  const handleComplete = async () => Promise.resolve()
  const handleExit = () => router.push("/student/courses")

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState text="Cargando ejercicio..." />
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState title="Ejercicio no encontrado" message="No pudimos cargar el ejercicio solicitado." />
      </div>
    )
  }

  const commonProps = {
    exerciseId: exercise.id,
    exerciseName: exercise.nombre,
    proofPointName: exercise.proofPointNombre,
    content: exercise.contenido,
    onSave: handleSave,
    onComplete: handleComplete,
    onExit: handleExit,
  }

  switch (exercise.tipo) {
    case "leccion_interactiva":
      return <LeccionInteractivaPlayer {...commonProps} />
    case "cuaderno_trabajo":
      return <CuadernoTrabajoPlayer {...commonProps} />
    case "simulacion_interaccion":
      return <SimulacionInteraccionPlayer {...commonProps} />
    case "mentor_ia":
    case "mentor_asesor_ia":
      return <MentorIAPlayer {...commonProps} />
    case "herramienta_analisis":
      return <HerramientaAnalisisPlayer {...commonProps} />
    case "herramienta_creacion":
      return <HerramientaCreacionPlayer {...commonProps} />
    case "sistema_tracking":
      return <SistemaTrackingPlayer {...commonProps} />
    case "herramienta_revision":
      return <HerramientaRevisionPlayer {...commonProps} />
    case "simulador_entorno":
      return <SimuladorEntornoPlayer {...commonProps} />
    case "sistema_progresion":
      return <SistemaProgresionPlayer {...commonProps} />
    default:
      return (
        <div className="flex h-screen items-center justify-center">
          <ErrorState title="Player no disponible" message={`Aún no hay un player para ${exercise.tipo}.`} />
        </div>
      )
  }
}

type ExercisePlayerType = ExerciseCategory | "mentor_ia"

const LEGACY_TYPE_MAP: Record<string, ExercisePlayerType> = {
  mentor_asesor_ia: "mentor_ia",
  mentor_y_asesor_ia: "mentor_ia",
}

function normalizeExerciseType(value?: string | null): ExercisePlayerType {
  const sanitized = (value ?? "leccion_interactiva").toLowerCase()
  return LEGACY_TYPE_MAP[sanitized] ?? (sanitized as ExercisePlayerType)
}
