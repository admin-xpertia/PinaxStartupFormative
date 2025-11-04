"use client"

import type React from "react"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  BookOpen,
  FileEdit,
  MessageSquare,
  Wrench,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Sparkles,
  Eye,
  Plus,
  Save,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Nivel, ComponenteAprendizaje, TipoComponente } from "@/types/fase"
import { useNotificationStore } from "@/stores/notification-store"

const componenteSchema = z.object({
  id: z.string(),
  tipo: z.enum(["leccion", "cuaderno", "simulacion", "herramienta"]),
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  duracion_minutos: z.number().min(5).max(180),
  es_evaluable: z.boolean(),
  contenido_listo: z.boolean(),
})

const nivelSchema = z.object({
  id: z.string(),
  numero: z.number(),
  nombre: z.string().min(1, "Nombre requerido"),
  objetivo_especifico: z.string().min(1, "Objetivo requerido"),
  componentes: z.array(componenteSchema).min(1, "Mínimo 1 componente"),
  criterio_completacion: z.object({
    tipo: z.enum(["simple", "custom"]),
    condiciones: z.array(z.string()).optional(),
  }),
})

const formSchema = z.object({
  niveles: z.array(nivelSchema),
})

type FormValues = z.infer<typeof formSchema>

interface NivelConfiguratorProps {
  programaId: string
  proofPointId: string
  proofPointNombre: string
  nivelesExistentes: Nivel[]
  onSave: (niveles: Nivel[]) => Promise<void>
  onClose?: () => void
}

const tipoComponenteConfig = {
  leccion: {
    label: "Lección Interactiva",
    icon: BookOpen,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    descripcion: "Contenido teórico con ejemplos",
  },
  cuaderno: {
    label: "Cuaderno de Trabajo",
    icon: FileEdit,
    color: "emerald",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    descripcion: "Reflexión y aplicación escrita",
  },
  simulacion: {
    label: "Simulación",
    icon: MessageSquare,
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    descripcion: "Práctica conversacional",
  },
  herramienta: {
    label: "Herramienta",
    icon: Wrench,
    color: "amber",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    descripcion: "Asistente especializado",
  },
}

function SortableNivel({
  nivel,
  nivelIndex,
  onRemove,
  onDuplicate,
  children,
}: {
  nivel: any
  nivelIndex: number
  onRemove: () => void
  onDuplicate: () => void
  children: React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: nivel.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isConfigured = nivel.componentes && nivel.componentes.length > 0

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className={`${isDragging ? "shadow-lg ring-2 ring-cyan-500" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <h3 className="font-semibold text-lg">Nivel {nivelIndex + 1}</h3>
              <Badge variant={isConfigured ? "default" : "secondary"}>
                {isConfigured ? "Configurado" : "Pendiente"}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && <CardContent>{children}</CardContent>}
      </Card>
    </div>
  )
}

function SortableComponente({
  componente,
  componenteIndex,
  nivelIndex,
  onRemove,
  onDuplicate,
  onEdit,
  onGenerate,
}: {
  componente: any
  componenteIndex: number
  nivelIndex: number
  onRemove: () => void
  onDuplicate: () => void
  onEdit: () => void
  onGenerate: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = tipoComponenteConfig[componente.tipo as TipoComponente]
  const Icon = config.icon

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: componente.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card
        className={`${config.bgColor} ${config.borderColor} border-l-4 ${
          isDragging ? "shadow-lg ring-2 ring-cyan-500" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <Icon className={`h-4 w-4 ${config.textColor}`} />
            <span className="text-xs text-slate-500">#{componenteIndex + 1}</span>
            <span className="font-medium flex-1">{componente.nombre}</span>

            <div className="flex items-center gap-1">
              {componente.contenido_listo ? (
                <Badge variant="default" className="bg-emerald-500">
                  Listo
                </Badge>
              ) : (
                <Badge variant="secondary">Sin contenido</Badge>
              )}
              {componente.es_evaluable && (
                <Badge variant="outline" className="border-blue-500 text-blue-700">
                  Evaluable
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onDuplicate}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-2 space-y-3">
            <div>
              <Label>Descripción</Label>
              <p className="text-sm text-slate-600">{componente.descripcion}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duración</Label>
                <p className="text-sm">{componente.duracion_minutos} minutos</p>
              </div>
              <div>
                <Label>Tipo</Label>
                <p className="text-sm">{config.label}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              {componente.contenido_listo ? (
                <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                  <Eye className="h-3 w-3 mr-1" />
                  Ver y Editar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={onGenerate}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generar con IA
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export function NivelConfigurator({
  programaId,
  proofPointId,
  proofPointNombre,
  nivelesExistentes,
  onSave,
  onClose,
}: NivelConfiguratorProps) {
  const { showToast } = useNotificationStore()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      niveles: nivelesExistentes.length > 0 ? nivelesExistentes : [],
    },
  })

  const {
    fields: niveles,
    append: appendNivel,
    remove: removeNivel,
    move: moveNivel,
  } = useFieldArray({
    control: form.control,
    name: "niveles",
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleAddNivel = () => {
    const newNivel: Nivel = {
      id: `nivel_${Date.now()}`,
      numero: niveles.length,
      nombre: "",
      objetivo_especifico: "",
      componentes: [],
      criterio_completacion: {
        tipo: "simple",
      },
    }
    appendNivel(newNivel)
  }

  const handleDuplicateNivel = (index: number) => {
    const nivel = form.getValues(`niveles.${index}`)
    const newNivel = {
      ...nivel,
      id: `nivel_${Date.now()}`,
      numero: niveles.length,
      nombre: `${nivel.nombre} (copia)`,
    }
    appendNivel(newNivel)
  }

  const handleDragEndNiveles = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = niveles.findIndex((n) => n.id === active.id)
      const newIndex = niveles.findIndex((n) => n.id === over.id)
      moveNivel(oldIndex, newIndex)
    }
  }

  const handleAddComponente = (nivelIndex: number, tipo: TipoComponente) => {
    const config = tipoComponenteConfig[tipo]
    const newComponente: ComponenteAprendizaje = {
      id: `comp_${Date.now()}`,
      tipo,
      nombre: `Nuevo ${config.label}`,
      descripcion: "",
      duracion_minutos: 30,
      es_evaluable: false,
      contenido_listo: false,
    }

    const currentComponentes = form.getValues(`niveles.${nivelIndex}.componentes`) || []
    form.setValue(`niveles.${nivelIndex}.componentes`, [...currentComponentes, newComponente])
  }

  const handleSubmit = async (data: FormValues) => {
    setIsSaving(true)
    try {
      // Actualizar números de nivel
      const nivelesActualizados = data.niveles.map((nivel, index) => ({
        ...nivel,
        numero: index,
      }))

      await onSave(nivelesActualizados)
      showToast("success", "Niveles guardados exitosamente")
      onClose?.()
    } catch (error) {
      showToast("error", "Error al guardar niveles")
    } finally {
      setIsSaving(false)
    }
  }

  const totalComponentes = niveles.reduce((acc, nivel) => acc + (nivel.componentes?.length || 0), 0)
  const duracionTotal = niveles.reduce(
    (acc, nivel) => acc + (nivel.componentes?.reduce((sum, comp) => sum + comp.duracion_minutos, 0) || 0),
    0,
  )
  const componentesEvaluables = niveles.reduce(
    (acc, nivel) => acc + (nivel.componentes?.filter((c) => c.es_evaluable).length || 0),
    0,
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500 mb-1">Programa &gt; Proof Point &gt; Configurar Niveles</div>
              <h1 className="text-2xl font-bold">Configurar Niveles: {proofPointNombre}</h1>
              <p className="text-slate-600 mt-1">Define la progresión de aprendizaje en {niveles.length} niveles</p>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSaving}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between">
            <Button
              type="button"
              onClick={handleAddNivel}
              variant="outline"
              className="border-cyan-600 text-cyan-600 hover:bg-cyan-50 bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Nivel
            </Button>

            <p className="text-sm text-slate-600">Los estudiantes progresan secuencialmente por los niveles</p>
          </div>

          {/* Niveles */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndNiveles}>
            <SortableContext items={niveles.map((n) => n.id)} strategy={verticalListSortingStrategy}>
              {niveles.map((nivel, nivelIndex) => (
                <SortableNivel
                  key={nivel.id}
                  nivel={nivel}
                  nivelIndex={nivelIndex}
                  onRemove={() => removeNivel(nivelIndex)}
                  onDuplicate={() => handleDuplicateNivel(nivelIndex)}
                >
                  <div className="space-y-4">
                    {/* Información básica */}
                    <div className="space-y-3">
                      <div>
                        <Label>Nombre del Nivel</Label>
                        <Input
                          {...form.register(`niveles.${nivelIndex}.nombre`)}
                          placeholder="Ej: Fundamentos del CSF"
                        />
                      </div>

                      <div>
                        <Label>Objetivo Específico</Label>
                        <Textarea
                          {...form.register(`niveles.${nivelIndex}.objetivo_especifico`)}
                          placeholder="¿Qué debe lograr el estudiante en este nivel?"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Componentes */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base">Componentes de Aprendizaje</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar Componente
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.entries(tipoComponenteConfig).map(([tipo, config]) => {
                              const Icon = config.icon
                              return (
                                <DropdownMenuItem
                                  key={tipo}
                                  onClick={() => handleAddComponente(nivelIndex, tipo as TipoComponente)}
                                >
                                  <Icon className={`h-4 w-4 mr-2 ${config.textColor}`} />
                                  <div>
                                    <div className="font-medium">{config.label}</div>
                                    <div className="text-xs text-slate-500">{config.descripcion}</div>
                                  </div>
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {nivel.componentes && nivel.componentes.length > 0 ? (
                        <div className="space-y-2">
                          {nivel.componentes.map((componente, compIndex) => (
                            <SortableComponente
                              key={componente.id}
                              componente={componente}
                              componenteIndex={compIndex}
                              nivelIndex={nivelIndex}
                              onRemove={() => {
                                const currentComponentes = form.getValues(`niveles.${nivelIndex}.componentes`)
                                form.setValue(
                                  `niveles.${nivelIndex}.componentes`,
                                  currentComponentes.filter((_, i) => i !== compIndex),
                                )
                              }}
                              onDuplicate={() => {
                                const currentComponentes = form.getValues(`niveles.${nivelIndex}.componentes`)
                                const newComp = {
                                  ...componente,
                                  id: `comp_${Date.now()}`,
                                  nombre: `${componente.nombre} (copia)`,
                                }
                                form.setValue(`niveles.${nivelIndex}.componentes`, [...currentComponentes, newComp])
                              }}
                              onEdit={() => {
                                showToast("info", "Abriendo editor de contenido...")
                              }}
                              onGenerate={() => {
                                showToast("info", "Abriendo generador de contenido con IA...")
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed">
                          <p>No hay componentes aún</p>
                          <p className="text-sm">Agrega actividades que los estudiantes completarán</p>
                        </div>
                      )}
                    </div>
                  </div>
                </SortableNivel>
              ))}
            </SortableContext>
          </DndContext>

          {niveles.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
              <p className="text-slate-600 mb-4">No hay niveles configurados</p>
              <Button type="button" onClick={handleAddNivel} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Nivel
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Footer con resumen */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-slate-500">Total Niveles</div>
                <div className="text-xl font-bold">{niveles.length}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Total Componentes</div>
                <div className="text-xl font-bold">{totalComponentes}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Duración Estimada</div>
                <div className="text-xl font-bold">{(duracionTotal / 60).toFixed(1)} horas</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Componentes Evaluables</div>
                <div className="text-xl font-bold">
                  {componentesEvaluables} de {totalComponentes}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
