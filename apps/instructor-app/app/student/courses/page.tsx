"use client"

import { useState } from "react"
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
  Award
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { programsApi } from "@/services/api"

// TODO: Replace with actual student enrollment API
const mockStudentEnrollments = [
  {
    id: "cohort_1",
    programId: "program_1",
    programName: "Desarrollo de Liderazgo Transformacional",
    instructorName: "Dr. María García",
    progress: 45,
    completedProofPoints: 12,
    totalProofPoints: 27,
    currentPhase: "Fase 2: Liderazgo Situacional",
    nextExercise: {
      id: "ex_123",
      name: "Análisis de Estilos de Liderazgo",
      proofPointName: "Adaptación Contextual",
      type: "cuaderno_trabajo",
    },
  },
  {
    id: "cohort_2",
    programId: "program_2",
    programName: "Emprendimiento e Innovación",
    instructorName: "Ing. Carlos Ruiz",
    progress: 20,
    completedProofPoints: 5,
    totalProofPoints: 24,
    currentPhase: "Fase 1: Mindset Emprendedor",
    nextExercise: {
      id: "ex_456",
      name: "Identificación de Oportunidades",
      proofPointName: "Visión de Mercado",
      type: "herramienta_analisis",
    },
  },
]

export default function StudentCoursesPage() {
  const router = useRouter()

  // TODO: Fetch real student enrollments
  const enrollments = mockStudentEnrollments

  const handleContinueCourse = (courseId: string, exerciseId: string) => {
    router.push(`/student/exercises/${exerciseId}`)
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
                    <p className="text-2xl font-bold">
                      {enrollments.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cursos Activos
                    </p>
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
                    <p className="text-2xl font-bold">
                      {enrollments.reduce((sum, e) => sum + e.completedProofPoints, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Proof Points Completados
                    </p>
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
                    <p className="text-2xl font-bold">
                      {Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Progreso Promedio
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Cards */}
          <div className="space-y-6">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {enrollment.programName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>Por {enrollment.instructorName}</span>
                        <span>•</span>
                        <span>{enrollment.currentPhase}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {enrollment.progress}% completado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={enrollment.progress} className="h-2" />
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
                  {enrollment.nextExercise && (
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Continuar con:
                          </p>
                          <h4 className="font-semibold mb-1">
                            {enrollment.nextExercise.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.nextExercise.proofPointName}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleContinueCourse(
                            enrollment.id,
                            enrollment.nextExercise!.id
                          )}
                        >
                          Continuar
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/student/courses/${enrollment.id}/overview`}>
                        <Target className="h-4 w-4 mr-2" />
                        Ver Estructura
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/student/courses/${enrollment.id}/progress`}>
                        <Award className="h-4 w-4 mr-2" />
                        Mi Progreso
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {enrollments.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No estás inscrito en ningún curso
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Contacta a tu instructor para que te asigne a un programa de aprendizaje
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
