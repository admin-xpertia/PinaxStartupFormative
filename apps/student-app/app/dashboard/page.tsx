"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { BookOpen, Target, Map as MapIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { enrollmentsApi, progressApi } from "@/services/api"
import {
  DashboardHeader,
  NextExerciseCard,
  PhaseProofPoints,
  PhaseRoadmap,
  ProgramHero,
  StatsOverview,
} from "@/components/student/dashboard"
import { getPhaseProgress, getPhaseStatus, type PhaseStatus } from "@/lib/dashboard"
import type { Phase } from "@shared-types/enrollment"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const studentId =
    searchParams.get("studentId") ??
    process.env.NEXT_PUBLIC_STUDENT_ID ??
    process.env.NEXT_PUBLIC_DEFAULT_STUDENT_ID ??
    undefined
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0)
  const [viewMode, setViewMode] = useState<'focus' | 'roadmap'>('focus')

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
    activeEnrollment ? () => enrollmentsApi.getStructure(activeEnrollment.id) : null
  )

  const { data: continuePoint } = useSWR(
    activeEnrollment ? ["continue-point", activeEnrollment.id] : null,
    activeEnrollment ? () => enrollmentsApi.getContinuePoint(activeEnrollment.id) : null
  )

  const { data: progressSummary } = useSWR(
    activeEnrollment?.studentId && activeEnrollment?.cohortId
      ? ["dashboard-progress-summary", activeEnrollment.studentId, activeEnrollment.cohortId]
      : null,
    () =>
      progressApi.getProgressSummary(
        activeEnrollment!.studentId,
        activeEnrollment!.cohortId
      )
  )

  const phases = useMemo(() => {
    if (!structure?.phases) return []
    if (!progressSummary?.proofPointStats?.length) {
      return structure.phases
    }

    const statsMap = new Map(
      progressSummary.proofPointStats.map((stat) => [stat.proofPointId, stat])
    )

    return structure.phases.map((phase) => ({
      ...phase,
      proofPoints: phase.proofPoints.map((proofPoint) => {
        const stat = statsMap.get(proofPoint.id)
        if (!stat) {
          return proofPoint
        }

        if (proofPoint.status === "locked") {
          return {
            ...proofPoint,
            progress: stat.completionPercentage,
          }
        }

        const status: "completed" | "available" | "in_progress" =
          stat.totalExercises > 0 && stat.completedExercises >= stat.totalExercises
            ? "completed"
            : stat.completedExercises > 0 || stat.completionPercentage > 0
              ? "in_progress"
              : "available"

        return {
          ...proofPoint,
          status,
          progress: stat.completionPercentage,
        }
      }),
    }))
  }, [structure, progressSummary])

  const phaseCount = phases.length
  const selectedPhase: Phase | undefined = phases[selectedPhaseIdx]

  useEffect(() => {
    if (phaseCount > 0 && selectedPhaseIdx >= phaseCount) {
      setSelectedPhaseIdx(0)
    }
  }, [phaseCount, selectedPhaseIdx])

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

    const totalFromStructure = phases.reduce(
      (acc, phase) => acc + phase.proofPoints.length,
      0
    )
    const total =
      totalFromStructure || activeEnrollment.totalProofPoints || 0

    const completedFromSummary = progressSummary
      ? progressSummary.proofPointStats.filter(
          (stat) => stat.totalExercises > 0 && stat.completedExercises >= stat.totalExercises
        ).length
      : activeEnrollment.completedProofPoints ?? 0

    const progressValue =
      progressSummary?.completionPercentage ?? activeEnrollment.overallProgress ?? 0

    return {
      progress: progressValue,
      proofPointsLabel: `${completedFromSummary}/${total}`,
      completed: completedFromSummary,
      total,
      instructor: activeEnrollment.instructorName,
      cohort: activeEnrollment.cohortId,
    }
  }, [activeEnrollment, phases, progressSummary])

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
        {/* Toggle View Mode */}
        <div className="flex justify-center gap-2">
          <Button
            variant={viewMode === 'focus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('focus')}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Modo Enfoque
          </Button>
          <Button
            variant={viewMode === 'roadmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('roadmap')}
            className="gap-2"
          >
            <MapIcon className="h-4 w-4" />
            Ver Roadmap Completo
          </Button>
        </div>

        {/* Focus Mode */}
        {viewMode === 'focus' && (
          <div className="flex flex-col items-center justify-center gap-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">
                Hola, {activeEnrollment.studentId ?? 'Estudiante'}
              </h1>
              <p className="text-xl text-muted-foreground">
                Tu misión de hoy
              </p>
            </div>

            <Card className="w-full max-w-2xl border-2 border-primary/20 shadow-lg">
              <CardContent className="p-8">
                {continuePoint ? (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold">
                        {continuePoint.proofPointName}
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        {continuePoint.exerciseName}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => router.push(`/exercises/${continuePoint.exerciseId}`)}
                      className="w-full text-lg h-14"
                    >
                      Comenzar Ejercicio
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      Progreso general: {stats.progress.toFixed(0)}% • {stats.proofPointsLabel} Proof Points completados
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-semibold">
                      ¡Felicidades! 🎉
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Has completado todos los ejercicios disponibles
                    </p>
                    <Button
                      size="lg"
                      onClick={() => router.push('/dashboard/progress')}
                      className="w-full text-lg h-14"
                    >
                      Ver Mi Progreso
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Roadmap Mode */}
        {viewMode === 'roadmap' && (
          <>
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
          </>
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Cargando tu espacio de aprendizaje...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
