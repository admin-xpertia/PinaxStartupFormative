"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import {
  ProofPointHeader,
  ProofPointSidebar,
  ProofPointOverviewSection,
  AiAssistantPanel,
} from "@/components/student/proof-point"
import { progressApi, proofPointsApi, type PublishedExercise } from "@/services/api"
import type { ProofPointExercise, ProofPointOverview } from "@/types/proof-point"
import { getHighlightExercise } from "@/lib/proof-point"
import { useStudentSession } from "@/lib/hooks/use-student-session"

export default function ProofPointPage() {
  const params = useParams()
  const router = useRouter()
  const proofPointId = params.id as string
  const { estudianteId, cohorteId } = useStudentSession()

  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [aiInput, setAiInput] = useState("")
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number | null>(null)

  // Fetch proof point progress
  const { data: proofPointProgress, error: progressError } = useSWR(
    proofPointId ? `proof-point-progress-${proofPointId}` : null,
    () => progressApi.getProofPointProgress(proofPointId, estudianteId, cohorteId)
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

  // Map published exercises to UI format
  const exercises: ProofPointExercise[] = publishedExercises
    ? publishedExercises.map((exercise) => ({
        id: exercise.id,
        nombre: exercise.nombre,
        tipo: exercise.template?.split(":")[1] || "leccion_interactiva",
        estimatedMinutes: exercise.duracionEstimadaMinutos ?? 20,
        status: "available",
        progress: 0,
      }))
    : []

  // Build proof point overview from real data
  const proofPoint: ProofPointOverview | null = publishedExercises
    ? {
        id: proofPointId,
        nombre: publishedExercises[0]?.proofPointNombre || "Proof Point",
        descripcion: publishedExercises[0]?.proofPointDescripcion || "",
        nivelId: "",
        nivelNombre: "",
        phaseNombre: publishedExercises[0]?.phaseNombre || "",
        progress: proofPointProgress?.progress ?? 0,
        exercises,
      }
    : null

  const highlightExercise = proofPoint ? getHighlightExercise(proofPoint.exercises) : null

  const handleExerciseClick = (exercise: ProofPointExercise, idx?: number) => {
    if (exercise.status === "locked") return
    if (proofPoint) {
      const targetIdx =
        typeof idx === "number" && idx >= 0
          ? idx
          : proofPoint.exercises.findIndex((item) => item.id === exercise.id)
      setSelectedExerciseIdx(targetIdx >= 0 ? targetIdx : null)
    }
    router.push(`/exercises/${exercise.id}`)
  }

  const handleSendMessage = () => {
    if (!aiInput.trim()) return
    setAiMessages((prev) => [
      ...prev,
      { role: "user", content: aiInput },
      {
        role: "assistant",
        content:
          "Esta es una respuesta simulada del asistente IA. La integración completa con IA estará disponible próximamente.",
      },
    ])
    setAiInput("")
  }

  const handlePrefill = (value: string) => setAiInput(value)

  // Loading state
  if (exercisesLoading) {
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
  if (exercisesError || !publishedExercises || publishedExercises.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {exercisesError
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <ProofPointHeader
        title={proofPoint.nombre}
        subtitle={proofPoint.phaseNombre}
        progress={Math.round(proofPoint.progress)}
        onBack={() => router.push("/dashboard")}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        <ProofPointSidebar
          proofPoint={proofPoint}
          exercisesLoading={exercisesLoading}
          publishedExercisesCount={publishedExercises?.length}
          exercises={proofPoint.exercises}
          selectedExerciseIdx={selectedExerciseIdx}
          onSelectExercise={handleExerciseClick}
        />

        <div className="flex-1 overflow-auto bg-white">
          <ProofPointOverviewSection
            proofPoint={proofPoint}
            highlightExercise={highlightExercise}
            objectives={objectives.length > 0 ? objectives : undefined}
            onStartExercise={handleExerciseClick}
          />
        </div>

        <AiAssistantPanel
          messages={aiMessages}
          input={aiInput}
          onInputChange={setAiInput}
          onSend={handleSendMessage}
          onPrefill={handlePrefill}
        />
      </div>
    </div>
  )
}
