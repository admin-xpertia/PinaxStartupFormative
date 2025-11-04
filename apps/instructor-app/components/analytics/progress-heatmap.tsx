"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid3x3, List, Search, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Student, ComponentStatus } from "@/types/analytics"
import { useState } from "react"

interface ProgressHeatmapProps {
  students: Student[]
  componentes: Array<{ id: string; nombre: string; tipo: string }>
}

export function ProgressHeatmap({ students, componentes }: ProgressHeatmapProps) {
  const [vista, setVista] = useState<"heatmap" | "lista">("heatmap")
  const [busqueda, setBusqueda] = useState("")

  const getStatusColor = (status: ComponentStatus) => {
    switch (status) {
      case "completado":
        return "bg-emerald-100 border-emerald-500 text-emerald-700"
      case "en_progreso":
        return "bg-amber-100 border-amber-400 text-amber-700"
      case "con_dificultad":
        return "bg-rose-100 border-rose-500 text-rose-700"
      default:
        return "bg-slate-100 border-slate-300 text-slate-400"
    }
  }

  const getStatusIcon = (status: ComponentStatus) => {
    switch (status) {
      case "completado":
        return <CheckCircle className="h-4 w-4" />
      case "en_progreso":
        return <Clock className="h-4 w-4" />
      case "con_dificultad":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return "—"
    }
  }

  const filteredStudents = students.filter((s) => s.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1">
            <Select defaultValue="todas">
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las fases</SelectItem>
                <SelectItem value="fase1">Fase 1: Proof Points Fundamentales</SelectItem>
                <SelectItem value="fase2">Fase 2: Validación de Mercado</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="todos">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estudiantes</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="riesgo">En riesgo</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estudiante..."
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant={vista === "heatmap" ? "secondary" : "ghost"} size="sm" onClick={() => setVista("heatmap")}>
              <Grid3x3 className="h-4 w-4 mr-2" />
              Mapa de Calor
            </Button>
            <Button variant={vista === "lista" ? "secondary" : "ghost"} size="sm" onClick={() => setVista("lista")}>
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
        </div>

        {/* Heatmap View */}
        {vista === "heatmap" && (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="flex border-b">
                <div className="w-[200px] sticky left-0 bg-card z-10 p-3 font-semibold text-sm">Estudiante</div>
                {componentes.slice(0, 6).map((comp) => (
                  <div key={comp.id} className="w-[80px] p-3 text-xs font-medium text-center border-l">
                    {comp.nombre}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {filteredStudents.map((student) => (
                <div key={student.id} className="flex border-b hover:bg-muted/50 transition-colors">
                  <div className="w-[200px] sticky left-0 bg-card z-10 p-3 border-r">
                    <div className="flex items-center gap-2">
                      <img
                        src={student.avatar || "/placeholder.svg"}
                        alt={student.nombre}
                        className="h-8 w-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{student.nombre}</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              student.estado === "activo" ? "bg-emerald-500" : "bg-rose-500",
                            )}
                          />
                          <span className="text-xs text-muted-foreground">{student.progreso_general}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {student.componentes.map((comp) => (
                    <div
                      key={comp.id}
                      className={cn(
                        "w-[80px] p-3 border-l flex items-center justify-center cursor-pointer hover:opacity-80",
                        getStatusColor(comp.estado),
                      )}
                      title={`${comp.estado} ${comp.score ? `- Score: ${comp.score}` : ""}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {getStatusIcon(comp.estado)}
                        {comp.score && <span className="text-xs font-medium">{comp.score}</span>}
                        {comp.progreso && <span className="text-xs">{comp.progreso}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista View */}
        {vista === "lista" && (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar || "/placeholder.svg"}
                      alt={student.nombre}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{student.nombre}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{student.progreso_general}%</p>
                      <p className="text-xs text-muted-foreground">Progreso</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">
                        {student.componentes_completados}/{student.componentes_totales}
                      </p>
                      <p className="text-xs text-muted-foreground">Completados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{student.score_promedio}</p>
                      <p className="text-xs text-muted-foreground">Score Promedio</p>
                    </div>
                    <Badge variant={student.estado === "activo" ? "default" : "destructive"}>{student.estado}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
