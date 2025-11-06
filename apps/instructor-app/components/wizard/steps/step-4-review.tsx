"use client"

import { FileText, Layers, Target, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProgramFormData } from "@/types/wizard"

interface Step4Props {
  data: ProgramFormData
  onGoToStep: (step: number) => void
}

export function Step4Review({ data, onGoToStep }: Step4Props) {
  const totalProofPoints = data.fases.reduce((sum, fase) => sum + fase.proof_points.length, 0)
  const totalHoras = data.fases.reduce(
    (sum, fase) => sum + fase.proof_points.reduce((s, pp) => s + (pp.duracion_estimada_horas || 0), 0),
    0,
  )

  // Validaciones
  const validationIssues: { message: string; step: number }[] = []

  // Validar campos básicos
  if (!data.nombre_programa?.trim()) {
    validationIssues.push({ message: "El nombre del programa es requerido", step: 1 })
  }

  // Validar fases
  data.fases.forEach((fase, faseIndex) => {
    if (!fase.nombre_fase?.trim()) {
      validationIssues.push({ message: `La fase ${faseIndex + 1} necesita un nombre`, step: 2 })
    }

    // Validar proof points
    fase.proof_points.forEach((pp, ppIndex) => {
      if (!pp.nombre_pp?.trim()) {
        validationIssues.push({ message: `El proof point ${ppIndex + 1} de la fase ${faseIndex + 1} necesita un nombre`, step: 3 })
      }
      if (!pp.pregunta_central?.trim()) {
        validationIssues.push({ message: `El proof point ${ppIndex + 1} de la fase ${faseIndex + 1} necesita una pregunta central`, step: 3 })
      }
    })
  })

  const hasErrors = validationIssues.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Revisión Final</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Revisa la estructura completa del programa antes de crearlo
        </p>
      </div>

      {/* Información Básica */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Información Básica</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onGoToStep(1)}>
            Editar
          </Button>
        </div>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
            <dd className="mt-1">{data.nombre_programa}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Categoría</dt>
            <dd className="mt-1 capitalize">{data.categoria.replace("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Duración</dt>
            <dd className="mt-1">{data.duracion_semanas} semanas</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Descripción</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{data.descripcion}</dd>
          </div>
        </dl>
      </div>

      {/* Estructura */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Estructura del Programa</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onGoToStep(2)}>
            Editar
          </Button>
        </div>
        <div className="space-y-4">
          {data.fases.map((fase, index) => (
            <div key={fase.id} className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Layers className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">
                    Fase {index + 1}: {fase.nombre_fase}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {fase.proof_points.length} proof points • {fase.duracion_semanas_fase} semanas
                  </div>
                  <div className="mt-2 space-y-1">
                    {fase.proof_points.map((pp, ppIndex) => (
                      <div key={pp.id} className="flex items-center gap-2 text-sm">
                        <Target className="h-3 w-3 text-primary" />
                        <span>{pp.nombre_pp || `Proof Point ${ppIndex + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span className="text-sm">Total Fases</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{data.fases.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="text-sm">Total Proof Points</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{totalProofPoints}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Duración Total</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{data.duracion_semanas} sem</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Horas Estimadas</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{totalHoras}h</div>
        </div>
      </div>

      {/* Validaciones */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 font-semibold">Validaciones</h3>
        <div className="space-y-2">
          {!hasErrors ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Todos los campos requeridos completados</span>
            </div>
          ) : (
            <div className="space-y-2">
              {validationIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1">
                    <span>{issue.message}</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-2 h-auto p-0 text-xs"
                      onClick={() => onGoToStep(issue.step)}
                    >
                      Ir al paso {issue.step}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.fases.some((f) => f.proof_points.length === 1) && !hasErrors && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Algunas fases tienen solo 1 proof point - considera agregar más</span>
            </div>
          )}
        </div>
      </div>

      {/* Siguiente Paso */}
      <div className="rounded-lg bg-accent/10 p-6">
        <h3 className="mb-2 font-semibold">¿Qué sigue después?</h3>
        <p className="text-sm text-muted-foreground">Una vez creado el programa, podrás:</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Cargar documentación de cada fase</li>
          <li>• Agregar ejercicios a cada proof point</li>
          <li>• Generar contenido con IA</li>
          <li>• Configurar ejercicios en detalle</li>
        </ul>
      </div>
    </div>
  )
}
