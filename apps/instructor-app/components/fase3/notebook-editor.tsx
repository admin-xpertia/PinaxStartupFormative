"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Eye,
  GripVertical,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react"
import type { CuadernoContent, SeccionCuaderno, PreguntaCuaderno, TipoPregunta } from "@/types/content"

// Validation schema
const preguntaSchema = z.object({
  id: z.string(),
  pregunta: z.string().min(10, "La pregunta debe tener al menos 10 caracteres"),
  tipo: z.enum(["reflexion", "aplicacion", "analisis", "sintesis"]),
  es_critica: z.boolean(),
  prompt_respuesta: z.string().optional(),
  ejemplo_respuesta_fuerte: z.string().optional(),
})

const seccionSchema = z.object({
  id: z.string(),
  numero: z.number(),
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  instrucciones: z.string().min(20, "Las instrucciones deben tener al menos 20 caracteres"),
  preguntas: z.array(preguntaSchema),
})

const cuadernoSchema = z.object({
  instrucciones: z.string().min(50, "Las instrucciones generales deben tener al menos 50 caracteres"),
  secciones: z.array(seccionSchema).min(1, "Debe haber al menos una sección"),
  dimensiones_evaluar: z.array(z.string()).min(1, "Debe haber al menos una dimensión de evaluación"),
  peso_criticas: z.number().min(0.5).max(2),
  umbral_aprobacion: z.number().min(0).max(10),
})

interface NotebookEditorProps {
  programaId: string
  componenteId: string
  componenteNombre: string
  contenidoInicial: CuadernoContent & {
    instrucciones: string
    dimensiones_evaluar?: string[]
    peso_criticas?: number
    umbral_aprobacion?: number
  }
  onSave: (contenido: any) => Promise<void>
  onClose?: () => void
}

export function NotebookEditor({
  programaId,
  componenteId,
  componenteNombre: initialNombre,
  contenidoInicial,
  onSave,
  onClose,
}: NotebookEditorProps) {
  const [componenteNombre, setComponenteNombre] = useState(initialNombre)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  const [showPreview, setShowPreview] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(["seccion-0"])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cuadernoSchema),
    defaultValues: {
      instrucciones: contenidoInicial.instrucciones || "",
      secciones: contenidoInicial.secciones || [],
      dimensiones_evaluar: contenidoInicial.dimensiones_evaluar || ["Profundidad de reflexión", "Uso de evidencia"],
      peso_criticas: contenidoInicial.peso_criticas || 1.5,
      umbral_aprobacion: contenidoInicial.umbral_aprobacion || 7,
    },
  })

  const {
    fields: secciones,
    append: appendSeccion,
    remove: removeSeccion,
    move: moveSeccion,
  } = useFieldArray({
    control,
    name: "secciones",
  })

  const watchedData = watch()

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(() => {
      handleSave()
    }, 30000)

    return () => clearTimeout(timer)
  }, [hasChanges, watchedData])

  // Track changes
  useEffect(() => {
    const subscription = watch(() => setHasChanges(true))
    return () => subscription.unsubscribe()
  }, [watch])

  const handleSave = async () => {
    setSaveStatus("saving")
    try {
      await onSave(watchedData)
      setHasChanges(false)
      setSaveStatus("saved")
      setLastSaved(new Date())
    } catch (error) {
      setSaveStatus("error")
    }
  }

  const handleBack = () => {
    if (hasChanges) {
      if (confirm("Tienes cambios sin guardar. ¿Deseas salir sin guardar?")) {
        onClose?.()
      }
    } else {
      onClose?.()
    }
  }

  const addSeccion = () => {
    const newSeccion: SeccionCuaderno = {
      id: `seccion-${Date.now()}`,
      numero: secciones.length + 1,
      titulo: `Sección ${secciones.length + 1}`,
      instrucciones: "",
      preguntas: [],
    }
    appendSeccion(newSeccion)
    setExpandedSections([...expandedSections, newSeccion.id])
  }

  const duplicateSeccion = (index: number) => {
    const seccion = secciones[index]
    const newSeccion = {
      ...seccion,
      id: `seccion-${Date.now()}`,
      numero: secciones.length + 1,
      titulo: `${seccion.titulo} (copia)`,
    }
    appendSeccion(newSeccion)
  }

  const toggleSection = (seccionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(seccionId) ? prev.filter((id) => id !== seccionId) : [...prev, seccionId],
    )
  }

  // Calculate stats
  const totalPreguntas = secciones.reduce((acc, seccion) => acc + (seccion.preguntas?.length || 0), 0)
  const preguntasCriticas = secciones.reduce(
    (acc, seccion) => acc + (seccion.preguntas?.filter((p) => p.es_critica).length || 0),
    0,
  )

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="text-sm text-muted-foreground">Programa &gt; Fase &gt; Proof Point &gt; Cuaderno</div>
        </div>

        <Input
          value={componenteNombre}
          onChange={(e) => setComponenteNombre(e.target.value)}
          className="max-w-md text-center font-medium"
          placeholder="Nombre del cuaderno..."
        />

        <div className="flex items-center gap-2">
          <Button variant={showPreview ? "default" : "ghost"} size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="mr-2 h-4 w-4" />
            Vista Previa
          </Button>

          <Button onClick={handleSubmit(handleSave)} disabled={!hasChanges || saveStatus === "saving"}>
            {saveStatus === "saving" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl space-y-6 p-8">
            {/* Instrucciones Generales */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <Label htmlFor="instrucciones" className="text-base font-semibold">
                Instrucciones Generales del Cuaderno
              </Label>
              <p className="mb-3 text-sm text-muted-foreground">
                Explica el propósito del cuaderno y cómo los estudiantes deben abordarlo
              </p>
              <Textarea
                id="instrucciones"
                {...register("instrucciones")}
                rows={4}
                placeholder="Ej: Este cuaderno te guiará en el proceso de validar tu idea de negocio..."
                className="resize-none"
              />
              {errors.instrucciones && <p className="mt-1 text-sm text-rose-600">{errors.instrucciones.message}</p>}
            </div>

            {/* Secciones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Secciones del Cuaderno</h2>
                <Button onClick={addSeccion} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Sección
                </Button>
              </div>

              {secciones.length === 0 && (
                <div className="rounded-lg border-2 border-dashed bg-white p-12 text-center">
                  <p className="mb-4 text-muted-foreground">No hay secciones todavía</p>
                  <Button onClick={addSeccion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primera Sección
                  </Button>
                </div>
              )}

              {secciones.map((seccion, seccionIndex) => (
                <SeccionCard
                  key={seccion.id}
                  seccion={seccion}
                  seccionIndex={seccionIndex}
                  register={register}
                  control={control}
                  errors={errors}
                  isExpanded={expandedSections.includes(seccion.id)}
                  onToggle={() => toggleSection(seccion.id)}
                  onDuplicate={() => duplicateSeccion(seccionIndex)}
                  onRemove={() => removeSeccion(seccionIndex)}
                />
              ))}
            </div>

            {/* Configuración de Evaluación */}
            <ConfiguracionEvaluacion register={register} control={control} watch={watch} setValue={setValue} />
          </div>
        </ScrollArea>

        {/* Preview Panel */}
        {showPreview && <PreviewPanel data={watchedData} componenteNombre={componenteNombre} />}
      </div>

      {/* Footer */}
      <footer className="flex h-14 items-center justify-between border-t bg-white px-6 text-sm">
        <div className="flex items-center gap-6 text-muted-foreground">
          <span>Secciones: {secciones.length}</span>
          <span>Preguntas: {totalPreguntas}</span>
          <span>Críticas: {preguntasCriticas}</span>
          <span>Última modificación: hace {Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s</span>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Guardando...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-600">Guardado</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span className="text-rose-600">Error al guardar</span>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}

function SeccionCard({
  seccion,
  seccionIndex,
  register,
  control,
  errors,
  isExpanded,
  onToggle,
  onDuplicate,
  onRemove,
}: any) {
  const {
    fields: preguntas,
    append: appendPregunta,
    remove: removePregunta,
  } = useFieldArray({
    control,
    name: `secciones.${seccionIndex}.preguntas`,
  })

  const addPregunta = () => {
    const newPregunta: PreguntaCuaderno = {
      id: `pregunta-${Date.now()}`,
      pregunta: "",
      tipo: "reflexion",
      es_critica: false,
    }
    appendPregunta(newPregunta)
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Button variant="ghost" size="sm" className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sección {seccion.numero}</span>
            <Input
              {...register(`secciones.${seccionIndex}.titulo`)}
              placeholder="Nombre de la sección"
              className="h-8 flex-1 border-0 bg-transparent px-2 font-semibold focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-rose-600 hover:text-rose-700">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="space-y-4 p-4">
          {/* Instrucciones */}
          <div>
            <Label htmlFor={`secciones.${seccionIndex}.instrucciones`}>Instrucciones de Sección</Label>
            <Textarea
              {...register(`secciones.${seccionIndex}.instrucciones`)}
              rows={3}
              placeholder="Instrucciones específicas para esta sección..."
              className="mt-1 resize-none"
            />
            {errors.secciones?.[seccionIndex]?.instrucciones && (
              <p className="mt-1 text-sm text-rose-600">{errors.secciones[seccionIndex].instrucciones.message}</p>
            )}
          </div>

          {/* Preguntas */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>Preguntas Guía</Label>
              <Button onClick={addPregunta} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Pregunta
              </Button>
            </div>

            {preguntas.length === 0 && (
              <div className="rounded-lg border-2 border-dashed bg-slate-50 p-6 text-center">
                <p className="text-sm text-muted-foreground">No hay preguntas en esta sección</p>
              </div>
            )}

            <div className="space-y-3">
              {preguntas.map((pregunta, preguntaIndex) => (
                <PreguntaCard
                  key={pregunta.id}
                  seccionIndex={seccionIndex}
                  preguntaIndex={preguntaIndex}
                  register={register}
                  errors={errors}
                  onRemove={() => removePregunta(preguntaIndex)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PreguntaCard({ seccionIndex, preguntaIndex, register, errors, onRemove }: any) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const tipoColors: Record<TipoPregunta, string> = {
    reflexion: "bg-purple-100 text-purple-700 border-purple-200",
    aplicacion: "bg-blue-100 text-blue-700 border-blue-200",
    analisis: "bg-amber-100 text-amber-700 border-amber-200",
    sintesis: "bg-emerald-100 text-emerald-700 border-emerald-200",
  }

  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <Button variant="ghost" size="sm" className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>

        <div className="flex-1 space-y-3">
          {/* Pregunta */}
          <div>
            <Textarea
              {...register(`secciones.${seccionIndex}.preguntas.${preguntaIndex}.pregunta`)}
              rows={2}
              placeholder="¿Pregunta guía?"
              className="resize-none"
            />
            {errors.secciones?.[seccionIndex]?.preguntas?.[preguntaIndex]?.pregunta && (
              <p className="mt-1 text-sm text-rose-600">
                {errors.secciones[seccionIndex].preguntas[preguntaIndex].pregunta.message}
              </p>
            )}
          </div>

          {/* Tipo y Crítica */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select
                defaultValue="reflexion"
                onValueChange={(value) =>
                  register(`secciones.${seccionIndex}.preguntas.${preguntaIndex}.tipo`).onChange({
                    target: { value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reflexion">Reflexión</SelectItem>
                  <SelectItem value="aplicacion">Aplicación</SelectItem>
                  <SelectItem value="analisis">Análisis</SelectItem>
                  <SelectItem value="sintesis">Síntesis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2">
              <Checkbox {...register(`secciones.${seccionIndex}.preguntas.${preguntaIndex}.es_critica`)} />
              <span className="text-sm">Pregunta crítica</span>
            </label>
          </div>

          {/* Advanced Options */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs"
          >
            {showAdvanced ? "Ocultar" : "Mostrar"} opciones avanzadas
            {showAdvanced ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
          </Button>

          {showAdvanced && (
            <div className="space-y-3 rounded-lg border bg-white p-3">
              <div>
                <Label className="text-xs">Prompt de respuesta (opcional)</Label>
                <Textarea
                  {...register(`secciones.${seccionIndex}.preguntas.${preguntaIndex}.prompt_respuesta`)}
                  rows={2}
                  placeholder="Guía adicional para ayudar al estudiante..."
                  className="mt-1 resize-none text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">Ejemplo de respuesta fuerte (opcional)</Label>
                <p className="mb-1 text-xs text-muted-foreground">Usado para calibrar IA evaluadora</p>
                <Textarea
                  {...register(`secciones.${seccionIndex}.preguntas.${preguntaIndex}.ejemplo_respuesta_fuerte`)}
                  rows={3}
                  placeholder="Ejemplo de una respuesta de alta calidad..."
                  className="resize-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onRemove} className="text-rose-600 hover:text-rose-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ConfiguracionEvaluacion({ register, control, watch, setValue }: any) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newDimension, setNewDimension] = useState("")

  const dimensiones = watch("dimensiones_evaluar") || []
  const pesoCriticas = watch("peso_criticas") || 1.5
  const umbralAprobacion = watch("umbral_aprobacion") || 7

  const dimensionesPredefinidas = [
    "Profundidad de reflexión",
    "Uso de evidencia",
    "Claridad de expresión",
    "Aplicación de conceptos",
    "Pensamiento crítico",
    "Conexión con experiencia",
  ]

  const addDimension = (dimension: string) => {
    if (!dimensiones.includes(dimension)) {
      setValue("dimensiones_evaluar", [...dimensiones, dimension])
    }
  }

  const removeDimension = (dimension: string) => {
    setValue(
      "dimensiones_evaluar",
      dimensiones.filter((d: string) => d !== dimension),
    )
  }

  const addCustomDimension = () => {
    if (newDimension.trim() && !dimensiones.includes(newDimension.trim())) {
      setValue("dimensiones_evaluar", [...dimensiones, newDimension.trim()])
      setNewDimension("")
    }
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">Configuración de Evaluación</h3>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {isExpanded && (
        <div className="space-y-6 border-t p-4">
          {/* Dimensiones */}
          <div>
            <Label>Dimensiones a Evaluar</Label>
            <p className="mb-3 text-sm text-muted-foreground">
              Selecciona los aspectos que la IA evaluará en las respuestas
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {dimensiones.map((dimension: string) => (
                <Badge key={dimension} variant="secondary" className="gap-1">
                  {dimension}
                  <button type="button" onClick={() => removeDimension(dimension)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Dimensiones predefinidas:</p>
              <div className="flex flex-wrap gap-2">
                {dimensionesPredefinidas
                  .filter((d) => !dimensiones.includes(d))
                  .map((dimension) => (
                    <Button
                      key={dimension}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDimension(dimension)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {dimension}
                    </Button>
                  ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newDimension}
                  onChange={(e) => setNewDimension(e.target.value)}
                  placeholder="Dimensión personalizada..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomDimension())}
                />
                <Button type="button" onClick={addCustomDimension}>
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Peso de críticas */}
          <div>
            <Label>Peso de preguntas críticas: {pesoCriticas.toFixed(1)}x</Label>
            <p className="mb-3 text-sm text-muted-foreground">
              Multiplicador del score para preguntas marcadas como críticas
            </p>
            <Slider
              value={[pesoCriticas]}
              onValueChange={(value) => setValue("peso_criticas", value[0])}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Umbral de aprobación */}
          <div>
            <Label>Umbral de aprobación: {umbralAprobacion}/10</Label>
            <p className="mb-3 text-sm text-muted-foreground">Score mínimo para considerar el cuaderno completado</p>
            <Slider
              value={[umbralAprobacion]}
              onValueChange={(value) => setValue("umbral_aprobacion", value[0])}
              min={0}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>10</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewPanel({ data, componenteNombre }: any) {
  return (
    <div className="w-[500px] border-l bg-white">
      <div className="border-b p-4">
        <h3 className="font-semibold">Vista Previa</h3>
        <p className="text-sm text-muted-foreground">Cómo verán los estudiantes este cuaderno</p>
      </div>

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-6 p-6">
          <div>
            <h2 className="mb-2 text-xl font-bold">{componenteNombre}</h2>
            <p className="text-sm text-muted-foreground">{data.instrucciones}</p>
          </div>

          {data.secciones?.map((seccion: any, index: number) => (
            <div key={seccion.id} className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">
                Sección {index + 1}: {seccion.titulo}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">{seccion.instrucciones}</p>

              <div className="space-y-3">
                {seccion.preguntas?.map((pregunta: any, pIndex: number) => (
                  <div key={pregunta.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="mb-2 flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground">{pIndex + 1}.</span>
                      <p className="flex-1 text-sm">{pregunta.pregunta}</p>
                      {pregunta.es_critica && (
                        <Badge variant="destructive" className="text-xs">
                          Crítica
                        </Badge>
                      )}
                    </div>
                    <Textarea placeholder="Tu respuesta aquí..." rows={3} className="text-sm" disabled />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
