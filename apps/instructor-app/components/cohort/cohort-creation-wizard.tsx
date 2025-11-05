"use client"

import { useState } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  BookOpen,
  Settings,
  Users,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  UserPlus,
  Copy,
  Trash2,
  Download,
} from "lucide-react"
import type { Cohorte, ProgramVersion } from "@/types/cohort"
import { cn } from "@/lib/utils"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"

// Schema de validación
const cohorteSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
  programa_id: z.string().min(1, "Debes seleccionar un programa"),
  programa_version_id: z.string().min(1, "Debes seleccionar una versión"),
  fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fecha_fin_estimada: z.string().min(1, "La fecha de fin es requerida"),
  modo_acceso: z.enum(["abierto", "secuencial", "programado"]),
  permitir_saltar_niveles: z.boolean(),
  reintentos_ilimitados: z.boolean(),
  recordatorio_inactividad: z.boolean(),
  dias_inactividad: z.number().min(1).max(30),
  celebracion_completacion: z.boolean(),
})

type CohorteFormData = z.infer<typeof cohorteSchema>

interface EstudianteInvitado {
  email: string
  nombre: string
  telefono?: string
}

interface CohorteCreationWizardProps {
  onComplete: (cohorte: Cohorte) => Promise<void>
  onCancel: () => void
}

export function CohorteCreationWizard({ onComplete, onCancel }: CohorteCreationWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [estudiantes, setEstudiantes] = useState<EstudianteInvitado[]>([])
  const [activeTab, setActiveTab] = useState<"individual" | "csv" | "cohorte">("individual")
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CohorteFormData>({
    resolver: zodResolver(cohorteSchema),
    defaultValues: {
      modo_acceso: "secuencial",
      permitir_saltar_niveles: false,
      reintentos_ilimitados: true,
      recordatorio_inactividad: true,
      dias_inactividad: 7,
      celebracion_completacion: true,
    },
  })

  const programaId = watch("programa_id")
  const versionId = watch("programa_version_id")
  const fechaInicio = watch("fecha_inicio")

  const {
    data: programs,
    error: programsError,
    isLoading: loadingPrograms,
    mutate: refreshPrograms,
  } = useSWR("/api/v1/programas", fetcher)

  const {
    data: versions,
    error: versionsError,
    isLoading: loadingVersions,
    mutate: refreshVersions,
  } = useSWR(programaId ? `/api/v1/programas/${programaId}/versiones` : null, fetcher)

  const programList = Array.isArray(programs) ? programs : []
  const selectedProgram = programList.find((p: any) => p.id === programaId)
  const availableVersions = (Array.isArray(versions) ? versions : []) as ProgramVersion[]

  // Auto-calcular fecha fin cuando se selecciona fecha inicio
  const handleFechaInicioChange = (fecha: string) => {
    setValue("fecha_inicio", fecha)
    if (fecha && selectedProgram) {
      const duracionSemanas = Number.parseInt(selectedProgram.estadisticas.duracion) || 12
      const fechaFin = new Date(fecha)
      fechaFin.setDate(fechaFin.getDate() + duracionSemanas * 7)
      setValue("fecha_fin_estimada", fechaFin.toISOString().split("T")[0])
    }
  }

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleAddEstudiante = (estudiante: EstudianteInvitado) => {
    setEstudiantes([...estudiantes, estudiante])
  }

  const handleRemoveEstudiante = (index: number) => {
    setEstudiantes(estudiantes.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CohorteFormData) => {
    const programa = programList.find((p: any) => p.id === data.programa_id)

    const nuevaCohorte: Cohorte = {
      id: `coh_${Date.now()}`,
      nombre: data.nombre,
      descripcion: data.descripcion,
      programa: {
        id: data.programa_id,
        nombre: programa?.nombre || "",
        version: data.programa_version_id,
      },
      estado: "proxima",
      fecha_inicio: data.fecha_inicio,
      fecha_fin_estimada: data.fecha_fin_estimada,
      configuracion: {
        modo_acceso: data.modo_acceso,
        permitir_saltar_niveles: data.permitir_saltar_niveles,
        reintentos_ilimitados: data.reintentos_ilimitados,
        notificaciones: {
          recordatorio_inactividad: {
            activo: data.recordatorio_inactividad,
            dias: data.dias_inactividad,
          },
          recordatorio_deadline: true,
          celebracion_completacion: data.celebracion_completacion,
        },
      },
      metricas: {
        total_estudiantes: estudiantes.length,
        estudiantes_activos: 0,
        progreso_promedio: 0,
        score_promedio: 0,
        tasa_completacion: 0,
      },
    }

    await onComplete(nuevaCohorte)
  }

  const steps = [
    { number: 1, label: "Programa y Versión", icon: BookOpen },
    { number: 2, label: "Configuración", icon: Settings },
    { number: 3, label: "Estudiantes", icon: Users },
  ]

  return (
    <Dialog open={true} onOpenChange={() => setShowConfirmCancel(true)}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Crear Nueva Cohorte</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowConfirmCancel(true)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Stepper */}
        <div className="px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive && "border-primary bg-primary text-white",
                        isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                        !isActive && !isCompleted && "border-slate-300 bg-white text-slate-400",
                      )}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span
                      className={cn(
                        "text-sm mt-2 font-medium",
                        isActive && "text-primary",
                        !isActive && "text-slate-500",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-4 transition-colors",
                        isCompleted ? "bg-emerald-500" : "bg-slate-300",
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentStep === 1 && (
              <Step1ProgramaVersion
                register={register}
                errors={errors}
                programaId={programaId}
                versionId={versionId}
                setValue={setValue}
                selectedProgram={selectedProgram}
                availableVersions={availableVersions}
                programs={programList}
                loadingPrograms={loadingPrograms}
                programsError={programsError}
                onRetryPrograms={refreshPrograms}
                loadingVersions={loadingVersions}
                versionsError={versionsError}
                onRetryVersions={refreshVersions}
              />
            )}

            {currentStep === 2 && (
              <Step2Configuracion
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                fechaInicio={fechaInicio}
                handleFechaInicioChange={handleFechaInicioChange}
              />
            )}

            {currentStep === 3 && (
              <Step3Estudiantes
                estudiantes={estudiantes}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onAddEstudiante={handleAddEstudiante}
                onRemoveEstudiante={handleRemoveEstudiante}
              />
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setShowConfirmCancel(true)}>
            Cancelar
          </Button>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="secondary" onClick={handlePrevious} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2"
                disabled={(currentStep === 1 && (!programaId || !versionId)) || (currentStep === 2 && !fechaInicio)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" onClick={handleSubmit(onSubmit)} className="gap-2">
                Crear Cohorte e Invitar
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Confirm Cancel Dialog */}
        {showConfirmCancel && (
          <Dialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Cancelar creación de cohorte?</DialogTitle>
              </DialogHeader>
              <p className="text-slate-600">Se perderá todo el progreso. Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowConfirmCancel(false)}>
                  Continuar editando
                </Button>
                <Button variant="destructive" onClick={onCancel}>
                  Sí, cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Step 1: Programa y Versión
function Step1ProgramaVersion({
  register,
  errors,
  programaId,
  versionId,
  setValue,
  selectedProgram,
  availableVersions,
  programs,
  loadingPrograms,
  programsError,
  onRetryPrograms,
  loadingVersions,
  versionsError,
  onRetryVersions,
}: any) {
  if (loadingPrograms) {
    return <LoadingState text="Cargando programas..." />
  }

  if (programsError) {
    return (
      <ErrorState
        message={programsError.message || "Error al cargar programas"}
        retry={onRetryPrograms}
      />
    )
  }

  if (!programs.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Aún no hay programas"
        description="Crea un programa antes de iniciar una cohorte."
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Selecciona Programa y Versión</h2>
        <p className="text-slate-600">Elige el programa que usarás para esta cohorte y la versión específica</p>
      </div>

      {/* Selector de Programa */}
      <div className="space-y-2">
        <Label>Programa *</Label>
        <Select value={programaId} onValueChange={(value) => setValue("programa_id", value)}>
          <SelectTrigger className={errors.programa_id && "border-red-500"}>
            <SelectValue placeholder="Selecciona un programa" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((programa: any) => (
              <SelectItem key={programa.id} value={programa.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{programa.nombre}</span>
                  <span className="text-sm text-slate-500">{programa.descripcion}</span>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {programa.estadisticas.fases}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {programa.estadisticas.proof_points}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {programa.estadisticas.duracion}
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.programa_id && <p className="text-sm text-red-500">{errors.programa_id.message}</p>}
      </div>

      {/* Selector de Versión */}
      {programaId && (
        <div className="space-y-2">
          <Label>Versión del Programa *</Label>
          {loadingVersions ? (
            <LoadingState text="Cargando versiones..." size="sm" className="py-6" />
          ) : versionsError ? (
            <ErrorState
              message={versionsError.message || "Error al cargar las versiones del programa"}
              retry={onRetryVersions}
              className="min-h-[200px]"
            />
          ) : availableVersions.length > 0 ? (
            <div className="grid gap-3">
              {availableVersions.map((version: ProgramVersion) => (
                <div
                  key={version.version}
                  onClick={() => setValue("programa_version_id", version.version)}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all hover:border-primary",
                    versionId === version.version && "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      {version.estado === "actual" && (
                        <Badge className="bg-emerald-100 text-emerald-700">Actual</Badge>
                      )}
                      {version.estado === "beta" && <Badge className="bg-amber-100 text-amber-700">Beta</Badge>}
                      {version.recomendada && <Badge className="bg-blue-100 text-blue-700">Recomendada</Badge>}
                    </div>
                    <span className="text-sm text-slate-500">{new Date(version.fecha).toLocaleDateString("es-ES")}</span>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1 mb-2">
                    {version.cambios.map((cambio, index) => (
                      <li key={index}>• {cambio}</li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Usada en {version.cohortes_usando} cohorte{version.cohortes_usando !== 1 && "s"}
                    </span>
                    {version.advertencia && <span className="text-amber-600">{version.advertencia}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Sin versiones disponibles"
              description="Este programa aún no tiene versiones publicadas."
            />
          )}
          {errors.programa_version_id && <p className="text-sm text-red-500">{errors.programa_version_id.message}</p>}
        </div>
      )}
    </div>
  )
}

// Step 2: Configuración
function Step2Configuracion({ register, errors, watch, setValue, fechaInicio, handleFechaInicioChange }: any) {
  const modoAcceso = watch("modo_acceso")
  const recordatorioInactividad = watch("recordatorio_inactividad")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Configuración de la Cohorte</h2>
        <p className="text-slate-600">Define los parámetros de funcionamiento</p>
      </div>

      {/* Información Básica */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Información Básica</h3>

        <div className="space-y-2">
          <Label>Nombre de la Cohorte *</Label>
          <Input
            {...register("nombre")}
            placeholder="Ej: Cohorte Otoño 2024"
            className={errors.nombre && "border-red-500"}
          />
          {errors.nombre && <p className="text-sm text-red-500">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Descripción (opcional)</Label>
          <Textarea {...register("descripcion")} placeholder="Describe esta cohorte..." rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha de Inicio *</Label>
            <Input
              type="date"
              value={fechaInicio || ""}
              onChange={(e) => handleFechaInicioChange(e.target.value)}
              className={errors.fecha_inicio && "border-red-500"}
            />
            {errors.fecha_inicio && <p className="text-sm text-red-500">{errors.fecha_inicio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Fecha de Fin Estimada *</Label>
            <Input
              type="date"
              {...register("fecha_fin_estimada")}
              className={errors.fecha_fin_estimada && "border-red-500"}
            />
            {errors.fecha_fin_estimada && <p className="text-sm text-red-500">{errors.fecha_fin_estimada.message}</p>}
          </div>
        </div>
      </div>

      {/* Control de Acceso */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Control de Acceso</h3>

        <div className="space-y-2">
          <Label>Modo de Acceso</Label>
          <Select value={modoAcceso} onValueChange={(value) => setValue("modo_acceso", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abierto">
                <div className="flex flex-col">
                  <span className="font-medium">Abierto</span>
                  <span className="text-sm text-slate-500">Todo disponible desde el inicio</span>
                </div>
              </SelectItem>
              <SelectItem value="secuencial">
                <div className="flex flex-col">
                  <span className="font-medium">Secuencial</span>
                  <span className="text-sm text-slate-500">Desbloqueo progresivo al completar</span>
                </div>
              </SelectItem>
              <SelectItem value="programado">
                <div className="flex flex-col">
                  <span className="font-medium">Programado</span>
                  <span className="text-sm text-slate-500">Desbloqueo en fechas específicas</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Permitir saltar niveles</Label>
            <p className="text-sm text-slate-500">Los estudiantes pueden avanzar sin completar todo</p>
          </div>
          <Switch
            checked={watch("permitir_saltar_niveles")}
            onCheckedChange={(checked) => setValue("permitir_saltar_niveles", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Reintentos ilimitados</Label>
            <p className="text-sm text-slate-500">Sin límite de intentos en evaluaciones</p>
          </div>
          <Switch
            checked={watch("reintentos_ilimitados")}
            onCheckedChange={(checked) => setValue("reintentos_ilimitados", checked)}
          />
        </div>
      </div>

      {/* Notificaciones */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Notificaciones Automáticas</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Recordatorio de inactividad</Label>
              <p className="text-sm text-slate-500">Enviar email si el estudiante no accede</p>
            </div>
            <Switch
              checked={recordatorioInactividad}
              onCheckedChange={(checked) => setValue("recordatorio_inactividad", checked)}
            />
          </div>

          {recordatorioInactividad && (
            <div className="ml-6 space-y-2">
              <Label>Días de inactividad</Label>
              <Input
                type="number"
                {...register("dias_inactividad", { valueAsNumber: true })}
                min={1}
                max={30}
                className="w-32"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Celebración de completación</Label>
              <p className="text-sm text-slate-500">Email de felicitación al completar el programa</p>
            </div>
            <Switch
              checked={watch("celebracion_completacion")}
              onCheckedChange={(checked) => setValue("celebracion_completacion", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 3: Estudiantes
function Step3Estudiantes({ estudiantes, activeTab, setActiveTab, onAddEstudiante, onRemoveEstudiante }: any) {
  const [email, setEmail] = useState("")
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")

  const handleAdd = () => {
    if (email && nombre) {
      onAddEstudiante({ email, nombre, telefono })
      setEmail("")
      setNombre("")
      setTelefono("")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Agregar Estudiantes</h2>
        <p className="text-slate-600">Invita estudiantes a esta cohorte</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("individual")}
          className={cn(
            "px-4 py-2 font-medium border-b-2 transition-colors",
            activeTab === "individual"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Individual
          </div>
        </button>
        <button
          onClick={() => setActiveTab("csv")}
          className={cn(
            "px-4 py-2 font-medium border-b-2 transition-colors",
            activeTab === "csv"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            CSV
          </div>
        </button>
        <button
          onClick={() => setActiveTab("cohorte")}
          className={cn(
            "px-4 py-2 font-medium border-b-2 transition-colors",
            activeTab === "cohorte"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Desde Cohorte
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "individual" && (
        <div className="space-y-6">
          <div className="p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="estudiante@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Teléfono (opcional)</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+52 123 456 7890" />
            </div>
            <Button onClick={handleAdd} disabled={!email || !nombre} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Agregar Estudiante
            </Button>
          </div>

          {/* Lista de estudiantes */}
          {estudiantes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Estudiantes a Invitar ({estudiantes.length})</h3>
              <div className="border rounded-lg divide-y">
                {estudiantes.map((est: EstudianteInvitado, index: number) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {est.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{est.nombre}</div>
                        <div className="text-sm text-slate-500">{est.email}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveEstudiante(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "csv" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Arrastra un archivo CSV o haz clic para seleccionar</h3>
            <p className="text-sm text-slate-500 mb-4">Formatos soportados: .csv, .xlsx</p>
            <Button variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Plantilla
            </Button>
          </div>
        </div>
      )}

      {activeTab === "cohorte" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Selecciona una cohorte</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Elige una cohorte existente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coh_001">Cohorte Primavera 2024</SelectItem>
                <SelectItem value="coh_002">Cohorte Verano 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-slate-500">
            Los estudiantes de la cohorte seleccionada serán copiados a esta nueva cohorte
          </p>
        </div>
      )}
    </div>
  )
}
