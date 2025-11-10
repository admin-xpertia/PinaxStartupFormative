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
import { Loader2, Sparkles, Eye, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExerciseTemplate {
  id: string
  nombre: string
  categoria: string
  descripcion: string
  objetivo_pedagogico: string
  rol_ia: string
  icono: string
  color: string
  configuracion_schema?: Record<string, ConfigField> | null
  configuracion_default?: Record<string, any> | null
}

interface ConfigField {
  type: "number" | "string" | "boolean" | "select" | "multiselect"
  label: string
  default?: any
  min?: number
  max?: number
  options?: string[]
}

interface ExerciseWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ExerciseTemplate | null
  proofPointId: string
  onSuccess: () => void
}

export function ExerciseWizardDialog({
  open,
  onOpenChange,
  template,
  proofPointId,
  onSuccess,
}: ExerciseWizardDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basico")

  // Form state
  const [nombre, setNombre] = useState("")
  const [descripcionBreve, setDescripcionBreve] = useState("")
  const [consideraciones, setConsideraciones] = useState("")
  const [configuracion, setConfiguracion] = useState<Record<string, any>>({})
  const [duracion, setDuracion] = useState(20)
  const [esObligatorio, setEsObligatorio] = useState(true)

  // Initialize form when template changes
  useEffect(() => {
    if (template) {
      setNombre(template.nombre)
      setDescripcionBreve("")
      setConsideraciones("")
      setConfiguracion(template.configuracion_default || {})

      // Get default duration from config
      const defaultDuration = template.configuracion_default?.duracion_minutos || 20
      setDuracion(defaultDuration)
      setEsObligatorio(true)
    }
  }, [template])

  const handleSubmit = async () => {
    if (!template) return

    // Validation
    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del ejercicio es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/v1/proof-points/${proofPointId}/exercises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          nombre: nombre.trim(),
          descripcionBreve: descripcionBreve.trim() || undefined,
          consideracionesContexto: consideraciones.trim() || undefined,
          configuracionPersonalizada: configuracion,
          duracionEstimadaMinutos: duracion,
          esObligatorio,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error al crear el ejercicio")
      }

      toast({
        title: "Ejercicio agregado",
        description: "El ejercicio se agregó exitosamente al proof point",
      })

      onSuccess()
      onOpenChange(false)

      // Reset form
      setNombre("")
      setDescripcionBreve("")
      setConsideraciones("")
      setActiveTab("basico")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el ejercicio",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateConfigValue = (key: string, value: any) => {
    setConfiguracion((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const renderConfigField = (key: string, field: ConfigField) => {
    const value = configuracion[key] ?? field.default

    switch (field.type) {
      case "number":
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={key}>{field.label}</Label>
              <span className="text-sm text-muted-foreground">{value}</span>
            </div>
            <Slider
              id={key}
              min={field.min || 0}
              max={field.max || 100}
              step={1}
              value={[value]}
              onValueChange={([newValue]) => updateConfigValue(key, newValue)}
            />
          </div>
        )

      case "boolean":
        return (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key}>{field.label}</Label>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={(checked) => updateConfigValue(key, checked)}
            />
          </div>
        )

      case "select":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{field.label}</Label>
            <Select value={value} onValueChange={(val) => updateConfigValue(key, val)}>
              <SelectTrigger id={key}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "multiselect":
        return (
          <div key={key} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => {
                const isSelected = Array.isArray(value) && value.includes(option)
                return (
                  <Badge
                    key={option}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = Array.isArray(value) ? value : []
                      const newValue = isSelected
                        ? current.filter((v) => v !== option)
                        : [...current, option]
                      updateConfigValue(key, newValue)
                    }}
                  >
                    {option}
                  </Badge>
                )
              })}
            </div>
          </div>
        )

      case "string":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{field.label}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) => updateConfigValue(key, e.target.value)}
            />
          </div>
        )

      default:
        return null
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span style={{ color: template.color }}>{template.icono}</span>
            Configurar: {template.nombre}
          </DialogTitle>
          <DialogDescription>{template.objetivo_pedagogico}</DialogDescription>
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
                <CardContent className="space-y-4">
                  {template.configuracion_schema && Object.entries(template.configuracion_schema).map(([key, field]) =>
                    renderConfigField(key, field)
                  )}

                  {(!template.configuracion_schema || Object.keys(template.configuracion_schema).length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Este tipo de ejercicio no tiene configuración adicional
                    </p>
                  )}
                </CardContent>
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
                        style={{ backgroundColor: `${template.color}20` }}
                      >
                        <span style={{ fontSize: "2rem" }}>{template.icono}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{nombre || template.nombre}</h3>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ejercicio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
