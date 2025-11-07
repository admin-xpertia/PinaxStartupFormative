"use client"

import { use } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  BookOpen,
  FileText,
  MessageSquare,
  Wrench,
  Clock,
  Target,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { notFound } from "next/navigation"
import type { Program } from "@/types/program"
import { programsApi } from "@/services/api"

export default function ProgramPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const {
    data: program,
    error,
    isLoading,
    mutate,
  } = useSWR<Program>(id ? `program-${id}` : null, () => id ? programsApi.getById(id) : null)

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <LoadingState text="Cargando programa..." />
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <ErrorState message={error.message || "Error al cargar el programa"} retry={() => mutate()} />
          </main>
        </div>
      </div>
    )
  }

  if (!program) {
    notFound()
  }

  const programId = program.id ?? id

  // Mock data para la estructura del programa
  const fases = [
    {
      id: "fase-1",
      nombre: "Descubrimiento y Validación de Problema",
      descripcion: "Identifica y valida el problema que tu solución busca resolver",
      orden: 1,
      estado: "completado" as const,
      proofPoints: [
        {
          id: "pp-1-1",
          nombre: "Problem Statement Canvas",
          descripcion: "Define claramente el problema que estás resolviendo",
          estado: "completado" as const,
          componentes: [
            { tipo: "leccion", nombre: "¿Qué es un problema validable?", duracion: "15 min", completado: true },
            { tipo: "cuaderno", nombre: "Canvas de Problema", duracion: "30 min", completado: true },
          ],
        },
        {
          id: "pp-1-2",
          nombre: "Customer Discovery Interviews",
          descripcion: "Realiza entrevistas para validar tus hipótesis",
          estado: "en_progreso" as const,
          componentes: [
            { tipo: "leccion", nombre: "Técnicas de entrevista", duracion: "20 min", completado: true },
            { tipo: "simulacion", nombre: "Practica tu pitch", duracion: "25 min", completado: false },
            { tipo: "cuaderno", nombre: "Síntesis de entrevistas", duracion: "40 min", completado: false },
          ],
        },
        {
          id: "pp-1-3",
          nombre: "Problem-Solution Fit",
          descripcion: "Valida que tu solución resuelve el problema identificado",
          estado: "bloqueado" as const,
          componentes: [
            { tipo: "leccion", nombre: "Criterios de validación", duracion: "15 min", completado: false },
            { tipo: "cuaderno", nombre: "Matriz de validación", duracion: "35 min", completado: false },
          ],
        },
      ],
    },
    {
      id: "fase-2",
      nombre: "Prototipado y Testeo",
      descripcion: "Construye y prueba tu MVP con usuarios reales",
      orden: 2,
      estado: "bloqueado" as const,
      proofPoints: [
        {
          id: "pp-2-1",
          nombre: "MVP Definition",
          descripcion: "Define tu producto mínimo viable",
          estado: "bloqueado" as const,
          componentes: [
            { tipo: "leccion", nombre: "Principios de MVP", duracion: "20 min", completado: false },
            { tipo: "cuaderno", nombre: "Canvas de MVP", duracion: "45 min", completado: false },
          ],
        },
      ],
    },
  ]

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "completado":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "en_progreso":
        return <Circle className="h-5 w-5 text-cyan-600 fill-cyan-600" />
      case "bloqueado":
        return <Lock className="h-5 w-5 text-muted-foreground" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getComponenteIcon = (tipo: string) => {
    switch (tipo) {
      case "leccion":
        return <BookOpen className="h-4 w-4" />
      case "cuaderno":
        return <FileText className="h-4 w-4" />
      case "simulacion":
        return <MessageSquare className="h-4 w-4" />
      case "herramienta":
        return <Wrench className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const progresoGeneral = 35 // Mock progress

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <Breadcrumbs />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/programas/${programId}`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver
                    </Link>
                  </Button>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{program.nombre}</h1>
                <p className="text-muted-foreground">{program.descripcion}</p>
              </div>
              <Badge variant="outline" className="text-sm">
                Vista Previa del Estudiante
              </Badge>
            </div>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tu Progreso</CardTitle>
                    <CardDescription>Has completado {progresoGeneral}% del programa</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-600">{progresoGeneral}%</div>
                    <div className="text-sm text-muted-foreground">3 de 8 proof points</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progresoGeneral} className="h-2" />
              </CardContent>
            </Card>

            {/* Fases y Proof Points */}
            <div className="space-y-6">
              {fases.map((fase, faseIndex) => (
                <Card key={fase.id} className={fase.estado === "bloqueado" ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{getEstadoIcon(fase.estado)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Fase {fase.orden}
                          </Badge>
                          {fase.estado === "completado" && (
                            <Badge variant="default" className="text-xs bg-emerald-600">
                              Completada
                            </Badge>
                          )}
                          {fase.estado === "bloqueado" && (
                            <Badge variant="secondary" className="text-xs">
                              Bloqueada
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{fase.nombre}</CardTitle>
                        <CardDescription>{fase.descripcion}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fase.proofPoints.map((pp, ppIndex) => (
                        <div
                          key={pp.id}
                          className={`border rounded-lg p-4 ${pp.estado === "bloqueado" ? "bg-muted/30" : "bg-card"}`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 mt-0.5">{getEstadoIcon(pp.estado)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-semibold">{pp.nombre}</h4>
                                {pp.estado === "en_progreso" && (
                                  <Badge variant="default" className="text-xs bg-cyan-600">
                                    En Progreso
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{pp.descripcion}</p>
                            </div>
                          </div>

                          {/* Componentes */}
                          <div className="ml-8 space-y-2">
                            {pp.componentes.map((comp, compIndex) => (
                              <div
                                key={compIndex}
                                className={`flex items-center justify-between p-3 rounded-md border ${
                                  comp.completado
                                    ? "bg-emerald-50 border-emerald-200"
                                    : pp.estado === "bloqueado"
                                      ? "bg-muted/50"
                                      : "bg-background hover:bg-accent/50 cursor-pointer"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {comp.completado ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : pp.estado === "bloqueado" ? (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {getComponenteIcon(comp.tipo)}
                                  <div>
                                    <div className="font-medium text-sm">{comp.nombre}</div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {comp.duracion}
                                    </div>
                                  </div>
                                </div>
                                {!comp.completado && pp.estado !== "bloqueado" && (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
