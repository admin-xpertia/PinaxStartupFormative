"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { BookOpen } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { enrollmentsApi, progressApi } from "@/services/api"
import {
  DashboardHeader,
  NextExerciseCard,
  PhaseRoadmapAccordion,
  ProgramCard,
  StatsOverview,
} from "@/components/student/dashboard"
import { getPhaseProgress, getPhaseStatus, type PhaseStatus } from "@/lib/dashboard"
import { cn } from "@/lib/utils"
import type { Phase } from "@shared-types/enrollment"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useStudentSession } from "@/lib/hooks/use-student-session"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = useStudentSession()
  const studentIdOverride = searchParams.get("studentId")
  const studentId = studentIdOverride ?? session.estudianteId ?? undefined
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null)

  useEffect(() => {
    // Redirigir al login si no hay autenticación y no hay ID de estudiante
    if (!session.isLoading && !session.isAuthenticated && !session.estudianteId && !studentIdOverride) {
      router.replace("/login")
    }
  }, [session.isLoading, session.isAuthenticated, session.estudianteId, studentIdOverride, router])

  const {
    data: enrollments,
    isLoading: loadingEnrollments,
  } = useSWR(
    studentId ? ["my-enrollments", studentId] : null,
    () => enrollmentsApi.getMy(studentId!)
  )

  // Auto-select if only one enrollment, or use manually selected one
  const activeEnrollment = useMemo(() => {
    if (!enrollments || enrollments.length === 0) return null
    if (enrollments.length === 1) return enrollments[0]
    if (selectedEnrollmentId) {
      return enrollments.find(e => e.id === selectedEnrollmentId) || null
    }
    return null
  }, [enrollments, selectedEnrollmentId])

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

  const selectedPhase: Phase | undefined = useMemo(() => {
    if (!phases.length) return undefined
    if (activePhaseId) {
      const found = phases.find((phase) => phase.id === activePhaseId)
      if (found) return found
    }
    return phases[0]
  }, [activePhaseId, phases])

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

  const handleOpenProofPoint = (proofPointId: string) =>
    router.push(`/proof-points/${proofPointId}`)

  if (!studentId) {
    if (session.isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Cargando tu espacio de aprendizaje...
        </div>
      )
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Inicia sesión para ver tus programas.</p>
        <Button onClick={() => router.push("/login")}>Ir a login</Button>
      </div>
    )
  }

  if (loadingEnrollments) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Cargando tu espacio de aprendizaje...
      </div>
    )
  }

  // Show program gallery if multiple enrollments and none selected
  if (enrollments && enrollments.length > 1 && !selectedEnrollmentId) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Mis Programas</h1>
            <p className="text-xl text-muted-foreground">
              Selecciona un programa para continuar tu aprendizaje
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <ProgramCard
                key={enrollment.id}
                enrollment={enrollment}
                onSelect={() => setSelectedEnrollmentId(enrollment.id)}
              />
            ))}
          </div>
        </main>
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
      <DashboardHeader
        showProgramSelector={enrollments && enrollments.length > 1}
        onNavigateToProgramGallery={() => setSelectedEnrollmentId(null)}
        currentProgramName={activeEnrollment.programName}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
        <section className="grid gap-6 xl:grid-cols-[1.75fr,1fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/15 via-primary/10 to-white p-6 shadow-lg">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary">
                    Hola, {activeEnrollment.studentId ?? "Estudiante"}
                  </p>
                  <h1 className="text-3xl font-bold leading-tight text-slate-900">
                    Tu siguiente paso está listo
                  </h1>
                  <p className="text-base text-slate-700">
                    {continuePoint
                      ? `Continuemos con ${continuePoint.exerciseName}.`
                      : "Revisa tu roadmap para elegir el próximo reto."}
                  </p>
                </div>
                <div className="min-w-[230px] rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Progreso general</p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-primary">
                      {Math.round(stats.progress)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stats.proofPointsLabel} proof points
                    </span>
                  </div>
                  <Progress value={stats.progress} className="mt-2 h-2" />
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Fin estimado: {estimatedCompletionLabel}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <NextExerciseCard
                  continuePoint={continuePoint}
                  onContinue={() =>
                    continuePoint && router.push(`/exercises/${continuePoint.exerciseId}`)
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-none bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tu programa</CardTitle>
                <CardDescription>
                  Mantén el contexto de la fase actual sin perder de vista el objetivo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold leading-tight">
                      {activeEnrollment.programName}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {activeEnrollment.programDescription ||
                        "Explora los retos de tu programa para avanzar."}
                    </p>
                  </div>
                  {selectedPhase && (
                    <Badge variant="outline" className="rounded-full">
                      Fase {selectedPhase.orden}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tiempo estimado</span>
                    <span className="font-medium">
                      {selectedPhase?.duracionSemanas
                        ? `${selectedPhase.duracionSemanas} semanas`
                        : "Por definir"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fecha objetivo</span>
                    <span className="font-medium">{estimatedCompletionLabel}</span>
                  </div>
                </div>

                <Button className="w-full" onClick={handlePrimaryAction}>
                  {continuePoint ? "Continuar donde te quedaste" : "Ver mi progreso"}
                </Button>
              </CardContent>
            </Card>

            {enrollments && enrollments.length > 1 && (
              <Card className="border-none bg-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Mis programas</CardTitle>
                  <CardDescription>
                    Elige rápidamente el programa que quieres continuar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {enrollments.map((enrollment) => {
                    const isActive = enrollment.id === activeEnrollment.id
                    const percentage = Math.round(enrollment.overallProgress || 0)
                    return (
                      <button
                        key={enrollment.id}
                        onClick={() => setSelectedEnrollmentId(enrollment.id)}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition-all hover:border-primary/50 hover:shadow-sm",
                          isActive ? "border-primary/50 bg-primary/5" : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {enrollment.programName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Instructor: {enrollment.instructorName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Progreso</p>
                            <p className="text-sm font-semibold">{percentage}%</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <StatsOverview
          stats={stats}
          selectedPhase={selectedPhase}
          selectedPhaseProgress={selectedPhaseProgress}
          selectedPhaseStatus={selectedPhaseStatus}
        />

        <PhaseRoadmapAccordion
          phases={phases}
          onOpenProofPoint={handleOpenProofPoint}
          activePhaseId={selectedPhase?.id}
          onPhaseChange={setActivePhaseId}
        />
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
