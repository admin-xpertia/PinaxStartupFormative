"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mail,
  Calendar,
  MoreVertical,
  TrendingUp,
  Award,
  Activity,
  FileText,
  CheckCircle,
  Clock,
  Lock,
  ArrowRight,
  RefreshCw,
  BookOpen,
  FileEdit,
  MessageSquare,
  Wrench,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
} from "lucide-react"
import type { EstudianteDetallado } from "@/types/student"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface StudentDetailViewProps {
  student: EstudianteDetallado
  cohorteId: string
  onClose?: () => void
}

export function StudentDetailView({ student, cohorteId, onClose }: StudentDetailViewProps) {
  const [activeTab, setActiveTab] = useState("progreso")
  const [expandedScores, setExpandedScores] = useState<string[]>([])
  const [expandedFases, setExpandedFases] = useState<string[]>(["fase_2"])
  const [timelineFilter, setTimelineFilter] = useState("7")
  const [artefactoFilter, setArtefactoFilter] = useState("todos")

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
      case "en_riesgo":
        return <Badge className="bg-amber-100 text-amber-700">En Riesgo</Badge>
      case "inactivo":
        return <Badge className="bg-rose-100 text-rose-700">Inactivo</Badge>
      default:
        return null
    }
  }

  const getComponentIcon = (tipo: string) => {
    switch (tipo) {
      case "leccion":
        return <BookOpen className="h-4 w-4" />
      case "cuaderno":
        return <FileEdit className="h-4 w-4" />
      case "simulacion":
        return <MessageSquare className="h-4 w-4" />
      case "herramienta":
        return <Wrench className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getComponentColor = (tipo: string) => {
    switch (tipo) {
      case "leccion":
        return "text-blue-600 bg-blue-50"
      case "cuaderno":
        return "text-purple-600 bg-purple-50"
      case "simulacion":
        return "text-emerald-600 bg-emerald-50"
      case "herramienta":
        return "text-amber-600 bg-amber-50"
      default:
        return "text-slate-600 bg-slate-50"
    }
  }

  const toggleScore = (id: string) => {
    setExpandedScores((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleFase = (id: string) => {
    setExpandedFases((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const filteredArtefactos = student.artefactos.filter((art) => {
    if (artefactoFilter === "todos") return true
    return art.tipo === artefactoFilter
  })

  const getHeatmapIntensity = (minutos: number) => {
    if (minutos === 0) return "bg-slate-100"
    if (minutos < 30) return "bg-primary/20"
    if (minutos < 60) return "bg-primary/40"
    if (minutos < 90) return "bg-primary/60"
    return "bg-primary/80"
  }

  const heatmapData = Array.from({ length: 7 }, (_, dia) =>
    Array.from({ length: 24 }, (_, hora) => {
      const entry = student.patron_estudio.heatmap.find((h) => h.dia === dia && h.hora === hora)
      return entry?.minutos || 0
    }),
  )

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={student.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">
              {student.nombre
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{student.nombre}</h2>
                <p className="text-slate-600">{student.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(student.estado)}
                  <Badge variant="outline">Cohorte Primavera 2024</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="gap-2">
                  <Mail className="h-4 w-4" />
                  Enviar Mensaje
                </Button>
                <Button variant="secondary" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Programar Reunión
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Otorgar Extensión</DropdownMenuItem>
                    <DropdownMenuItem>Desbloquear Componente</DropdownMenuItem>
                    <DropdownMenuItem>Ver Portafolio</DropdownMenuItem>
                    <DropdownMenuItem>Exportar Datos</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList className="bg-transparent">
            <TabsTrigger value="progreso" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Progreso
            </TabsTrigger>
            <TabsTrigger value="desempeno" className="gap-2">
              <Award className="h-4 w-4" />
              Desempeño
            </TabsTrigger>
            <TabsTrigger value="actividad" className="gap-2">
              <Activity className="h-4 w-4" />
              Actividad
            </TabsTrigger>
            <TabsTrigger value="artefactos" className="gap-2">
              <FileText className="h-4 w-4" />
              Artefactos
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Tab: Progreso */}
          <TabsContent value="progreso" className="mt-0 space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative h-24 w-24">
                      <svg className="transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="10"
                          strokeDasharray={`${student.progreso_general * 2.827} 282.7`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{student.progreso_general}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-center">Progreso General</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{student.componentes_completados}</div>
                    <p className="text-sm text-slate-600 mt-1">de {student.componentes_totales}</p>
                    <p className="text-sm font-medium mt-2">Componentes</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">{student.score_promedio}</div>
                    <p className="text-sm text-slate-600 mt-1">de 10</p>
                    <p className="text-sm font-medium mt-2">Score Promedio</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{student.tiempo_total_horas}</div>
                    <p className="text-sm text-slate-600 mt-1">horas</p>
                    <p className="text-sm font-medium mt-2">Tiempo Invertido</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Roadmap Personal */}
            <Card>
              <CardHeader>
                <CardTitle>Roadmap Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.progreso_detallado.fases.map((fase) => (
                  <Collapsible
                    key={fase.id}
                    open={expandedFases.includes(fase.id)}
                    onOpenChange={() => toggleFase(fase.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger className="w-full p-4 flex items-center gap-4 hover:bg-slate-50">
                        {expandedFases.includes(fase.id) ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">Fase {fase.numero}</span>
                            <span className="text-slate-600">{fase.nombre}</span>
                            <Badge
                              className={cn(
                                fase.estado === "completado" && "bg-emerald-100 text-emerald-700",
                                fase.estado === "en_progreso" && "bg-blue-100 text-blue-700",
                                fase.estado === "bloqueado" && "bg-slate-100 text-slate-700",
                              )}
                            >
                              {fase.estado === "completado" && "Completado"}
                              {fase.estado === "en_progreso" && "En Progreso"}
                              {fase.estado === "bloqueado" && "Bloqueado"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={fase.progreso} className="flex-1 max-w-xs" />
                            <span className="text-sm font-medium">{fase.progreso}%</span>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="p-4 pt-0 space-y-3 border-t">
                          {fase.proof_points.map((pp) => (
                            <div key={pp.id} className="pl-9 space-y-2">
                              <div className="flex items-center gap-3">
                                {pp.estado === "completado" && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                                {pp.estado === "en_progreso" && <Clock className="h-5 w-5 text-blue-500" />}
                                {pp.estado === "no_iniciado" && <Lock className="h-5 w-5 text-slate-400" />}
                                <span className="font-medium">{pp.nombre}</span>
                                {pp.score && (
                                  <Badge variant="outline" className="text-emerald-700">
                                    Score: {pp.score}
                                  </Badge>
                                )}
                                {pp.fecha_completacion && (
                                  <span className="text-sm text-slate-500">{pp.fecha_completacion}</span>
                                )}
                              </div>

                              {pp.niveles.map((nivel) => (
                                <div key={nivel.id} className="pl-8 space-y-1">
                                  <p className="text-sm font-medium text-slate-600">{nivel.nombre}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {nivel.componentes.map((comp) => (
                                      <div
                                        key={comp.id}
                                        className={cn(
                                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm",
                                          getComponentColor(comp.tipo),
                                        )}
                                      >
                                        {getComponentIcon(comp.tipo)}
                                        <span>{comp.nombre}</span>
                                        {comp.estado === "completado" && (
                                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                                        )}
                                        {comp.score && (
                                          <Badge variant="outline" className="text-xs">
                                            {comp.score}
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>

            {/* Próximos Pasos */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Pasos Sugeridos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.proximos_pasos.map((paso, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
                    {paso.tipo === "accion_recomendada" ? (
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
                    ) : (
                      <RefreshCw className="h-5 w-5 text-amber-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{paso.componente}</p>
                      <p className="text-sm text-slate-600">{paso.razon}</p>
                      <p className="text-xs text-slate-500 mt-1">{paso.estimado}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Desempeño */}
          <TabsContent value="desempeno" className="mt-0 space-y-6">
            {/* Scores Detallados */}
            <Card>
              <CardHeader>
                <CardTitle>Scores Detallados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {student.scores_detallados.map((score, index) => (
                    <Collapsible
                      key={index}
                      open={expandedScores.includes(score.componente)}
                      onOpenChange={() => toggleScore(score.componente)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full p-4 flex items-center gap-4 hover:bg-slate-50">
                          {expandedScores.includes(score.componente) ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                          <div className="flex-1 grid grid-cols-6 gap-4 text-left">
                            <div className="col-span-2">
                              <p className="font-medium">{score.componente}</p>
                              <p className="text-sm text-slate-500">{score.tipo}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-primary">{score.score}</p>
                            </div>
                            <div className="text-center">
                              <Badge variant="outline">{score.percentil}</Badge>
                            </div>
                            <div className="text-sm text-slate-600">{score.fecha}</div>
                            <div className="text-sm text-slate-600">{score.intentos} intento(s)</div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="p-4 pt-0 border-t space-y-3">
                            {score.feedback && (
                              <div>
                                <p className="text-sm font-medium text-slate-700">Feedback:</p>
                                <p className="text-sm text-slate-600">{score.feedback}</p>
                              </div>
                            )}
                            {score.areas_fuertes && score.areas_fuertes.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-emerald-700">Áreas Fuertes:</p>
                                <ul className="list-disc list-inside text-sm text-slate-600">
                                  {score.areas_fuertes.map((area, i) => (
                                    <li key={i}>{area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {score.areas_mejora && score.areas_mejora.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-amber-700">Áreas de Mejora:</p>
                                <ul className="list-disc list-inside text-sm text-slate-600">
                                  {score.areas_mejora.map((area, i) => (
                                    <li key={i}>{area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fortalezas y Debilidades */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-emerald-700">Fortalezas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {student.fortalezas.map((fortaleza, index) => (
                    <div key={index} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="font-medium text-emerald-900">{fortaleza.texto}</p>
                      <p className="text-sm text-emerald-700 mt-1">{fortaleza.evidencia}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-700">Áreas de Mejora</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {student.debilidades.map((debilidad, index) => (
                    <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-900">{debilidad.texto}</p>
                      <p className="text-sm text-amber-700 mt-1">{debilidad.evidencia}</p>
                      {debilidad.accion_sugerida && (
                        <Button variant="link" className="h-auto p-0 mt-2 text-amber-700">
                          {debilidad.accion_sugerida} →
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Actividad */}
          <TabsContent value="actividad" className="mt-0 space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Timeline de Actividad</CardTitle>
                  <Select value={timelineFilter} onValueChange={setTimelineFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 días</SelectItem>
                      <SelectItem value="30">Últimos 30 días</SelectItem>
                      <SelectItem value="all">Todo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.timeline_actividad.map((evento, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            evento.tipo === "completado" && "bg-emerald-100 text-emerald-600",
                            evento.tipo === "guardado" && "bg-blue-100 text-blue-600",
                            evento.tipo === "iniciado" && "bg-slate-100 text-slate-600",
                          )}
                        >
                          {evento.tipo === "completado" && <CheckCircle className="h-5 w-5" />}
                          {evento.tipo === "guardado" && <FileEdit className="h-5 w-5" />}
                          {evento.tipo === "iniciado" && <Clock className="h-5 w-5" />}
                        </div>
                        {index < student.timeline_actividad.length - 1 && (
                          <div className="w-0.5 h-full bg-slate-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{evento.descripcion}</p>
                            {evento.detalles && (
                              <div className="flex gap-4 mt-1 text-sm text-slate-600">
                                {evento.detalles.tiempo && <span>Tiempo: {evento.detalles.tiempo}</span>}
                                {evento.detalles.score && <span>Score: {evento.detalles.score}</span>}
                                {evento.detalles.seccion && <span>{evento.detalles.seccion}</span>}
                                {evento.detalles.palabras && <span>~{evento.detalles.palabras} palabras</span>}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-slate-500">
                            {new Date(evento.timestamp).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Patrón de Estudio */}
            <Card>
              <CardHeader>
                <CardTitle>Patrón de Estudio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Heatmap */}
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div className="flex gap-1">
                      <div className="flex flex-col gap-1 text-xs text-slate-600 pt-6">
                        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((dia) => (
                          <div key={dia} className="h-4 flex items-center">
                            {dia}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-1 text-xs text-slate-600 mb-1">
                          {Array.from({ length: 24 }, (_, i) => (
                            <div key={i} className="w-4 text-center">
                              {i % 3 === 0 ? i : ""}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {heatmapData.map((row, dia) => (
                            <div key={dia} className="flex gap-1">
                              {row.map((minutos, hora) => (
                                <div
                                  key={hora}
                                  className={cn("h-4 w-4 rounded-sm", getHeatmapIntensity(minutos))}
                                  title={`${["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][dia]} ${hora}:00 - ${minutos} min`}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-2">
                  <p className="font-medium text-sm">Insights:</p>
                  <ul className="space-y-1">
                    {student.patron_estudio.insights.map((insight, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Artefactos */}
          <TabsContent value="artefactos" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Artefactos Generados</CardTitle>
                  <Select value={artefactoFilter} onValueChange={setArtefactoFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="reporte">Reportes</SelectItem>
                      <SelectItem value="cuaderno">Cuadernos</SelectItem>
                      <SelectItem value="reflexion">Reflexiones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {filteredArtefactos.map((artefacto) => (
                    <Card key={artefacto.id} className="overflow-hidden">
                      {artefacto.thumbnail && (
                        <div className="aspect-video bg-slate-100">
                          <img
                            src={artefacto.thumbnail || "/placeholder.svg"}
                            alt={artefacto.titulo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium line-clamp-2">{artefacto.titulo}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {artefacto.tipo}
                              </Badge>
                              <span className="text-xs text-slate-500">{artefacto.fecha}</span>
                            </div>
                          </div>
                          {artefacto.score && (
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span className="text-sm font-medium">Score: {artefacto.score}</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 gap-2 bg-transparent">
                              <Eye className="h-3 w-3" />
                              Ver
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
