"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, Eye, Plus, Edit3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/services/api/client"
import type {
  ExerciseTemplateResponse,
  ExerciseInstanceResponse,
} from "@/types/api"

interface ExerciseWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ExerciseTemplateResponse | null
  proofPointId: string
  existingInstance?: ExerciseInstanceResponse | null
  onSuccess: () => void
  isTemplateLoading?: boolean
}

export function ExerciseWizardDialog({
  open,
  onOpenChange,
  template,
  proofPointId,
  existingInstance,
  onSuccess,
  isTemplateLoading = false,
}: ExerciseWizardDialogProps) {
  const isEditing = !!existingInstance
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingAndGenerating, setIsSubmittingAndGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("basico")

  // Form state
  const [nombre, setNombre] = useState("")
  const [descripcionBreve, setDescripcionBreve] = useState("")
  const [consideraciones, setConsideraciones] = useState("")
  const [configuracion, setConfiguracion] = useState<Record<string, any>>({})
  const [duracion, setDuracion] = useState(20)
  const [esObligatorio, setEsObligatorio] = useState(true)

  // Initialize form when template or existingInstance changes
  useEffect(() => {
    if (existingInstance) {
      // Load existing instance data
      setNombre(existingInstance.nombre)
      setDescripcionBreve(existingInstance.descripcionBreve || "")
      setConsideraciones(existingInstance.consideracionesContexto || "")
      setConfiguracion(existingInstance.configuracionPersonalizada || {})
      setDuracion(existingInstance.duracionEstimadaMinutos)
      setEsObligatorio(existingInstance.esObligatorio)
    } else if (template) {
      // Load template defaults for new instance
      setNombre(template.nombre)
      setDescripcionBreve("")
      setConsideraciones("")
      setConfiguracion(template.configuracionDefault || {})

      // Get default duration from config
      const defaultDuration = template.configuracionDefault?.duracion_minutos || 20
      setDuracion(defaultDuration)
      setEsObligatorio(true)
    }
  }, [template, existingInstance])

  const handleSubmit = async (generateAfterSave: boolean = false) => {
    if (!template && !existingInstance) return

    // Validation
    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del ejercicio es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (generateAfterSave) {
      setIsSubmittingAndGenerating(true)
    } else {
      setIsSubmitting(true)
    }

    let createdInstanceId: string | null = null

    try {
      if (isEditing && existingInstance) {
        // Update existing exercise
        await apiClient.put(`/exercises/${encodeURIComponent(existingInstance.id)}`, {
          nombre: nombre.trim(),
          descripcionBreve: descripcionBreve.trim() || undefined,
          consideracionesContexto: consideraciones.trim() || undefined,
          configuracionPersonalizada: configuracion,
          duracionEstimadaMinutos: duracion,
        })

        toast({
          title: "Ejercicio actualizado",
          description: "Los cambios se guardaron exitosamente",
        })
        createdInstanceId = existingInstance.id
      } else {
        // Create new exercise
        const newInstance = await apiClient.post<ExerciseInstanceResponse>(`/proof-points/${encodeURIComponent(proofPointId)}/exercises`, {
          templateId: template?.id,
          nombre: nombre.trim(),
          descripcionBreve: descripcionBreve.trim() || undefined,
          consideracionesContexto: consideraciones.trim() || undefined,
          configuracionPersonalizada: configuracion,
          duracionEstimadaMinutos: duracion,
          esObligatorio,
        })

        createdInstanceId = newInstance.id

        toast({
          title: "Ejercicio agregado",
          description: "El ejercicio se agregó exitosamente al proof point",
        })
      }

      if (generateAfterSave && createdInstanceId) {
        toast({
          title: "Generando contenido...",
          description: "Iniciando la generación con IA.",
        })

        await apiClient.post(`/exercises/${encodeURIComponent(createdInstanceId)}/generate`, {
          forceRegenerate: false,
        })

        toast({
          title: "Ejercicio generado",
          description: "El contenido se generó exitosamente con IA",
        })
      }

      onSuccess()
      onOpenChange(false)

      // Reset form
      if (!isEditing) {
        setNombre("")
        setDescripcionBreve("")
        setConsideraciones("")
        setActiveTab("basico")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || (isEditing ? "No se pudo actualizar el ejercicio" : "No se pudo crear el ejercicio"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsSubmittingAndGenerating(false)
    }
  }

  const handleConfigChange = (key: string, value: any) => {
    setConfiguracion((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleAddSection = (key: string) => {
    const currentSections = (configuracion[key] as any[]) || []
    handleConfigChange(key, [
      ...currentSections,
      { tituloSeccion: "", descripcionPrompt: "", criteriosPrompt: "" },
    ])
  }

  const handleRemoveSection = (key: string, index: number) => {
    const currentSections = (configuracion[key] as any[]) || []
    handleConfigChange(
      key,
      currentSections.filter((_, i) => i !== index),
    )
  }

  const handleSectionFieldChange = (
    arrayKey: string,
    index: number,
    fieldKey: string,
    value: any,
  ) => {
    const currentSections = [...((configuracion[arrayKey] as any[]) || [])]
    currentSections[index] = {
      ...currentSections[index],
      [fieldKey]: value,
    }
    handleConfigChange(arrayKey, currentSections)
  }

  const renderConfigFields = () => {
    if (isEditing && !template) {
      if (isTemplateLoading) {
        return (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando configuración del ejercicio...
          </p>
        )
      }

      return (
        <p className="text-sm text-muted-foreground">
          No se pudo cargar la configuración personalizada de este ejercicio.
        </p>
      )
    }

    const schema = template?.configuracionSchema

    if (!schema || !schema.properties) {
      return (
        <p className="text-sm text-muted-foreground">
          Este tipo de ejercicio no tiene configuración adicional
        </p>
      )
    }

    return Object.entries(schema.properties).map(([key, fieldSchema]: [string, any]) => {
      const value = configuracion[key] ?? fieldSchema.default ?? ""

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
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={fieldSchema.default}
            />
          </div>
        )
      }

      if (fieldSchema.enum) {
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {fieldSchema.description || key}
              {schema.required?.includes(key) && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleConfigChange(key, val)}>
              <SelectTrigger id={key}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldSchema.enum.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }

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
              onChange={(e) =>
                handleConfigChange(key, e.target.value ? parseInt(e.target.value, 10) : 0)
              }
            />
          </div>
        )
      }

      if (fieldSchema.type === "boolean") {
        return (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key}>{fieldSchema.description || key}</Label>
            <Switch
              id={key}
              checked={!!value}
              onCheckedChange={(checked) => handleConfigChange(key, checked)}
            />
          </div>
        )
      }

      if (fieldSchema.type === "array" && fieldSchema.items?.type === "object") {
        const sections = (configuracion[key] as any[]) || []
        const itemProperties = fieldSchema.items.properties || {}

        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {fieldSchema.description || key}
                {schema.required?.includes(key) && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Button variant="outline" size="sm" onClick={() => handleAddSection(key)}>
                + Añadir sección
              </Button>
            </div>

            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aún no has configurado secciones para este cuaderno.
              </p>
            )}

            <div className="space-y-3">
              {sections.map((section: any, idx: number) => (
                <Card key={`${key}-${idx}`} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Sección {idx + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveSection(key, idx)}
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
                          onChange={(e) =>
                            handleSectionFieldChange(key, idx, fieldKey, e.target.value)
                          }
                          placeholder={fieldDef.description}
                          rows={3}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      }

      return null
    })
  }

  if (!template && !existingInstance) return null

  const dialogTitle = isEditing ? `Editar Ejercicio: ${nombre}` : `Configurar: ${template?.nombre}`
  const dialogDescription = isEditing
    ? "Modifica la configuración del ejercicio"
    : template?.objetivoPedagogico
  const accentColor = template?.color ?? "#94a3b8"
  const accentIcon = template?.icono ?? "📘"
  const previewAccentBackground = `${accentColor}20`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span style={{ color: accentColor }}>{accentIcon}</span>
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="configuracion">Configuración</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Tab: Básico */}
            <TabsContent value="basico" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del ejercicio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Lección sobre Metodologías de Validación"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción breve (opcional)</Label>
                <Input
                  id="descripcion"
                  placeholder="Breve descripción del ejercicio"
                  value={descripcionBreve}
                  onChange={(e) => setDescripcionBreve(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracion">Duración estimada (minutos)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="duracion"
                    min={5}
                    max={120}
                    step={5}
                    value={[duracion]}
                    onValueChange={([val]) => setDuracion(val)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12 text-right">{duracion} min</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="obligatorio">Ejercicio obligatorio</Label>
                  <p className="text-sm text-muted-foreground">
                    Los estudiantes deben completarlo para avanzar
                  </p>
                </div>
                <Switch
                  id="obligatorio"
                  checked={esObligatorio}
                  onCheckedChange={setEsObligatorio}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consideraciones">
                  Consideraciones del contexto
                </Label>
                <Textarea
                  id="consideraciones"
                  placeholder="Ej: Enfatizar la diferencia entre validación y verificación. Incluir ejemplos de Airbnb y Dropbox."
                  value={consideraciones}
                  onChange={(e) => setConsideraciones(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="inline h-3 w-3 mr-1" />
                  Estas consideraciones se usarán al generar el contenido con IA
                </p>
              </div>
            </TabsContent>

            {/* Tab: Configuración */}
            <TabsContent value="configuracion" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuración del ejercicio</CardTitle>
                  <CardDescription>
                    Personaliza los parámetros específicos de este tipo de ejercicio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">{renderConfigFields()}</CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Preview */}
            <TabsContent value="preview" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vista previa</CardTitle>
                  <CardDescription>
                    Así se verá el ejercicio para los estudiantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: previewAccentBackground }}
                      >
                        <span style={{ fontSize: "2rem" }}>{accentIcon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {nombre || template?.nombre || "Ejercicio sin título"}
                        </h3>
                        {descripcionBreve && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {descripcionBreve}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Badge variant="outline">{duracion} minutos</Badge>
                          {esObligatorio && (
                            <Badge variant="secondary">Obligatorio</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {consideraciones && (
                      <div className="bg-background p-3 rounded border">
                        <p className="text-xs font-medium mb-1">Consideraciones del instructor:</p>
                        <p className="text-xs text-muted-foreground">{consideraciones}</p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>Configuración:</strong>
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(configuracion).map(([key, value]) => (
                          <div key={key} className="bg-background p-2 rounded">
                            <span className="font-medium">{key}:</span>{" "}
                            <span className="text-muted-foreground">
                              {JSON.stringify(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isSubmittingAndGenerating}
          >
            Cancelar
          </Button>
          <Button onClick={() => handleSubmit()} disabled={isSubmitting || isSubmittingAndGenerating}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Guardando..." : "Agregando..."}
              </>
            ) : (
              <>
                {isEditing ? (
                  <>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Ejercicio
                  </>
                )}
              </>
            )}
          </Button>
          {!isEditing && (
            <Button onClick={() => handleSubmit(true)} disabled={isSubmitting || isSubmittingAndGenerating}>
              {isSubmittingAndGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando y Generando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Guardar y Generar
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
