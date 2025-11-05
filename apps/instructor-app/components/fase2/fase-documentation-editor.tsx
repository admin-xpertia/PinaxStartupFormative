"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  FileText,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Link,
  CheckSquare,
  Plus,
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Circle,
  X,
} from "lucide-react"
import type { FaseDocumentation } from "@/types/fase"

// Zod schemas
const conceptoClaveSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, "Nombre requerido"),
  definicion: z.string().min(1, "Definición requerida"),
  ejemplo: z.string().min(1, "Ejemplo requerido"),
  terminos_relacionados: z.array(z.string()),
})

const casoEstudioSchema = z.object({
  id: z.string(),
  titulo: z.string().min(1, "Título requerido"),
  tipo: z.enum(["exito", "fracaso", "comparacion"]),
  descripcion: z.string().min(1, "Descripción requerida"),
  fuente: z.string(),
  conceptos_ilustrados: z.array(z.string()),
})

const errorComunSchema = z.object({
  id: z.string(),
  titulo: z.string().min(1, "Título requerido"),
  explicacion: z.string().min(1, "Explicación requerida"),
  como_evitar: z.string().min(1, "Cómo evitar requerido"),
})

const recursoReferenciaSchema = z.object({
  id: z.string(),
  titulo: z.string().min(1, "Título requerido"),
  tipo: z.enum(["paper", "libro", "video", "herramienta", "podcast", "otro"]),
  url: z.string().url("URL inválida"),
  notas: z.string(),
})

const criterioEvaluacionSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, "Nombre requerido"),
  descriptor: z.string().min(1, "Descriptor requerido"),
  nivel_importancia: z.enum(["critico", "importante", "deseable"]),
})

const faseDocumentationSchema = z.object({
  fase_id: z.string(),
  contexto: z.string().min(200, "El contexto debe tener al menos 200 caracteres"),
  conceptos_clave: z.array(conceptoClaveSchema).min(3, "Debes definir al menos 3 conceptos clave"),
  casos_estudio: z.array(casoEstudioSchema).min(2, "Debes agregar al menos 2 casos de estudio"),
  errores_comunes: z.array(errorComunSchema).min(2, "Debes agregar al menos 2 errores comunes"),
  recursos_referencia: z.array(recursoReferenciaSchema),
  criterios_evaluacion: z.array(criterioEvaluacionSchema).min(3, "Debes definir al menos 3 criterios de evaluación"),
  completitud: z.number(),
})

type FaseDocumentationForm = z.infer<typeof faseDocumentationSchema>

interface FaseDocumentationEditorProps {
  programaId: string
  faseId: string
  faseNombre: string
  documentacionExistente?: FaseDocumentation | null
  onSave: (doc: FaseDocumentation) => Promise<void>
  onClose?: () => void
}

export function FaseDocumentationEditor({
  programaId,
  faseId,
  faseNombre,
  documentacionExistente,
  onSave,
  onClose,
}: FaseDocumentationEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("contexto")
  const [showAIPanel, setShowAIPanel] = useState(false)

  const form = useForm<FaseDocumentationForm>({
    resolver: zodResolver(faseDocumentationSchema),
    defaultValues: documentacionExistente || {
      fase_id: faseId,
      contexto: "",
      conceptos_clave: [],
      casos_estudio: [],
      errores_comunes: [],
      recursos_referencia: [],
      criterios_evaluacion: [],
      completitud: 0,
    },
  })

  const {
    fields: conceptosFields,
    append: appendConcepto,
    remove: removeConcepto,
  } = useFieldArray({
    control: form.control,
    name: "conceptos_clave",
  })

  const {
    fields: casosFields,
    append: appendCaso,
    remove: removeCaso,
  } = useFieldArray({
    control: form.control,
    name: "casos_estudio",
  })

  const {
    fields: erroresFields,
    append: appendError,
    remove: removeError,
  } = useFieldArray({
    control: form.control,
    name: "errores_comunes",
  })

  const {
    fields: recursosFields,
    append: appendRecurso,
    remove: removeRecurso,
  } = useFieldArray({
    control: form.control,
    name: "recursos_referencia",
  })

  const {
    fields: criteriosFields,
    append: appendCriterio,
    remove: removeCriterio,
  } = useFieldArray({
    control: form.control,
    name: "criterios_evaluacion",
  })

  // Calculate completeness
  const calculateCompleteness = () => {
    const values = form.getValues()
    let score = 0
    const total = 6

    if (values.contexto && values.contexto.length >= 200) score++
    if (values.conceptos_clave && values.conceptos_clave.length >= 3) score++
    if (values.casos_estudio && values.casos_estudio.length >= 2) score++
    if (values.errores_comunes && values.errores_comunes.length >= 2) score++
    if (values.criterios_evaluacion && values.criterios_evaluacion.length >= 3) score++
    // Recursos es opcional, pero cuenta si tiene al menos 1
    if (values.recursos_referencia && values.recursos_referencia.length >= 1) score++

    return Math.round((score / total) * 100)
  }

  const [completeness, setCompleteness] = useState(calculateCompleteness())

  useEffect(() => {
    if (documentacionExistente) {
      form.reset({
        ...documentacionExistente,
        fase_id: documentacionExistente.fase_id || faseId,
      })
    } else {
      form.reset({
        fase_id: faseId,
        contexto: "",
        conceptos_clave: [],
        casos_estudio: [],
        errores_comunes: [],
        recursos_referencia: [],
        criterios_evaluacion: [],
        completitud: 0,
      })
    }
    setCompleteness(calculateCompleteness())
  }, [documentacionExistente, faseId, form])

  // Update completeness on form change
  useEffect(() => {
    const subscription = form.watch(() => {
      setCompleteness(calculateCompleteness())
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const values = form.getValues()
      localStorage.setItem(`fase-doc-${faseId}`, JSON.stringify(values))
    }, 30000)
    return () => clearInterval(interval)
  }, [faseId])

  const getSectionStatus = (section: string) => {
    const values = form.getValues()
    switch (section) {
      case "contexto":
        return values.contexto && values.contexto.length >= 200 ? "complete" : values.contexto ? "partial" : "empty"
      case "conceptos":
        return values.conceptos_clave.length >= 3 ? "complete" : values.conceptos_clave.length > 0 ? "partial" : "empty"
      case "casos":
        return values.casos_estudio.length >= 2 ? "complete" : values.casos_estudio.length > 0 ? "partial" : "empty"
      case "errores":
        return values.errores_comunes.length >= 2 ? "complete" : values.errores_comunes.length > 0 ? "partial" : "empty"
      case "recursos":
        return values.recursos_referencia.length > 0 ? "complete" : "empty"
      case "criterios":
        return values.criterios_evaluacion.length >= 3
          ? "complete"
          : values.criterios_evaluacion.length > 0
            ? "partial"
            : "empty"
      default:
        return "empty"
    }
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "complete") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    if (status === "partial") return <AlertCircle className="h-4 w-4 text-amber-500" />
    return <Circle className="h-4 w-4 text-slate-300" />
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const values = form.getValues()
      values.completitud = completeness
      await onSave(values as FaseDocumentation)
      localStorage.removeItem(`fase-doc-${faseId}`)
    } catch (error) {
      console.error("Error saving draft:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkComplete = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      return
    }

    setIsSaving(true)
    try {
      const values = form.getValues()
      values.completitud = completeness
      await onSave(values as FaseDocumentation)
      localStorage.removeItem(`fase-doc-${faseId}`)
      onClose?.()
    } catch (error) {
      console.error("Error marking complete:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end">
      <div className="bg-white h-full min-w-[800px] max-w-[900px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900">Documentación: {faseNombre}</h2>
            <p className="text-sm text-slate-600 mt-1">Esta documentación será usada por IA para generar contenido</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Completeness indicator */}
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12">
                <svg className="transform -rotate-90 w-12 h-12">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-slate-200"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - completeness / 100)}`}
                    className={
                      completeness >= 80 ? "text-emerald-500" : completeness >= 50 ? "text-amber-500" : "text-slate-400"
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold">{completeness}%</span>
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-slate-900">{completeness}% completado</div>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Accordion type="single" collapsible value={activeSection} onValueChange={setActiveSection}>
            {/* Section 1: Contexto General */}
            <AccordionItem value="contexto" className="border rounded-lg mb-4 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold">Contexto General</span>
                  <Badge variant="secondary" className="ml-2">
                    Requerido
                  </Badge>
                  <StatusIcon status={getSectionStatus("contexto")} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contexto">Contexto de la Fase</Label>
                    <Textarea
                      id="contexto"
                      placeholder="Describe el contexto general, por qué es importante esta fase, qué problema resuelve..."
                      rows={8}
                      {...form.register("contexto")}
                      className="mt-2"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-slate-600">
                        Sé específico. Incluye ejemplos del mundo real. Mínimo 200 caracteres.
                      </p>
                      <span className="text-sm text-slate-500">{form.watch("contexto")?.length || 0} / 200</span>
                    </div>
                    {form.formState.errors.contexto && (
                      <p className="text-sm text-rose-600 mt-1">{form.formState.errors.contexto.message}</p>
                    )}
                  </div>

                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Sparkles className="h-4 w-4" />
                    Sugerir Contexto con IA
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Conceptos Clave */}
            <AccordionItem value="conceptos" className="border rounded-lg mb-4 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold">Conceptos Clave</span>
                  <Badge variant="secondary" className="ml-2">
                    Mínimo 3
                  </Badge>
                  <StatusIcon status={getSectionStatus("conceptos")} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <p className="text-sm text-slate-600 mb-4">
                  Define los conceptos fundamentales que estudiantes deben dominar
                </p>

                <div className="space-y-4">
                  {conceptosFields.map((field, index) => (
                    <Card key={field.id} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Concepto {index + 1}</CardTitle>
                          <Button variant="ghost" size="icon" onClick={() => removeConcepto(index)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label>Nombre del Concepto</Label>
                          <Input
                            placeholder="Ej: Customer-Solution Fit, Jobs-to-be-Done"
                            {...form.register(`conceptos_clave.${index}.nombre`)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Definición</Label>
                          <Textarea
                            placeholder="Define el concepto claramente..."
                            rows={3}
                            {...form.register(`conceptos_clave.${index}.definicion`)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Ejemplo Práctico</Label>
                          <Textarea
                            placeholder="Da un ejemplo concreto de este concepto..."
                            rows={2}
                            {...form.register(`conceptos_clave.${index}.ejemplo`)}
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() =>
                      appendConcepto({
                        id: `ck_${Date.now()}`,
                        nombre: "",
                        definicion: "",
                        ejemplo: "",
                        terminos_relacionados: [],
                      })
                    }
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Concepto
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Casos de Estudio */}
            <AccordionItem value="casos" className="border rounded-lg mb-4 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold">Casos de Estudio</span>
                  <Badge variant="secondary" className="ml-2">
                    Mínimo 2
                  </Badge>
                  <StatusIcon status={getSectionStatus("casos")} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <p className="text-sm text-slate-600 mb-4">Casos reales que ilustran los conceptos de esta fase</p>

                <div className="space-y-4">
                  {casosFields.map((field, index) => (
                    <Card key={field.id} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Caso {index + 1}</CardTitle>
                          <Button variant="ghost" size="icon" onClick={() => removeCaso(index)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label>Título del Caso</Label>
                          <Input
                            placeholder="Ej: Airbnb - De colchones inflables a unicornio"
                            {...form.register(`casos_estudio.${index}.titulo`)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <Select
                            value={form.watch(`casos_estudio.${index}.tipo`)}
                            onValueChange={(value) => form.setValue(`casos_estudio.${index}.tipo`, value as any)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="exito">Caso de Éxito</SelectItem>
                              <SelectItem value="fracaso">Caso de Fracaso (aprendizaje)</SelectItem>
                              <SelectItem value="comparacion">Comparación</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Descripción</Label>
                          <Textarea
                            placeholder="Describe el caso..."
                            rows={6}
                            {...form.register(`casos_estudio.${index}.descripcion`)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Fuente / Referencia (opcional)</Label>
                          <Input
                            placeholder="URL, libro, paper..."
                            {...form.register(`casos_estudio.${index}.fuente`)}
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() =>
                      appendCaso({
                        id: `ce_${Date.now()}`,
                        titulo: "",
                        tipo: "exito",
                        descripcion: "",
                        fuente: "",
                        conceptos_ilustrados: [],
                      })
                    }
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Caso de Estudio
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: Errores Comunes */}
            <AccordionItem value="errores" className="border rounded-lg mb-4 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold">Errores Comunes</span>
                  <Badge variant="secondary" className="ml-2">
                    Mínimo 2
                  </Badge>
                  <StatusIcon status={getSectionStatus("errores")} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <p className="text-sm text-slate-600 mb-4">
                  Errores típicos que cometen estudiantes al abordar esta fase
                </p>

                <div className="space-y-4">
                  {erroresFields.map((field, index) => (
                    <Card key={field.id} className="border-l-4 border-l-amber-500">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <Label>Error {index + 1}</Label>
                          <Button variant="ghost" size="icon" onClick={() => removeError(index)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Ej: Confundir deseo del cliente con necesidad real"
                          {...form.register(`errores_comunes.${index}.titulo`)}
                        />
                        <div>
                          <Label className="text-sm">¿Por qué sucede?</Label>
                          <Textarea
                            rows={2}
                            {...form.register(`errores_comunes.${index}.explicacion`)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">¿Cómo evitarlo?</Label>
                          <Textarea
                            rows={2}
                            {...form.register(`errores_comunes.${index}.como_evitar`)}
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() =>
                      appendError({
                        id: `ec_${Date.now()}`,
                        titulo: "",
                        explicacion: "",
                        como_evitar: "",
                      })
                    }
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Error Común
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: Recursos de Referencia */}
            <AccordionItem value="recursos" className="border rounded-lg mb-4 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Link className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold">Recursos de Referencia</span>
                  <Badge variant="outline" className="ml-2">
                    Opcional
                  </Badge>
                  <StatusIcon status={getSectionStatus("recursos")} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <p className="text-sm text-slate-600 mb-4">Papers, libros, videos, herramientas relevantes</p>

                <div className="space-y-4">
                  {recursosFields.map((field, index) => (
                    <Card key={field.id} className="border-slate-200">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <Label>Recurso {index + 1}</Label>
                          <Button variant="ghost" size="icon" onClick={() => removeRecurso(index)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Título del recurso..."
                          {...form.register(`recursos_referencia.${index}.titulo`)}
                        />
                        <Select
                          value={form.watch(`recursos_referencia.${index}.tipo`)}
                          onValueChange={(value) => form.setValue(`recursos_referencia.${index}.tipo`, value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de recurso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paper">Paper/Artículo</SelectItem>
                            <SelectItem value="libro">Libro</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="herramienta">Herramienta</SelectItem>
                            <SelectItem value="podcast">Podcast</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="https://..."
                          type="url"
                          {...form.register(`recursos_referencia.${index}.url`)}
                        />
                        <Textarea
                          placeholder="Notas (opcional)"
                          rows={2}
                          {...form.register(`recursos_referencia.${index}.notas`)}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() =>
                      appendRecurso({
                        id: `rr_${Date.now()}`,
                        titulo: "",
                        tipo: "paper",
                        url: "",
                        notas: "",
                      })
                    }
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Recurso
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 6: Criterios de Evaluación */}
            <AccordionItem value="criterios" className="border rounded-lg mb-4 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-cyan-600" />
                  <span className="font-semibold">Criterios de Evaluación</span>
                  <Badge variant="secondary" className="ml-2">
                    Mínimo 3
                  </Badge>
                  <StatusIcon status={getSectionStatus("criterios")} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <p className="text-sm text-slate-600 mb-4">Criterios para evaluar si estudiantes dominan esta fase</p>

                <div className="space-y-4">
                  {criteriosFields.map((field, index) => (
                    <Card key={field.id} className="border-slate-200">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Label>Criterio {index + 1}</Label>
                            {form.watch(`criterios_evaluacion.${index}.nivel_importancia`) && (
                              <Badge
                                variant={
                                  form.watch(`criterios_evaluacion.${index}.nivel_importancia`) === "critico"
                                    ? "destructive"
                                    : form.watch(`criterios_evaluacion.${index}.nivel_importancia`) === "importante"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {form.watch(`criterios_evaluacion.${index}.nivel_importancia`)}
                              </Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeCriterio(index)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Ej: Evidencia de validación cuantitativa"
                          {...form.register(`criterios_evaluacion.${index}.nombre`)}
                        />
                        <Textarea
                          placeholder="¿Qué debe demostrar el estudiante?"
                          rows={2}
                          {...form.register(`criterios_evaluacion.${index}.descriptor`)}
                        />
                        <Select
                          value={form.watch(`criterios_evaluacion.${index}.nivel_importancia`)}
                          onValueChange={(value) =>
                            form.setValue(`criterios_evaluacion.${index}.nivel_importancia`, value as any)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Nivel de importancia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critico">Crítico</SelectItem>
                            <SelectItem value="importante">Importante</SelectItem>
                            <SelectItem value="deseable">Deseable</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() =>
                      appendCriterio({
                        id: `cr_${Date.now()}`,
                        nombre: "",
                        descriptor: "",
                        nivel_importancia: "importante",
                      })
                    }
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Criterio
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="border-t bg-white px-6 py-4 flex items-center justify-between sticky bottom-0">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleSaveDraft} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar Borrador
            </Button>

            <Button
              onClick={handleMarkComplete}
              disabled={completeness < 80 || isSaving}
              className="gap-2 bg-cyan-600 hover:bg-cyan-700"
            >
              <CheckSquare className="h-4 w-4" />
              Marcar como Completo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
