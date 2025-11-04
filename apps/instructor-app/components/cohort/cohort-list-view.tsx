"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  Grid3x3,
  List,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  Activity,
  Calendar,
  BarChart3,
  Settings,
  MoreVertical,
  AlertTriangle,
  Info,
} from "lucide-react"
import { mockCohortes } from "@/lib/mock-cohort-data"
import type { Cohorte, CohorteStatus } from "@/types/cohort"
import { cn } from "@/lib/utils"
import { CohorteCreationWizard } from "@/components/cohort/cohort-creation-wizard"

type ViewMode = "cards" | "table"

export function CohorteListView() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("cards")
  const [filterStatus, setFilterStatus] = useState<CohorteStatus | "todas">("todas")
  const [searchQuery, setSearchQuery] = useState("")
  const [showWizard, setShowWizard] = useState(false)

  const filteredCohortes = mockCohortes.filter((cohorte) => {
    const matchesStatus = filterStatus === "todas" || cohorte.estado === filterStatus
    const matchesSearch =
      searchQuery === "" ||
      cohorte.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cohorte.programa.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const statusCounts = {
    todas: mockCohortes.length,
    activa: mockCohortes.filter((c) => c.estado === "activa").length,
    proxima: mockCohortes.filter((c) => c.estado === "proxima").length,
    finalizada: mockCohortes.filter((c) => c.estado === "finalizada").length,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Cohortes</h1>
          <p className="text-slate-500 mt-1">Gestiona tus cohortes de estudiantes</p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Nueva Cohorte
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "todas" ? "secondary" : "ghost"}
              onClick={() => setFilterStatus("todas")}
              className="gap-2"
            >
              Todas
              <Badge variant="secondary">{statusCounts.todas}</Badge>
            </Button>
            <Button
              variant={filterStatus === "activa" ? "secondary" : "ghost"}
              onClick={() => setFilterStatus("activa")}
              className="gap-2"
            >
              Activas
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {statusCounts.activa}
              </Badge>
            </Button>
            <Button
              variant={filterStatus === "proxima" ? "secondary" : "ghost"}
              onClick={() => setFilterStatus("proxima")}
              className="gap-2"
            >
              Próximas
              <Badge variant="secondary">{statusCounts.proxima}</Badge>
            </Button>
            <Button
              variant={filterStatus === "finalizada" ? "secondary" : "ghost"}
              onClick={() => setFilterStatus("finalizada")}
              className="gap-2"
            >
              Finalizadas
              <Badge variant="secondary">{statusCounts.finalizada}</Badge>
            </Button>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar cohorte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "cards" ? (
        <CohorteCardsView cohortes={filteredCohortes} />
      ) : (
        <CohorteTableView cohortes={filteredCohortes} />
      )}

      {/* Empty State */}
      {filteredCohortes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron cohortes</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery ? "Intenta con otros términos de búsqueda" : "Crea tu primera cohorte para comenzar"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowWizard(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Nueva Cohorte
            </Button>
          )}
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <CohorteCreationWizard
          onComplete={async (cohorte) => {
            console.log("Cohorte creada:", cohorte)
            setShowWizard(false)
            router.push(`/cohortes/${cohorte.id}`)
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}

function CohorteCardsView({ cohortes }: { cohortes: Cohorte[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cohortes.map((cohorte) => (
        <CohorteCard key={cohorte.id} cohorte={cohorte} />
      ))}
    </div>
  )
}

function CohorteCard({ cohorte }: { cohorte: Cohorte }) {
  const getStatusBadge = () => {
    switch (cohorte.estado) {
      case "activa":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 gap-1">
            <Activity className="h-3 w-3" />
            Activa
          </Badge>
        )
      case "proxima":
        return (
          <Badge className="bg-blue-100 text-blue-700 gap-1">
            <Calendar className="h-3 w-3" />
            Próxima
          </Badge>
        )
      case "finalizada":
        return (
          <Badge className="bg-slate-100 text-slate-700 gap-1">
            <CheckCircle className="h-3 w-3" />
            Finalizada
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="border rounded-lg bg-card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg">{cohorte.nombre}</h3>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <BookOpen className="h-4 w-4" />
          <span>{cohorte.programa.nombre}</span>
          <Badge variant="outline" className="text-xs">
            v{cohorte.programa.version}
          </Badge>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-6 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <div>
              <div className="text-sm text-slate-500">Estudiantes</div>
              <div className="font-semibold">{cohorte.metricas.total_estudiantes}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <div>
              <div className="text-sm text-slate-500">Progreso</div>
              <div className="font-semibold">{cohorte.metricas.progreso_promedio}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-slate-400" />
            <div>
              <div className="text-sm text-slate-500">Score</div>
              <div className="font-semibold">{cohorte.metricas.score_promedio}/10</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-slate-400" />
            <div>
              <div className="text-sm text-slate-500">Completación</div>
              <div className="font-semibold">{cohorte.metricas.tasa_completacion}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="p-6 border-b">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Inicio:</span>
            <span className="font-medium">{formatDate(cohorte.fecha_inicio)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Fin estimada:</span>
            <span className="font-medium">{formatDate(cohorte.fecha_fin_estimada)}</span>
          </div>
          {cohorte.metricas.dias_restantes && (
            <div className="flex justify-between">
              <span className="text-slate-500">Días restantes:</span>
              <span className="font-medium text-primary">{cohorte.metricas.dias_restantes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {cohorte.alertas && cohorte.alertas.length > 0 && (
        <div className="p-6 border-b bg-slate-50">
          <div className="flex flex-col gap-2">
            {cohorte.alertas.map((alerta, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {alerta.tipo === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <Info className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-slate-700">{alerta.texto}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center gap-2">
        <Button className="flex-1 gap-2" onClick={() => console.log("Ver dashboard", cohorte.id)}>
          <BarChart3 className="h-4 w-4" />
          Ver Dashboard
        </Button>
        <Button variant="secondary" className="gap-2" onClick={() => console.log("Gestionar", cohorte.id)}>
          <Settings className="h-4 w-4" />
          Gestionar
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function CohorteTableView({ cohortes }: { cohortes: Cohorte[] }) {
  return (
    <div className="border rounded-lg bg-card">
      <table className="w-full">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="text-left p-4 font-medium text-sm">Cohorte</th>
            <th className="text-left p-4 font-medium text-sm">Estado</th>
            <th className="text-left p-4 font-medium text-sm">Estudiantes</th>
            <th className="text-left p-4 font-medium text-sm">Progreso</th>
            <th className="text-left p-4 font-medium text-sm">Fecha Inicio</th>
            <th className="text-left p-4 font-medium text-sm">Alertas</th>
            <th className="text-left p-4 font-medium text-sm">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cohortes.map((cohorte) => (
            <tr key={cohorte.id} className="border-b hover:bg-slate-50">
              <td className="p-4">
                <div>
                  <div className="font-medium">{cohorte.nombre}</div>
                  <div className="text-sm text-slate-500">{cohorte.programa.nombre}</div>
                </div>
              </td>
              <td className="p-4">
                {cohorte.estado === "activa" && <Badge className="bg-emerald-100 text-emerald-700">Activa</Badge>}
                {cohorte.estado === "proxima" && <Badge className="bg-blue-100 text-blue-700">Próxima</Badge>}
                {cohorte.estado === "finalizada" && <Badge className="bg-slate-100 text-slate-700">Finalizada</Badge>}
              </td>
              <td className="p-4">{cohorte.metricas.total_estudiantes}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${cohorte.metricas.progreso_promedio}%` }} />
                  </div>
                  <span className="text-sm font-medium">{cohorte.metricas.progreso_promedio}%</span>
                </div>
              </td>
              <td className="p-4 text-sm">{new Date(cohorte.fecha_inicio).toLocaleDateString("es-ES")}</td>
              <td className="p-4">
                {cohorte.alertas && cohorte.alertas.length > 0 && (
                  <div className="flex gap-1">
                    {cohorte.alertas.map((alerta, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={cn(
                          alerta.tipo === "warning" && "border-amber-500 text-amber-700",
                          alerta.tipo === "info" && "border-blue-500 text-blue-700",
                        )}
                      >
                        {alerta.count}
                      </Badge>
                    ))}
                  </div>
                )}
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
