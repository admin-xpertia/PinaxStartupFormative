"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { enrollmentsApi, progressApi } from "@/services/api"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const router = useRouter()
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0)

  // Fetch enrollments
  const { data: enrollments } = useSWR("my-enrollments", enrollmentsApi.getMy)

  // Fetch continue point
  const { data: continuePoint } = useSWR("continue-point", progressApi.getContinuePoint)

  // Fetch activity log
  const { data: activities } = useSWR("activity-log", () => progressApi.getActivityLog(3))

  // Mock data for demonstration (remove when API is ready)
  const enrollment = enrollments?.[0] || {
    id: "e1",
    programName: "Desarrollo de Liderazgo Transformacional",
    instructorName: "Dr. María García",
    overallProgress: 45,
    completedProofPoints: 12,
    totalProofPoints: 27,
  }

  const mockStructure = {
    phases: [
      {
        id: "p1",
        nombre: "Fase 1: Autoconocimiento",
        orden: 1,
        proofPoints: [
          {
            id: "pp1",
            nombre: "Identidad Personal",
            status: "completed",
            progress: 100,
            exercises: [{ status: "completed" }, { status: "completed" }],
          },
          {
            id: "pp2",
            nombre: "Valores Fundamentales",
            status: "completed",
            progress: 100,
            exercises: [{ status: "completed" }],
          },
        ],
      },
      {
        id: "p2",
        nombre: "Fase 2: Liderazgo Situacional",
        orden: 2,
        proofPoints: [
          {
            id: "pp3",
            nombre: "Estilos de Liderazgo",
            status: "in_progress",
            progress: 60,
            exercises: [
              { status: "completed" },
              { status: "in_progress" },
              { status: "available" },
            ],
          },
          {
            id: "pp4",
            nombre: "Adaptación Contextual",
            status: "available",
            progress: 0,
            exercises: [{ status: "locked" }],
          },
        ],
      },
      {
        id: "p3",
        nombre: "Fase 3: Influencia y Comunicación",
        orden: 3,
        proofPoints: [
          { id: "pp5", nombre: "Comunicación Efectiva", status: "locked", progress: 0 },
          { id: "pp6", nombre: "Manejo de Conflictos", status: "locked", progress: 0 },
        ],
      },
      {
        id: "p4",
        nombre: "Fase 4: Impacto Organizacional",
        orden: 4,
        proofPoints: [
          { id: "pp7", nombre: "Cultura Organizacional", status: "locked", progress: 0 },
          { id: "pp8", nombre: "Liderazgo de Equipos", status: "locked", progress: 0 },
        ],
      },
    ],
  }

  const getProofPointIcon = (status: string, progress: number) => {
    if (status === "completed") {
      return <CheckCircle2 className="h-6 w-6 text-green-600" />
    }
    if (status === "in_progress") {
      return (
        <div className="relative h-6 w-6">
          <Circle className="h-6 w-6 text-cyan-600" />
          <div
            className="absolute inset-0 rounded-full border-2 border-cyan-600"
            style={{
              clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`,
              background: "rgba(8, 145, 178, 0.3)",
            }}
          />
        </div>
      )
    }
    if (status === "available") {
      return <Circle className="h-6 w-6 text-cyan-400 animate-pulse" />
    }
    return <Lock className="h-6 w-6 text-gray-400" />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Xpertia</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/progress">Mi Progreso</Link>
            </Button>
            <Avatar>
              <AvatarFallback>ES</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="container px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{enrollment.programName}</span>
            <div className="flex items-center gap-2">
              <Progress value={enrollment.overallProgress} className="w-32 h-2" />
              <span className="font-medium">{enrollment.overallProgress}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl py-8 px-4 space-y-8">
        {/* Continue Where You Left Off */}
        {continuePoint && (
          <Card className="bg-gradient-to-r from-primary/10 to-background border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Continúa donde dejaste
                  </p>
                  <h3 className="text-xl font-bold mb-2">{continuePoint.exerciseName}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {continuePoint.proofPointName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      ~{continuePoint.estimatedTimeRemaining} min restantes
                    </span>
                  </div>
                  <Progress value={continuePoint.progress} className="mt-3 h-2" />
                </div>
                <Button size="lg" onClick={() => router.push(`/exercises/${continuePoint.exerciseId}`)}>
                  Continuar
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roadmap Horizontal */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Mi Roadmap</h2>

          {/* Phase Timeline */}
          <div className="relative">
            {/* Horizontal Line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-border" />

            {/* Phases */}
            <div className="grid grid-cols-4 gap-4 relative">
              {mockStructure.phases.map((phase, idx) => {
                const isActive = idx === selectedPhaseIdx
                const allCompleted = phase.proofPoints.every(pp => pp.status === "completed")
                const hasInProgress = phase.proofPoints.some(pp => pp.status === "in_progress")

                return (
                  <div key={phase.id} className="space-y-4">
                    {/* Phase Node */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => setSelectedPhaseIdx(idx)}
                        className={cn(
                          "w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold transition-all relative z-10",
                          allCompleted && "bg-green-100 border-green-600 text-green-600",
                          hasInProgress && !allCompleted && "bg-cyan-100 border-cyan-600 text-cyan-600",
                          !allCompleted && !hasInProgress && "bg-background border-border text-muted-foreground",
                          isActive && "ring-4 ring-primary/20 scale-110"
                        )}
                      >
                        {idx + 1}
                      </button>
                      <p className={cn(
                        "mt-2 text-sm font-medium text-center px-2",
                        isActive && "text-foreground font-semibold",
                        !isActive && "text-muted-foreground"
                      )}>
                        {phase.nombre}
                      </p>
                    </div>

                    {/* Proof Points */}
                    {isActive && (
                      <div className="space-y-2 mt-8">
                        {phase.proofPoints.map((pp) => (
                          <Card
                            key={pp.id}
                            className={cn(
                              "cursor-pointer hover:shadow-md transition-all",
                              pp.status === "locked" && "opacity-50",
                              pp.status === "available" && "border-cyan-400 shadow-cyan-100 shadow-sm"
                            )}
                            onClick={() => {
                              if (pp.status !== "locked") {
                                router.push(`/proof-points/${pp.id}`)
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {getProofPointIcon(pp.status, pp.progress)}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{pp.nombre}</p>
                                  {pp.status !== "locked" && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <Progress value={pp.progress} className="flex-1 h-1" />
                                      <span className="text-xs text-muted-foreground">
                                        {pp.progress}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Quick Stats & Activities */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities?.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.entityName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Completa tu primer ejercicio para ver tu actividad
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Hitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded">
                <Target className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Completar Fase 2</p>
                  <p className="text-xs text-muted-foreground">2 proof points restantes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Deadline Recomendado</p>
                  <p className="text-xs text-muted-foreground">15 de Febrero</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
