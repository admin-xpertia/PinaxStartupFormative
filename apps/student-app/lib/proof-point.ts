import type { ProofPointExercise } from "@/types/proof-point"

export const exerciseStatusTokens = {
  completed: {
    badge: "text-emerald-600 border-emerald-100 bg-emerald-50",
    card: "border-emerald-100 bg-emerald-50/70",
  },
  in_progress: {
    badge: "text-primary border-primary/30 bg-primary/10",
    card: "border-primary/30 bg-primary/5",
  },
  available: {
    badge: "text-sky-600 border-sky-100 bg-sky-50",
    card: "border-sky-100 bg-sky-50/70",
  },
  locked: {
    badge: "text-slate-500 border-slate-200 bg-slate-50",
    card: "border-dashed border-slate-200 bg-slate-50/60",
  },
} as const

export const getExerciseTypeLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    leccion_interactiva: "Lección",
    cuaderno_trabajo: "Cuaderno",
    simulacion_interaccion: "Simulación",
    mentor_ia: "Mentor IA",
    herramienta_analisis: "Análisis",
    herramienta_creacion: "Creación",
    sistema_tracking: "Tracking",
    herramienta_revision: "Revisión",
    simulador_entorno: "Entorno",
    sistema_progresion: "Progresión",
    caso: "Caso",
    instrucciones: "Instrucciones",
    metacognicion: "Metacognición",
  }
  return labels[tipo] || tipo
}

export const getHighlightExercise = (exercises: ProofPointExercise[]) => {
  if (exercises.length === 0) return null
  const inProgress = exercises.find((exercise) => exercise.status === "in_progress")
  if (inProgress) return inProgress
  return exercises.find((exercise) => exercise.status === "available") ?? exercises[0]
}

export const countCompletedExercises = (exercises: ProofPointExercise[]) =>
  exercises.filter((exercise) => exercise.status === "completed").length

export const estimatePendingMinutes = (exercises: ProofPointExercise[]) =>
  exercises.reduce(
    (acc, exercise) => acc + (exercise.status === "completed" ? 0 : exercise.estimatedMinutes),
    0
  )
