"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  Lock,
  ChevronRight,
  TrendingUp,
  Target,
  Award,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/services/api"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import type { ProgramStructure, ProofPoint, ExerciseSummary } from "@/types/enrollment"

interface StudentEnrollment {
  id: string
  studentId: string
  cohortId: string
  programId: string
  programName: string
  programDescription: string
  instructorName: string
  enrolledAt: string
  status: "active" | "completed" | "dropped"
  overallProgress: number
  completedProofPoints: number
  totalProofPoints: number
  estimatedCompletionDate?: string
  currentPhaseId?: string
  currentProofPointId?: string
  currentExerciseId?: string
  snapshotStructure?: ProgramStructure
}

interface ExerciseWithContext extends ExerciseSummary {
  proofPointName: string
}

export default function StudentCoursesPage() {
  const router = useRouter()

  const {
    data: enrollments,
    error,
    isLoading,
  } = useSWR<StudentEnrollment[]>("student/enrollments", () =>
    apiClient.get<StudentEnrollment[]>("/student/enrollments"),
  )

  const courses = enrollments ?? []

  const stats = useMemo(() => {
    if (!courses.length) {
      return { totalCourses: 0, completedProofPoints: 0, averageProgress: 0 }
    }

    const completedProofPoints = courses.reduce(
      (sum, enrollment) => sum + enrollment.completedProofPoints,
      0,
    )

    const averageProgress = Math.round(
      courses.reduce((sum, enrollment) => sum + enrollment.overallProgress, 0) / courses.length,
    )

    return {
      totalCourses: courses.length,
      completedProofPoints,
      averageProgress,
    }
  }, [courses])

  const handleContinueCourse = (exerciseId?: string) => {
    if (!exerciseId) return
    router.push(`/student/exercises/${exerciseId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState text="Cargando cursos del estudiante..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <ErrorState
          title="No pudimos cargar los cursos"
          message="Verifica tu conexión o vuelve a intentarlo en unos minutos."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Xpertia</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/profile">Mi Perfil</Link>
            </Button>
            <Avatar>
              <AvatarFallback>ES</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl py-8 px-4">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold mb-2">Mis Cursos</h2>
            <p className="text-muted-foreground">
              Continúa tu viaje de aprendizaje transformacional
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalCourses}</p>
                    <p className="text-sm text-muted-foreground">Cursos Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completedProofPoints}</p>
                    <p className="text-sm text-muted-foreground">Proof Points Completados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.averageProgress}%</p>
                    <p className="text-sm text-muted-foreground">Progreso Promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {!courses.length ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={BookOpen}
                  title="No tienes cursos asignados"
                  description="Cuando un instructor te inscriba en una cohorte, verás el programa y su progreso en esta vista."
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Course Cards */}
              <div className="space-y-6">
                {courses.map((enrollment) => {
                  const nextExercise = resolveNextExercise(enrollment)
                  const phaseName = resolvePhaseName(enrollment)

                  return (
                    <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{enrollment.programName}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <span>Por {enrollment.instructorName}</span>
                              <span>•</span>
                              <span>{phaseName}</span>
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            {Math.round(enrollment.overallProgress)}% completado
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <Progress value={enrollment.overallProgress} className="h-2" />
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                              {enrollment.completedProofPoints} / {enrollment.totalProofPoints} Proof Points
                            </span>
                            <span>
                              {enrollment.totalProofPoints - enrollment.completedProofPoints} restantes
                            </span>
                          </div>
                        </div>

                        {/* Next Exercise */}
                        {nextExercise ? (
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Continuar con:
                                </p>
                                <h4 className="text-lg font-semibold">{nextExercise.nombre}</h4>
                                <p className="text-sm text-muted-foreground">{nextExercise.proofPointName}</p>
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                {formatExerciseType(nextExercise.tipo)}
                              </Badge>
                            </div>
                            <Button className="mt-4 w-full" onClick={() => handleContinueCourse(nextExercise.id)}>
                              Continuar ejercicio
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg border text-sm text-muted-foreground">
                            No hay ejercicios pendientes en este programa.
                          </div>
                        )}

                        {/* Actions */}
                        <div className="grid gap-3 md:grid-cols-3">
                          <Button variant="outline" asChild>
                            <Link href={`/student/courses/${enrollment.id}/overview`}>Ver resumen</Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href={`/student/courses/${enrollment.id}/progress`}>Progreso detallado</Link>
                          </Button>
                          <Button variant="secondary" asChild>
                            <Link href={`/student/courses/${enrollment.id}/resources`}>
                              Recursos
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function formatExerciseType(tipo: string) {
  return tipo.replace(/_/g, " ")
}

function resolvePhaseName(enrollment: StudentEnrollment) {
  const phases = enrollment.snapshotStructure?.phases ?? []
  const currentPhase =
    phases.find((phase) => phase.id === enrollment.currentPhaseId) ?? phases[0]
  return currentPhase?.nombre ?? "Fase no definida"
}

function resolveNextExercise(enrollment: StudentEnrollment): ExerciseWithContext | undefined {
  const structure = enrollment.snapshotStructure
  if (!structure) return undefined

  const iterator = iterateExercises(structure)

  if (enrollment.currentExerciseId) {
    const exercise = iterator((item) => item.id === enrollment.currentExerciseId)
    if (exercise) return exercise
  }

  if (enrollment.currentProofPointId) {
    const exercise = iterator((_exercise, proofPoint) => proofPoint.id === enrollment.currentProofPointId)
    if (exercise) return exercise
  }

  return iterator((exercise) => exercise.status !== "completed")
}

function iterateExercises(
  structure: ProgramStructure,
): (predicate: (exercise: ExerciseSummary, proofPoint: ProofPoint) => boolean) => ExerciseWithContext | undefined {
  return (predicate) => {
    for (const phase of structure.phases) {
      for (const proofPoint of phase.proofPoints) {
        for (const exercise of proofPoint.exercises) {
          if (predicate(exercise, proofPoint)) {
            return { ...exercise, proofPointName: proofPoint.nombre }
          }
        }
      }
    }
    return undefined
  }
}
