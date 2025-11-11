"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { cohortsApi, programsApi } from "@/services/api"
import type { CohortResponse, ProgramResponse } from "@/types/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users, Calendar, Layers } from "lucide-react"

const DEFAULT_INSTRUCTOR_ID = "user:instructor_demo"
const DEFAULT_STUDENT_ID = "estudiante:demo"

function formatDate(value?: string) {
  if (!value) return "Sin definir"
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function CohortsPage() {
  const { sidebarCollapsed } = useUIStore()
  const { data: cohorts, mutate, isLoading } = useSWR<CohortResponse[]>(
    "cohortes",
    cohortsApi.list
  )
  const { data: programs } = useSWR<ProgramResponse[]>("programs", programsApi.getAll)
  const { toast } = useToast()

  const [formState, setFormState] = useState({
    nombre: "",
    programaId: "",
    descripcion: "",
    fechaInicio: new Date().toISOString().slice(0, 16),
  })
  const [creating, setCreating] = useState(false)
  const [enrollmentInputs, setEnrollmentInputs] = useState<Record<string, string>>({})
  const [enrolling, setEnrolling] = useState<Record<string, boolean>>({})

  const stats = useMemo(() => {
    const cohortList = cohorts ?? []
    return {
      total: cohortList.length,
      active: cohortList.filter((c) => c.estado === "activo").length,
      students: cohortList.reduce((acc, c) => acc + c.totalEstudiantes, 0),
    }
  }, [cohorts])

  const handleCreateCohort = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.programaId || !formState.nombre) {
      toast({
        title: "Faltan datos",
        description: "Selecciona un programa y asigna un nombre a la cohorte.",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      await cohortsApi.create({
        programaId: formState.programaId,
        nombre: formState.nombre,
        descripcion: formState.descripcion,
        fechaInicio: new Date(formState.fechaInicio).toISOString(),
        instructorId: DEFAULT_INSTRUCTOR_ID,
        autoActivate: true,
      })
      toast({
        title: "Cohorte creada",
        description: `${formState.nombre} ya puede recibir estudiantes.`,
      })
      setFormState((prev) => ({
        ...prev,
        nombre: "",
        descripcion: "",
      }))
      mutate()
    } catch (error: any) {
      toast({
        title: "Error al crear cohorte",
        description: error?.message ?? "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEnroll = async (cohortId: string) => {
    const estudianteId = enrollmentInputs[cohortId]?.trim() || DEFAULT_STUDENT_ID
    setEnrolling((prev) => ({ ...prev, [cohortId]: true }))
    try {
      await cohortsApi.enrollStudent(cohortId, { estudianteId })
      toast({
        title: "Estudiante asignado",
        description: `Se añadió ${estudianteId} a la cohorte.`,
      })
      setEnrollmentInputs((prev) => ({ ...prev, [cohortId]: "" }))
      mutate()
    } catch (error: any) {
      toast({
        title: "No se pudo asignar",
        description: error?.message ?? "Verifica el ID del estudiante.",
        variant: "destructive",
      })
    } finally {
      setEnrolling((prev) => ({ ...prev, [cohortId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Sidebar />
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarCollapsed ? "ml-[70px]" : "ml-[280px]"
        )}
      >
        <div className="p-6 space-y-6">
          <Breadcrumbs />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Cohortes</h1>
              <p className="text-muted-foreground">
                Publica programas y asigna estudiantes desde un solo lugar.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              stat={{
                metrica: stats.total.toString(),
                label: "Cohortes creadas",
                icono: "BookOpen",
              }}
            />
            <StatsCard
              stat={{
                metrica: stats.active.toString(),
                label: "Activas",
                icono: "Calendar",
              }}
            />
            <StatsCard
              stat={{
                metrica: stats.students.toString(),
                label: "Estudiantes asignados",
                icono: "Users",
              }}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
            <Card>
              <CardHeader>
                <CardTitle>Crear nueva cohorte</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateCohort}>
                  <div className="space-y-2">
                    <Label>Programa publicado</Label>
                    <select
                      value={formState.programaId}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          programaId: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Selecciona programa</option>
                      {(programs ?? [])
                        .filter((p) => p.estado === "publicado")
                        .map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre de la cohorte</Label>
                    <Input
                      value={formState.nombre}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          nombre: event.target.value,
                        }))
                      }
                      placeholder="Cohorte Primavera 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de inicio</Label>
                    <Input
                      type="datetime-local"
                      value={formState.fechaInicio}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          fechaInicio: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={formState.descripcion}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          descripcion: event.target.value,
                        }))
                      }
                      placeholder="Notas y contexto para los estudiantes"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear cohorte
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {isLoading && (
                <Card>
                  <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando cohortes...
                  </CardContent>
                </Card>
              )}

              {!isLoading && (cohorts?.length ?? 0) === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aún no hay cohortes. Crea la primera desde el panel izquierdo.
                  </CardContent>
                </Card>
              )}

              {cohorts?.map((cohort) => (
                <Card key={cohort.id} className="border border-muted">
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">{cohort.nombre}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {cohort.programa.nombre} • Inicio {formatDate(cohort.fechaInicio)}
                      </p>
                    </div>
                    <Badge variant={cohort.estado === "activo" ? "default" : "secondary"}>
                      {cohort.estado.toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Programa</div>
                        <div className="font-medium">{cohort.programa.nombre}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Estudiantes</div>
                        <div className="font-medium">{cohort.totalEstudiantes}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Fin estimado</div>
                        <div className="font-medium">{formatDate(cohort.fechaFinEstimada)}</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="mb-2 text-sm font-semibold">Asignar estudiante</h4>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Input
                          placeholder="estudiante:demo"
                          value={enrollmentInputs[cohort.id] ?? ""}
                          onChange={(event) =>
                            setEnrollmentInputs((prev) => ({
                              ...prev,
                              [cohort.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          onClick={() => handleEnroll(cohort.id)}
                          disabled={enrolling[cohort.id]}
                        >
                          {enrolling[cohort.id] && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Asignar
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Usa el ID del estudiante de SurrealDB (por defecto {DEFAULT_STUDENT_ID}).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
