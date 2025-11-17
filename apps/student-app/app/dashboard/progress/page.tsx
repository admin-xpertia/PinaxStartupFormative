"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  BarChart3,
  ArrowLeft,
  Calendar,
  Target,
} from "lucide-react"
import Link from "next/link"
import { progressApi } from "@/services/api"
import { cn } from "@/lib/utils"
import { useStudentSession } from "@/lib/hooks/use-student-session"

export default function ProgressDashboardPage() {
  const { estudianteId, cohorteId } = useStudentSession()

  // Fetch progress summary - only when we have valid IDs
  const { data: summary, isLoading } = useSWR(
    estudianteId && cohorteId ? ["progress-summary", estudianteId, cohorteId] : null,
    () => progressApi.getProgressSummary(estudianteId!, cohorteId!)
  )

  // Format time
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get exercise template display name
  const getTemplateName = (template: string): string => {
    const names: Record<string, string> = {
      'leccion-interactiva': 'Lección Interactiva',
      'cuaderno-trabajo': 'Cuaderno de Trabajo',
      'simulacion-interaccion': 'Simulación',
      'mentor-ia': 'Mentor IA',
      'herramienta-analisis': 'Herramienta de Análisis',
      'herramienta-creacion': 'Herramienta de Creación',
      'sistema-tracking': 'Sistema de Tracking',
      'herramienta-revision': 'Herramienta de Revisión',
      'simulador-entorno': 'Simulador de Entorno',
      'sistema-progresion': 'Sistema de Progresión',
    }
    return names[template] || template
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando tu progreso...</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No se pudo cargar el progreso</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard">Volver al Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Mi Progreso</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>ES</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl py-8 px-4 space-y-8">
        {/* Overall Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progreso General
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {summary.completionPercentage}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.completedExercises} de {summary.totalExercises} ejercicios
              </p>
              <Progress value={summary.completionPercentage} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En Progreso
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">
                {summary.inProgressExercises}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ejercicios activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tiempo Total
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatTime(summary.totalTimeInvestedMinutes)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Invertido en aprendizaje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Puntuación Promedio
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {summary.averageScore ? `${summary.averageScore.toFixed(1)}` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                De 100 puntos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress by Proof Point */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Progreso por Proof Point</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {summary.proofPointStats.map((stat) => (
              <Card key={stat.proofPointId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{stat.proofPointName}</CardTitle>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={stat.completionPercentage === 100 ? "default" : "secondary"}>
                          {stat.completedExercises}/{stat.totalExercises} ejercicios
                        </Badge>
                        {stat.averageScore !== null && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Award className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">{stat.averageScore.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-3xl font-bold",
                        stat.completionPercentage === 100 ? "text-green-600" : "text-primary"
                      )}>
                        {stat.completionPercentage}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={stat.completionPercentage} className="h-2 mb-3" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(stat.timeInvestedMinutes)}</span>
                    </div>
                    {stat.completionPercentage === 100 ? (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Completado
                      </div>
                    ) : (
                      <div className="text-cyan-600 font-medium">
                        {stat.totalExercises - stat.completedExercises} restantes
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Completed Exercises */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Ejercicios Completados Recientemente</h2>
          <Card>
            <CardContent className="p-0">
              {summary.recentCompletedExercises.length > 0 ? (
                <div className="divide-y">
                  {summary.recentCompletedExercises.map((exercise) => (
                    <div
                      key={exercise.exerciseId}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <h3 className="font-semibold truncate">{exercise.exerciseName}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getTemplateName(exercise.exerciseTemplate)}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(exercise.completedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(exercise.timeInvestedMinutes)}</span>
                            </div>
                          </div>
                        </div>
                        {exercise.score !== null && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Award className="h-5 w-5 text-amber-600" />
                            <span className="text-lg font-bold text-amber-600">
                              {exercise.score}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Aún no has completado ningún ejercicio
                  </p>
                  <Button asChild>
                    <Link href="/dashboard">Comenzar Ahora</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Motivational Section */}
        {summary.completionPercentage > 0 && summary.completionPercentage < 100 && (
          <Card className="bg-gradient-to-r from-primary/10 to-background border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">¡Sigue así!</h3>
                  <p className="text-sm text-muted-foreground">
                    Has completado {summary.completedExercises} ejercicios.
                    {summary.totalExercises - summary.completedExercises > 0 &&
                      ` Solo te faltan ${summary.totalExercises - summary.completedExercises} más para completar todo el programa.`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {summary.completionPercentage === 100 && (
          <Card className="bg-gradient-to-r from-green-500/10 to-background border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">¡Felicitaciones! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    Has completado todos los ejercicios del programa.
                    Tu promedio es {summary.averageScore?.toFixed(1) || 'N/A'} y has invertido {formatTime(summary.totalTimeInvestedMinutes)} en tu aprendizaje.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
