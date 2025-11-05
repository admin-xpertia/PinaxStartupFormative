"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StudentDetailView } from "@/components/fase4/student-detail-view"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import type { EstudianteDetallado } from "@/types/student"
import {
  UserPlus,
  Download,
  Search,
  Eye,
  Mail,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
} from "lucide-react"
import type { CohorteStudent, StudentStatus } from "@/types/cohort"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StudentManagementTableProps {
  students: CohorteStudent[]
  cohorteId: string
}

export function StudentManagementTable({ students, cohorteId }: StudentManagementTableProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<StudentStatus | "todos">("todos")
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const { data: selectedStudent, isLoading: loadingStudentDetail } = useSWR<EstudianteDetallado>(
    selectedStudentId ? `/api/v1/cohortes/${cohorteId}/estudiantes/${selectedStudentId}` : null,
    fetcher
  )

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "todos" || student.estado === filterStatus
    return matchesSearch && matchesStatus
  })

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id))
    }
  }

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case "activo":
        return <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
      case "en_riesgo":
        return <Badge className="bg-amber-100 text-amber-700">En Riesgo</Badge>
      case "inactivo":
        return <Badge className="bg-rose-100 text-rose-700">Inactivo</Badge>
      case "completado":
        return <Badge className="bg-blue-100 text-blue-700">Completado</Badge>
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? "s" : ""}`
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`
    return "hace unos minutos"
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invitar Estudiantes
        </Button>
        <Button variant="secondary" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Lista
        </Button>

        <div className="flex-1" />

        {/* Filters */}
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="en_riesgo">En Riesgo</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
            <SelectItem value="completado">Completados</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        <table className="w-full">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="text-left p-4 w-12">
                <Checkbox checked={selectedStudents.length === filteredStudents.length} onCheckedChange={toggleAll} />
              </th>
              <th className="text-left p-4 font-medium text-sm">Estudiante</th>
              <th className="text-left p-4 font-medium text-sm">Estado</th>
              <th className="text-left p-4 font-medium text-sm">Progreso</th>
              <th className="text-left p-4 font-medium text-sm">Score Promedio</th>
              <th className="text-left p-4 font-medium text-sm">Última Actividad</th>
              <th className="text-left p-4 font-medium text-sm">Alertas</th>
              <th className="text-left p-4 font-medium text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b hover:bg-slate-50">
                <td className="p-4">
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {student.nombre
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{student.nombre}</div>
                      <div className="text-sm text-slate-500">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(student.estado)}
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        student.estado === "activo" && "bg-emerald-500",
                        student.estado === "en_riesgo" && "bg-amber-500",
                        student.estado === "inactivo" && "bg-rose-500",
                      )}
                    />
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-[120px]">
                        <div className="h-full bg-primary" style={{ width: `${student.progreso_general}%` }} />
                      </div>
                      <span className="text-sm font-medium">{student.progreso_general}%</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {student.componentes_completados} de {student.componentes_totales}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{student.score_promedio}/10</span>
                    {student.score_promedio >= 8 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : student.score_promedio >= 7 ? (
                      <Minus className="h-4 w-4 text-slate-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">{getTimeAgo(student.ultima_actividad)}</div>
                </td>
                <td className="p-4">
                  {student.alertas.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {student.alertas.map((alerta, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className={cn(
                            "text-xs",
                            alerta.severidad === "high" && "border-rose-500 text-rose-700",
                            alerta.severidad === "medium" && "border-amber-500 text-amber-700",
                            alerta.severidad === "low" && "border-blue-500 text-blue-700",
                          )}
                        >
                          {alerta.tipo === "inactividad" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {alerta.mensaje}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {student.extensiones_activas && student.extensiones_activas.length > 0 && (
                    <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                      <Info className="h-3 w-3 mr-1" />
                      Extensión activa
                    </Badge>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Ver detalles"
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Enviar mensaje">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Más acciones">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions Bar */}
      {selectedStudents.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="font-medium">{selectedStudents.length} estudiantes seleccionados</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Enviar Mensaje
            </Button>
            <Button variant="secondary" size="sm">
              Otorgar Extensión
            </Button>
            <Button variant="secondary" size="sm">
              Exportar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudents([])}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Sheet for student detail view */}
      <Sheet open={selectedStudentId !== null} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
        <SheetContent side="right" className="w-[800px] max-w-[90vw] p-0">
          {loadingStudentDetail ? (
            <div className="flex items-center justify-center h-full">
              <LoadingState text="Cargando detalles del estudiante..." />
            </div>
          ) : selectedStudent ? (
            <StudentDetailView
              student={selectedStudent}
              cohorteId={cohorteId}
              onClose={() => setSelectedStudentId(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
