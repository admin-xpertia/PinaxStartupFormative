"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  Clock,
  Target,
  BookOpen,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { enrollmentsApi, progressApi, proofPointsApi, type PublishedExercise } from "@/services/api"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

export default function ProofPointPage() {
  const params = useParams()
  const router = useRouter()
  const proofPointId = params.id as string

  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [aiInput, setAiInput] = useState("")
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number | null>(null)

  // Fetch proof point progress
  const { data: proofPointProgress } = useSWR(
    proofPointId ? `proof-point-${proofPointId}` : null,
    () => progressApi.getProofPointProgress(proofPointId)
  )

  // Fetch published exercises for this proof point
  const { data: publishedExercises, isLoading: exercisesLoading } = useSWR<PublishedExercise[]>(
    proofPointId ? `proof-point-exercises-${proofPointId}` : null,
    () => proofPointsApi.getPublishedExercises(proofPointId)
  )

  // Use real exercises if available, otherwise show empty state
  const hasRealExercises = publishedExercises && publishedExercises.length > 0

  // Mock data for demonstration (used when no real exercises are available yet)
  const mockProofPoint = {
    id: proofPointId,
    nombre: "Estilos de Liderazgo",
    descripcion: "Explora y practica diferentes estilos de liderazgo situacional para adaptarte efectivamente a diversos contextos organizacionales.",
    nivelId: "n1",
    nivelNombre: "Nivel 1: Fundamentos",
    phaseNombre: "Fase 2: Liderazgo Situacional",
    progress: 60,
    exercises: hasRealExercises ? publishedExercises.map((ex, idx) => ({
      id: ex.id,
      nombre: ex.nombre,
      tipo: ex.template.split(':')[1] || 'leccion_interactiva',
      estimatedMinutes: ex.duracionEstimadaMinutos,
      status: "available", // TODO: Get real status from progress API
      progress: 0,
    })) : [
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
  }

  const getExerciseIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (status === "in_progress") return <Circle className="h-5 w-5 text-cyan-600" />
    if (status === "available") return <Play className="h-5 w-5 text-cyan-400" />
    return <Lock className="h-5 w-5 text-gray-400" />
  }

  const getExerciseTypeLabel = (tipo: string) => {
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
    }
    return labels[tipo] || tipo
  }

  const handleSendMessage = () => {
    if (!aiInput.trim()) return

    setAiMessages([
      ...aiMessages,
      { role: "user", content: aiInput },
      { role: "assistant", content: "Esta es una respuesta simulada del asistente IA. La integración completa con IA estará disponible próximamente." },
    ])
    setAiInput("")
  }

  const handleExerciseClick = (exercise: any, idx: number) => {
    if (exercise.status === "locked") return
    setSelectedExerciseIdx(idx)
    router.push(`/exercises/${exercise.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Volver al Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">{mockProofPoint.nombre}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={mockProofPoint.progress} className="w-32 h-2" />
            <span className="font-medium text-sm">{mockProofPoint.progress}%</span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Navigation (25%) */}
        <aside className="w-1/4 border-r bg-muted/30">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Proof Point Info */}
              <Card>
                <CardHeader>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{mockProofPoint.phaseNombre}</p>
                    <CardTitle className="text-base">{mockProofPoint.nivelNombre}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{mockProofPoint.descripcion}</p>
                </CardContent>
              </Card>

              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tu Progreso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completados</span>
                    <span className="font-medium">
                      {mockProofPoint.exercises.filter(e => e.status === "completed").length} / {mockProofPoint.exercises.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tiempo estimado</span>
                    <span className="font-medium">
                      {mockProofPoint.exercises.reduce((acc, e) => acc + (e.status !== "completed" ? e.estimatedMinutes : 0), 0)} min
                    </span>
                  </div>
                  <Progress value={mockProofPoint.progress} className="h-2" />
                </CardContent>
              </Card>

              {/* Exercise List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Ejercicios
                    {hasRealExercises && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {publishedExercises.length} publicados
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {exercisesLoading && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Cargando ejercicios...
                    </p>
                  )}
                  {!exercisesLoading && mockProofPoint.exercises.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No hay ejercicios publicados aún
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        El instructor está preparando los ejercicios para este proof point
                      </p>
                    </div>
                  )}
                  {!exercisesLoading && mockProofPoint.exercises.map((exercise, idx) => (
                    <button
                      key={exercise.id}
                      onClick={() => handleExerciseClick(exercise, idx)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all",
                        exercise.status === "locked" && "opacity-50 cursor-not-allowed",
                        exercise.status === "available" && "border-cyan-400 bg-cyan-50/50 hover:bg-cyan-50",
                        exercise.status === "in_progress" && "border-cyan-600 bg-cyan-100/50",
                        exercise.status === "completed" && "border-green-200 bg-green-50/50",
                        selectedExerciseIdx === idx && "ring-2 ring-primary"
                      )}
                      disabled={exercise.status === "locked"}
                    >
                      <div className="flex items-start gap-3">
                        {getExerciseIcon(exercise.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getExerciseTypeLabel(exercise.tipo)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">{exercise.nombre}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{exercise.estimatedMinutes} min</span>
                          </div>
                          {exercise.status !== "locked" && exercise.status !== "completed" && (
                            <Progress value={exercise.progress} className="mt-2 h-1" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </aside>

        {/* Center - Main Content (50%) */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-3xl py-8 px-6">
            {selectedExerciseIdx === null ? (
              <div className="space-y-6">
                {/* Welcome Section */}
                <Card className="bg-gradient-to-r from-primary/10 to-background border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Target className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{mockProofPoint.nombre}</h2>
                        <p className="text-muted-foreground mb-4">{mockProofPoint.descripcion}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {mockProofPoint.exercises.length} ejercicios
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            ~{mockProofPoint.exercises.reduce((acc, e) => acc + e.estimatedMinutes, 0)} min totales
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Start */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comienza Aquí</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockProofPoint.exercises
                      .filter(e => e.status === "in_progress" || (e.status === "available" && !mockProofPoint.exercises.some(ex => ex.status === "in_progress")))
                      .slice(0, 1)
                      .map((exercise) => (
                        <div
                          key={exercise.id}
                          className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Badge variant="outline" className="mb-2">
                                {getExerciseTypeLabel(exercise.tipo)}
                              </Badge>
                              <p className="font-medium mb-1">{exercise.nombre}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>~{exercise.estimatedMinutes} minutos</span>
                              </div>
                              {exercise.progress > 0 && (
                                <Progress value={exercise.progress} className="mt-2 h-2" />
                              )}
                            </div>
                            <Button onClick={() => handleExerciseClick(exercise, mockProofPoint.exercises.indexOf(exercise))}>
                              {exercise.status === "in_progress" ? "Continuar" : "Comenzar"}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                {/* Learning Objectives */}
                <Card>
                  <CardHeader>
                    <CardTitle>Objetivos de Aprendizaje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Identificar los principales estilos de liderazgo y sus características</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Reconocer tu estilo natural de liderazgo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Practicar la adaptación del estilo según el contexto</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Desarrollar flexibilidad en tu aproximación al liderazgo</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando ejercicio...</p>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - AI Assistant (25%) */}
        <aside className="w-1/4 border-l bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Asistente IA</h3>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {aiMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Pregunta cualquier cosa sobre este proof point
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => setAiInput("¿Cuál es el mejor estilo de liderazgo?")}
                    >
                      ¿Cuál es el mejor estilo de liderazgo?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => setAiInput("Dame ejemplos prácticos")}
                    >
                      Dame ejemplos prácticos
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        msg.role === "user" ? "bg-primary text-primary-foreground ml-4" : "bg-muted mr-4"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={!aiInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
