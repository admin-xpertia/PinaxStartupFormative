"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, BarChart3, Settings, Users, MessageSquare, Calendar } from "lucide-react"
import { StudentManagementTable } from "./student-management-table"
import { CommunicationHistory } from "./communication-history"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"

interface CohorteManagementViewProps {
  cohorteId: string
}

export function CohorteManagementView({ cohorteId }: CohorteManagementViewProps) {
  const {
    data: cohorte,
    error: cohorteError,
    isLoading: loadingCohorte,
    mutate: refreshCohorte,
  } = useSWR(cohorteId ? `/api/v1/cohortes/${cohorteId}` : null, fetcher)
  const {
    data: students,
    error: studentsError,
    isLoading: loadingStudents,
    mutate: refreshStudents,
  } = useSWR(cohorteId ? `/api/v1/cohortes/${cohorteId}/estudiantes` : null, fetcher)

  const [activeTab, setActiveTab] = useState("estudiantes")

  if (loadingCohorte) {
    return <LoadingState text="Cargando cohorte..." />
  }

  if (cohorteError) {
    return (
      <ErrorState
        message={cohorteError.message || "Error al cargar la cohorte"}
        retry={() => refreshCohorte()}
      />
    )
  }

  if (!cohorte) {
    return (
      <EmptyState
        icon={Users}
        title="Cohorte no encontrada"
        description="Verifica que la cohorte exista o crea una nueva."
      />
    )
  }

  const studentList = Array.isArray(students) ? students : []

  const getStatusBadge = () => {
    switch (cohorte.estado) {
      case "activa":
        return <Badge className="bg-emerald-100 text-emerald-700">Activa</Badge>
      case "proxima":
        return <Badge className="bg-blue-100 text-blue-700">Próxima</Badge>
      case "finalizada":
        return <Badge className="bg-slate-100 text-slate-700">Finalizada</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="hover:text-primary cursor-pointer">Cohortes</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">{cohorte.nombre}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">Gestión</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{cohorte.nombre}</h1>
            {getStatusBadge()}
            <Badge variant="outline">{cohorte.programa.nombre}</Badge>
          </div>
          {cohorte.descripcion && <p className="text-slate-500">{cohorte.descripcion}</p>}
        </div>
        <div className="flex gap-2">
          <Button className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Ver Dashboard Analytics
          </Button>
          <Button variant="secondary" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="estudiantes" className="gap-2">
            <Users className="h-4 w-4" />
            Estudiantes
            <Badge variant="secondary">{cohorte.metricas.total_estudiantes}</Badge>
          </TabsTrigger>
          <TabsTrigger value="comunicaciones" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Comunicaciones
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estudiantes" className="mt-6">
          {loadingStudents ? (
            <LoadingState text="Cargando estudiantes..." size="sm" className="py-6" />
          ) : studentsError ? (
            <ErrorState
              message={studentsError.message || "Error al cargar estudiantes"}
              retry={() => refreshStudents()}
            />
          ) : (
            <StudentManagementTable students={studentList} cohorteId={cohorteId} />
          )}
        </TabsContent>

        <TabsContent value="comunicaciones" className="mt-6">
          <CommunicationHistory cohorteId={cohorteId} />
        </TabsContent>

        <TabsContent value="calendario" className="mt-6">
          <div className="border rounded-lg p-8 text-center">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calendario de Cohorte</h3>
            <p className="text-slate-500">Vista de calendario con eventos y deadlines</p>
          </div>
        </TabsContent>

        <TabsContent value="configuracion" className="mt-6">
          <div className="border rounded-lg p-8 text-center">
            <Settings className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configuración de Cohorte</h3>
            <p className="text-slate-500">Ajustes y configuración de la cohorte</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
