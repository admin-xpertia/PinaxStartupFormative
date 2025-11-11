import type { Phase, ProofPoint } from "@/types/enrollment"

export const proofPointStatusThemes = {
  completed: {
    label: "Completado",
    badge: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    card: "border-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.12)]",
  },
  in_progress: {
    label: "En progreso",
    badge: "bg-primary/10 text-primary border border-primary/30",
    card: "border-primary/30 shadow-[0_12px_30px_rgba(14,165,233,0.18)]",
  },
  available: {
    label: "Disponible",
    badge: "bg-sky-50 text-sky-600 border border-sky-100",
    card: "border-sky-100 shadow-[0_10px_25px_rgba(14,165,233,0.12)]",
  },
  locked: {
    label: "Bloqueado",
    badge: "bg-slate-100 text-slate-500 border border-slate-200",
    card: "border-dashed border-slate-200 bg-slate-50/70",
  },
} as const

export const phaseStatusThemes = {
  completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  available: "bg-sky-50 text-sky-600 border-sky-100",
  locked: "bg-slate-100 text-slate-500 border-slate-200",
} as const

export const phaseStatusLabels = {
  completed: "Completada",
  in_progress: "En curso",
  available: "Disponible",
  locked: "Bloqueada",
} as const

export type PhaseStatus = keyof typeof phaseStatusLabels
export type ProofPointStatus = keyof typeof proofPointStatusThemes

export const getPhaseProgress = (phase?: Phase | null) => {
  if (!phase || phase.proofPoints.length === 0) return 0
  const total = phase.proofPoints.reduce(
    (acc, proofPoint) => acc + (proofPoint.progress ?? 0),
    0
  )
  return Math.round(total / phase.proofPoints.length)
}

export const getPhaseStatus = (phase?: Phase | null): PhaseStatus => {
  if (!phase || phase.proofPoints.length === 0) return "locked"
  const statuses = phase.proofPoints.map((proofPoint) => proofPoint.status)
  if (statuses.every((status) => status === "completed")) return "completed"
  if (statuses.some((status) => status === "in_progress")) return "in_progress"
  if (statuses.some((status) => status === "available")) return "available"
  return "locked"
}

export const getProofPointStatus = (proofPoint: ProofPoint): ProofPointStatus => {
  return proofPoint.status ?? "locked"
}
