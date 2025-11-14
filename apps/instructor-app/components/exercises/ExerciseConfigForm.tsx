"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exerciseInstancesApi } from "@/services/api"
import type { ExerciseTemplateResponse, AddExerciseToProofPointRequest } from "@/types/api"
import { toast } from "sonner"
import { Info } from "lucide-react"

interface ExerciseConfigFormProps {
  template: ExerciseTemplateResponse
  proofPointId: string
  onClose: () => void
  onSuccess: () => void
}

export function ExerciseConfigForm({ template, proofPointId, onClose, onSuccess }: ExerciseConfigFormProps) {
  const isCuadernoTemplate = template.categoria === "cuaderno_trabajo"
  const [formData, setFormData] = useState<AddExerciseToProofPointRequest>({
    templateId: template.id,
    nombre: "",
    descripcionBreve: "",
    consideracionesContexto: "",
    configuracionPersonalizada: template.configuracionDefault || {},
    duracionEstimadaMinutos: 30,
    esObligatorio: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingAndGenerating, setIsSavingAndGenerating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const requiredConfigFields = useMemo(() => {
    return template.configuracionSchema?.required || []
  }, [template])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del ejercicio es obligatorio"
    }

    if (!isCuadernoTemplate && !formData.consideracionesContexto.trim()) {
      newErrors.consideracionesContexto = "Las consideraciones de contexto son obligatorias"
    }

    if (formData.duracionEstimadaMinutos < 1) {
      newErrors.duracion = "La duración mínima es de 1 minuto"
    }

    requiredConfigFields.forEach(field => {
      const value = formData.configuracionPersonalizada[field]
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && !value.trim()) ||
        (Array.isArray(value) && value.length === 0)

      if (isEmpty) {
        newErrors[`config-${field}`] = "Este campo es obligatorio"
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error("Completa los campos obligatorios antes de crear el ejercicio")
      return false
    }

    setErrors({})
    return true
  }

  const handleSave = async (generateAfterSave = false) => {
    if (!validateForm()) {
      return
    }

    if (generateAfterSave) {
      setIsSavingAndGenerating(true)
    } else {
      setIsSaving(true)
    }

    try {
      const payload: AddExerciseToProofPointRequest = {
        templateId: formData.templateId,
        nombre: formData.nombre.trim(),
        descripcionBreve: formData.descripcionBreve?.trim() || undefined,
        consideracionesContexto: formData.consideracionesContexto?.trim() || (isCuadernoTemplate ? "Configuración definida por secciones" : ""),
        configuracionPersonalizada: formData.configuracionPersonalizada,
        duracionEstimadaMinutos: formData.duracionEstimadaMinutos,
        esObligatorio: formData.esObligatorio,
      }

      const createdExercise = await exerciseInstancesApi.create(proofPointId, payload)
      toast.success("Ejercicio creado exitosamente")

      if (generateAfterSave && createdExercise?.id) {
        toast.loading("Generando contenido con IA...", { id: createdExercise.id })
        await exerciseInstancesApi.generateContent(createdExercise.id)
        toast.success("Contenido generado exitosamente", { id: createdExercise.id })
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error creating exercise:", error)
      toast.error(error.message || "Error al crear el ejercicio")
    } finally {
      setIsSaving(false)
      setIsSavingAndGenerating(false)
    }
  }

  const handleConfigChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      configuracionPersonalizada: {
        ...formData.configuracionPersonalizada,
        [key]: value,
      },
    })
  }

  const handleAddSection = (key: string) => {
    const currentSections = formData.configuracionPersonalizada[key] || []
    handleConfigChange(key, [
      ...currentSections,
      { tituloSeccion: "", descripcionPrompt: "", criteriosPrompt: "" },
    ])
  }

  const handleRemoveSection = (key: string, index: number) => {
    const currentSections = formData.configuracionPersonalizada[key] || []
    handleConfigChange(
      key,
      currentSections.filter((_: any, i: number) => i !== index)
    )
  }

  const handleSectionFieldChange = (
    arrayKey: string,
    index: number,
    fieldKey: string,
    value: any
  ) => {
    const currentSections = [...(formData.configuracionPersonalizada[arrayKey] || [])]
    currentSections[index] = {
      ...currentSections[index],
      [fieldKey]: value,
    }
    handleConfigChange(arrayKey, currentSections)
  }

  // Parse schema to render form fields
  const renderConfigFields = () => {
    const schema = template.configuracionSchema
    if (!schema || !schema.properties) {
      return <p className="text-sm text-muted-foreground">No hay configuración adicional disponible.</p>
    }

    return Object.entries(schema.properties).map(([key, fieldSchema]: [string, any]) => {
      const value = formData.configuracionPersonalizada[key] ?? fieldSchema.default ?? ""

      // Text input
      if (fieldSchema.type === "string" && !fieldSchema.enum) {
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {fieldSchema.description || key}
              {schema.required?.includes(key) && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={key}
              value={value}
              onChange={e => handleConfigChange(key, e.target.value)}
              placeholder={fieldSchema.default}
            />
            {errors[`config-${key}`] && (
              <p className="text-xs text-destructive">{errors[`config-${key}`]}</p>
            )}
          </div>
        )
      }

      // Select/Enum
      if (fieldSchema.enum) {
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {fieldSchema.description || key}
              {schema.required?.includes(key) && <span className="text-destructive ml-1">*</span>}
            </Label>
            <select
              id={key}
              value={value}
              onChange={e => handleConfigChange(key, e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {fieldSchema.enum.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors[`config-${key}`] && (
              <p className="text-xs text-destructive">{errors[`config-${key}`]}</p>
            )}
          </div>
        )
      }

      // Number input
      if (fieldSchema.type === "number") {
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {fieldSchema.description || key}
              {schema.required?.includes(key) && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={key}
              type="number"
              min={fieldSchema.minimum}
              max={fieldSchema.maximum}
              value={value}
              onChange={e => handleConfigChange(key, parseInt(e.target.value) || 0)}
            />
            {errors[`config-${key}`] && (
              <p className="text-xs text-destructive">{errors[`config-${key}`]}</p>
            )}
          </div>
        )
      }

      // Boolean checkbox
      if (fieldSchema.type === "boolean") {
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center space-x-2">
              <input
                id={key}
                type="checkbox"
                checked={value}
                onChange={e => handleConfigChange(key, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor={key} className="font-normal">
                {fieldSchema.description || key}
              </Label>
            </div>
            {errors[`config-${key}`] && (
              <p className="text-xs text-destructive">{errors[`config-${key}`]}</p>
            )}
          </div>
        )
      }

      // Array of objects (e.g., secciones)
      if (fieldSchema.type === "array" && fieldSchema.items?.type === "object") {
        const sections = (formData.configuracionPersonalizada[key] as any[]) || []
        const itemProperties = fieldSchema.items.properties || {}

        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {fieldSchema.description || key}
                {schema.required?.includes(key) && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>

            {errors[`config-${key}`] && (
              <p className="text-xs text-destructive">{errors[`config-${key}`]}</p>
            )}

            <div className="space-y-3">
              {sections.map((section: any, idx: number) => (
                <Card key={idx} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Sección {idx + 1}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSection(key, idx)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(itemProperties).map(([fieldKey, fieldDef]: [string, any]) => (
                      <div key={fieldKey} className="space-y-2">
                        <Label htmlFor={`${key}_${idx}_${fieldKey}`} className="text-sm">
                          {fieldDef.description || fieldKey}
                        </Label>
                        <Textarea
                          id={`${key}_${idx}_${fieldKey}`}
                          value={section[fieldKey] || ""}
                          onChange={e =>
                            handleSectionFieldChange(key, idx, fieldKey, e.target.value)
                          }
                          placeholder={fieldDef.description}
                          rows={3}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddSection(key)}
              className="w-full"
            >
              + Añadir Sección
            </Button>
          </div>
        )
      }

      return null
    })
  }

  return (
    <div className="space-y-6 py-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="info">Info del Template</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre del Ejercicio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Introducción a Variables en Python"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcionBreve">Descripción Breve</Label>
            <Textarea
              id="descripcionBreve"
              placeholder="Una breve descripción de lo que cubrirá este ejercicio..."
              rows={2}
              value={formData.descripcionBreve || ""}
              onChange={e => setFormData({ ...formData, descripcionBreve: e.target.value })}
            />
          </div>

          {!isCuadernoTemplate ? (
            <div className="space-y-2">
              <Label htmlFor="consideraciones">
                Consideraciones de Contexto <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="consideraciones"
                placeholder="Información importante para el instructor: objetivos específicos, puntos de atención, contexto pedagógico..."
                rows={4}
                value={formData.consideracionesContexto}
                onChange={e => setFormData({ ...formData, consideracionesContexto: e.target.value })}
              />
              {errors.consideracionesContexto && (
                <p className="text-xs text-destructive">{errors.consideracionesContexto}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Esta información ayuda al sistema de IA a generar contenido más relevante
              </p>
            </div>
          ) : (
            <Card className="border-dashed bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4" />
                  Configuración por secciones
                </div>
                <p className="text-sm text-muted-foreground">
                  Este cuaderno utiliza secciones personalizadas. Define el propósito y la rúbrica de cada
                  sección desde la pestaña <strong>Configuración</strong> para guiar a la IA.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracion">
                Duración Estimada (minutos) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duracion"
                type="number"
                min="1"
                max="480"
                value={formData.duracionEstimadaMinutos}
                onChange={e =>
                  setFormData({ ...formData, duracionEstimadaMinutos: parseInt(e.target.value) || 1 })
                }
              />
              {errors.duracion && <p className="text-xs text-destructive">{errors.duracion}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="obligatorio">Tipo de Ejercicio</Label>
              <select
                id="obligatorio"
                value={formData.esObligatorio ? "obligatorio" : "opcional"}
                onChange={e =>
                  setFormData({ ...formData, esObligatorio: e.target.value === "obligatorio" })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="obligatorio">Obligatorio</option>
                <option value="opcional">Opcional</option>
              </select>
            </div>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuración Específica del Template</CardTitle>
              <CardDescription>
                {isCuadernoTemplate
                  ? "Construye las secciones del cuaderno definiendo propósito y rúbrica para cada una."
                  : "Personaliza los parámetros de este tipo de ejercicio"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderConfigFields()}
              {requiredConfigFields.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Los campos marcados con * son obligatorios para este template.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Info Tab */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Objetivo Pedagógico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{template.objetivoPedagogico}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rol del Asistente IA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{template.rolIA}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Template del Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                {template.promptTemplate}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DialogFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving || isSavingAndGenerating}>
          Cancelar
        </Button>
        <Button onClick={() => handleSave()} disabled={isSaving || isSavingAndGenerating}>
          {isSaving ? "Creando..." : "Crear Ejercicio"}
        </Button>
        <Button
          onClick={() => handleSave(true)}
          disabled={isSaving || isSavingAndGenerating}
          variant="secondary"
        >
          {isSavingAndGenerating ? "Creando y Generando..." : "Crear y Generar"}
        </Button>
      </DialogFooter>
    </div>
  )
}
