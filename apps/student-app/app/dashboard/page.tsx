"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { BookOpen } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { enrollmentsApi } from "@/services/api"
import {
  DashboardHeader,
  NextExerciseCard,
  PhaseProofPoints,
  PhaseRoadmap,
  ProgramHero,
  StatsOverview,
} from "@/components/student/dashboard"
import { getPhaseProgress, getPhaseStatus, type PhaseStatus } from "@/lib/dashboard"
import type { Phase } from "@/types/enrollment"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const studentId =
    searchParams.get("studentId") ??
    process.env.NEXT_PUBLIC_STUDENT_ID ??
    process.env.NEXT_PUBLIC_DEFAULT_STUDENT_ID ??
    undefined
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0)

  const {
    data: enrollments,
    isLoading: loadingEnrollments,
  } = useSWR(
    ["my-enrollments", studentId ?? "default-student"],
    () => enrollmentsApi.getMy(studentId)
  )

  const activeEnrollment = enrollments?.[0]

  const { data: structure } = useSWR(
    activeEnrollment ? ["enrollment-structure", activeEnrollment.id] : null,
    () => enrollmentsApi.getStructure(activeEnrollment.id)
  )

  const { data: continuePoint } = useSWR(
    activeEnrollment ? ["continue-point", activeEnrollment.id] : null,
    () => enrollmentsApi.getContinuePoint(activeEnrollment.id)
  )

  const phases = structure?.phases ?? []
  const selectedPhase: Phase | undefined = phases[selectedPhaseIdx]

  useEffect(() => {
    if (phases.length > 0 && selectedPhaseIdx >= phases.length) {
      setSelectedPhaseIdx(0)
    }
  }, [phases.length, selectedPhaseIdx])

  const formatDate = (value?: string | Date | null) => {
    if (!value) return null
    const parsed = typeof value === "string" ? new Date(value) : value
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })
  }

  const stats = useMemo(() => {
    if (!activeEnrollment) {
      return { progress: 0, proofPointsLabel: "0/0", completed: 0, total: 0 }
    }
    const completed = activeEnrollment.completedProofPoints ?? 0
    const total = activeEnrollment.totalProofPoints ?? 0
    return {
      progress: activeEnrollment.overallProgress ?? 0,
      proofPointsLabel: `${completed}/${total}`,
      completed,
      total,
      instructor: activeEnrollment.instructorName,
      cohort: activeEnrollment.cohortId,
    }
  }, [activeEnrollment])

  const selectedPhaseProgress = getPhaseProgress(selectedPhase)
  const selectedPhaseStatus = getPhaseStatus(selectedPhase) as PhaseStatus
  const estimatedCompletionLabel =
    formatDate(activeEnrollment?.estimatedCompletionDate ?? null) ?? "En progreso"

  const handlePrimaryAction = () => {
    if (continuePoint) {
      router.push(`/exercises/${continuePoint.exerciseId}`)
      return
    }
    router.push("/dashboard/progress")
  }

  const handleSelectPhase = (idx: number) => setSelectedPhaseIdx(idx)
  const handleOpenProofPoint = (proofPointId: string) =>
    router.push(`/proof-points/${proofPointId}`)

  if (loadingEnrollments) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Cargando tu espacio de aprendizaje...
      </div>
    )
  }

  if (!activeEnrollment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <BookOpen className="h-12 w-12 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Aún no tienes un programa asignado</h1>
          <p className="text-muted-foreground">
            Solicita a tu instructor que te inscriba en una cohorte para comenzar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
        <section className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <ProgramHero
            programName={activeEnrollment.programName}
            programDescription={activeEnrollment.programDescription}
            selectedPhaseDurationWeeks={selectedPhase?.duracionSemanas}
            selectedPhaseOrder={selectedPhase?.orden}
            estimatedCompletionLabel={estimatedCompletionLabel}
            stats={stats}
            onPrimaryAction={handlePrimaryAction}
            primaryActionLabel={
              continuePoint ? "Continuar donde te quedaste" : "Ver mi progreso"
            }
          />

          <NextExerciseCard
            continuePoint={continuePoint}
            onContinue={() =>
              continuePoint && router.push(`/exercises/${continuePoint.exerciseId}`)
            }
          />
        </section>

        <StatsOverview
          stats={stats}
          selectedPhase={selectedPhase}
          selectedPhaseProgress={selectedPhaseProgress}
          selectedPhaseStatus={selectedPhaseStatus}
        />

        <section className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <PhaseRoadmap
            phases={phases}
            selectedPhaseIdx={selectedPhaseIdx}
            onSelect={handleSelectPhase}
          />

          <PhaseProofPoints phase={selectedPhase} onOpenProofPoint={handleOpenProofPoint} />
        </section>
      </main>
    </div>
  )
}
