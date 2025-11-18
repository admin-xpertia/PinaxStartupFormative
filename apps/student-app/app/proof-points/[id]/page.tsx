"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import {
  ProofPointHeader,
  ProofPointOverviewSection,
} from "@/components/student/proof-point"
import { progressApi, proofPointsApi, type PublishedExercise } from "@/services/api"
import type { ExerciseProgressSummary } from "@/types/progress"
import type { ProofPointExercise, ProofPointOverview } from "@/types/proof-point"
import { getHighlightExercise } from "@/lib/proof-point"
import { useStudentSession } from "@/lib/hooks/use-student-session"
import { Button } from "@/components/ui/button"

export default function ProofPointPage() {
  const params = useParams()
  const router = useRouter()
  const proofPointId = params.id as string
  const { estudianteId, cohortId } = useStudentSession()

  // Fetch proof point details
  const { data: proofPointDetails, error: detailsError } = useSWR(
    proofPointId ? `proof-point-details-${proofPointId}` : null,
    () => proofPointsApi.getDetails(proofPointId)
  )

  // Fetch proof point progress
  const { data: proofPointProgress, error: progressError } = useSWR(
    proofPointId && estudianteId && cohortId ? `proof-point-progress-${proofPointId}` : null,
    () => progressApi.getProofPointProgress(proofPointId, estudianteId!, cohortId!)
  )

  // Fetch published exercises
  const {
    data: publishedExercises,
    isLoading: exercisesLoading,
    error: exercisesError,
  } = useSWR<PublishedExercise[]>(
    proofPointId ? `proof-point-exercises-${proofPointId}` : null,
    () => proofPointsApi.getPublishedExercises(proofPointId)
  )

  const isAuthenticated = Boolean(estudianteId && cohortId)

  const exercises: ProofPointExercise[] = useMemo(() => {
    if (!publishedExercises) return []
    const progressMap = new Map<string, ExerciseProgressSummary>()
    if (proofPointProgress?.exercises) {
      for (const summary of proofPointProgress.exercises) {
        progressMap.set(summary.exerciseId, summary)
      }
    }
    const proofPointLocked = proofPointProgress?.status === "locked"

    return publishedExercises.map((exercise) => {
      const tipo = exercise.template?.split(":")[1] || "leccion_interactiva"
      const summary = progressMap.get(exercise.id)
      let status: ProofPointExercise["status"] = "available"
      let progressValue = 0

      if (proofPointLocked) {
        status = "locked"
      } else if (summary) {
        if (summary.status === "approved" || summary.status === "submitted_for_review") {
          status = "completed"
          progressValue = 100
        } else if (summary.status === "in_progress" || summary.status === "requires_iteration") {
          status = "in_progress"
          progressValue = Math.max(0, Math.min(100, summary.progress ?? 0))
        }
      }

      return {
        id: exercise.id,
        nombre: exercise.nombre,
        tipo,
        estimatedMinutes: exercise.duracionEstimadaMinutos ?? 20,
        status,
        progress: progressValue,
      }
    })
  }, [publishedExercises, proofPointProgress])

  // Calcular progreso real: (Ejercicios Completados / Ejercicios Totales) * 100
  const totalExercises = exercises.length
  const completedExercises = exercises.filter((e) => e.status === "completed").length
  const calculatedProgress =
    totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0

  // Build proof point overview from real data
  const proofPoint: ProofPointOverview | null =
    proofPointDetails && publishedExercises
      ? {
          id: proofPointId,
          nombre: proofPointDetails.nombre,
          descripcion: proofPointDetails.descripcion || "",
          nivelId: "",
          nivelNombre: "",
          phaseNombre: `Fase ${proofPointDetails.faseNumero}: ${proofPointDetails.faseNombre}`,
          progress: calculatedProgress,
          exercises,
        }
      : null

  const highlightExercise = proofPoint ? getHighlightExercise(proofPoint.exercises) : null

  const handleExerciseClick = (exercise: ProofPointExercise) => {
    if (exercise.status === "locked") return
    router.push(`/exercises/${exercise.id}`)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Inicia sesión para revisar este proof point.</p>
        <Button onClick={() => router.push("/login")}>Ir a login</Button>
      </div>
    )
  }

  // Loading state
  if (exercisesLoading || !proofPointDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando proof point...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (detailsError || exercisesError || !publishedExercises || publishedExercises.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {detailsError || exercisesError
              ? "Error al cargar el proof point"
              : "No se encontraron ejercicios para este proof point"}
          </p>
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

  // Proof point not loaded (shouldn't happen after checks above)
  if (!proofPoint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">No se pudo cargar el proof point</p>
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

  // Extract objectives from exercises if available
  const objectives = publishedExercises
    .filter((ex) => ex.descripcionBreve)
    .map((ex) => ex.descripcionBreve!)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ProofPointHeader
        title={proofPoint.nombre}
        subtitle={proofPoint.phaseNombre}
        progress={Math.round(proofPoint.progress)}
        onBack={() => router.push("/dashboard")}
      />

      <main className="flex-1 w-full">
        <ProofPointOverviewSection
          proofPoint={proofPoint}
          highlightExercise={highlightExercise}
          objectives={objectives.length > 0 ? objectives : undefined}
          onStartExercise={handleExerciseClick}
        />
      </main>
    </div>
  )
}
