"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import {
  ProofPointHeader,
  ProofPointSidebar,
  ProofPointOverviewSection,
  AiAssistantPanel,
} from "@/components/student/proof-point"
import { progressApi, proofPointsApi, type PublishedExercise } from "@/services/api"
import type { ProofPointExercise, ProofPointOverview } from "@/types/proof-point"
import { getHighlightExercise } from "@/lib/proof-point"

const FALLBACK_OBJECTIVES = [
  "Identificar los principales estilos de liderazgo y sus características",
  "Reconocer tu estilo natural de liderazgo",
  "Practicar la adaptación del estilo según el contexto",
  "Desarrollar flexibilidad en tu aproximación al liderazgo",
]

const buildFallbackProofPoint = (proofPointId: string): ProofPointOverview => ({
  id: proofPointId,
  nombre: "Estilos de Liderazgo",
  descripcion:
    "Explora y practica diferentes estilos de liderazgo situacional para adaptarte efectivamente a diversos contextos organizacionales.",
  nivelId: "n1",
  nivelNombre: "Nivel 1: Fundamentos",
  phaseNombre: "Fase 2: Liderazgo Situacional",
  progress: 60,
  exercises: [
    {
      id: "ex1",
      nombre: "Introducción a los Estilos de Liderazgo",
      tipo: "leccion_interactiva",
      estimatedMinutes: 15,
      status: "completed",
      progress: 100,
    },
    {
      id: "ex2",
      nombre: "Cuaderno: Identifica tu Estilo Natural",
      tipo: "cuaderno_trabajo",
      estimatedMinutes: 20,
      status: "completed",
      progress: 100,
    },
    {
      id: "ex3",
      nombre: "Simulación: Liderazgo en Crisis",
      tipo: "simulacion_interaccion",
      estimatedMinutes: 30,
      status: "in_progress",
      progress: 60,
    },
    {
      id: "ex4",
      nombre: "Análisis de Casos Reales",
      tipo: "herramienta_analisis",
      estimatedMinutes: 25,
      status: "available",
      progress: 0,
    },
    {
      id: "ex5",
      nombre: "Mentor IA: Consulta Personalizada",
      tipo: "mentor_ia",
      estimatedMinutes: 20,
      status: "available",
      progress: 0,
    },
    {
      id: "ex6",
      nombre: "Reflexión Final",
      tipo: "cuaderno_trabajo",
      estimatedMinutes: 15,
      status: "locked",
      progress: 0,
    },
  ],
})

export default function ProofPointPage() {
  const params = useParams()
  const router = useRouter()
  const proofPointId = params.id as string

  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [aiInput, setAiInput] = useState("")
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number | null>(null)

  const { data: proofPointProgress } = useSWR(
    proofPointId ? `proof-point-${proofPointId}` : null,
    () => progressApi.getProofPointProgress(proofPointId)
  )

  const { data: publishedExercises, isLoading: exercisesLoading } = useSWR<PublishedExercise[]>(
    proofPointId ? `proof-point-exercises-${proofPointId}` : null,
    () => proofPointsApi.getPublishedExercises(proofPointId)
  )

  const fallbackProofPoint = useMemo(() => buildFallbackProofPoint(proofPointId), [proofPointId])

  const exercises: ProofPointExercise[] = useMemo(() => {
    if (publishedExercises && publishedExercises.length > 0) {
      return publishedExercises.map((exercise) => ({
        id: exercise.id,
        nombre: exercise.nombre,
        tipo: exercise.template?.split(":")[1] || "leccion_interactiva",
        estimatedMinutes: exercise.duracionEstimadaMinutos ?? 20,
        status: "available",
        progress: 0,
      }))
    }
    return fallbackProofPoint.exercises
  }, [publishedExercises, fallbackProofPoint])

  const proofPoint: ProofPointOverview = useMemo(() => {
    return {
      ...fallbackProofPoint,
      progress: proofPointProgress?.progress ?? fallbackProofPoint.progress,
      exercises,
    }
  }, [exercises, fallbackProofPoint, proofPointProgress])

  const highlightExercise = getHighlightExercise(proofPoint.exercises)

  const handleExerciseClick = (exercise: ProofPointExercise, idx?: number) => {
    if (exercise.status === "locked") return
    const targetIdx =
      typeof idx === "number" && idx >= 0
        ? idx
        : proofPoint.exercises.findIndex((item) => item.id === exercise.id)
    setSelectedExerciseIdx(targetIdx >= 0 ? targetIdx : null)
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
            objectives={FALLBACK_OBJECTIVES}
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
