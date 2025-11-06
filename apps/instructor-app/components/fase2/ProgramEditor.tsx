"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

// Esquema de validación con Zod
const programaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().min(50, "La descripción debe tener al menos 50 caracteres"),
  categoria: z.string().min(1, "La categoría es requerida"),
  duracion_semanas: z.number().min(1, "Mínimo 1 semana").max(52, "Máximo 52 semanas"),
  nivel_dificultad: z.enum(["principiante", "intermedio", "avanzado"]),
  imagen_portada_url: z.string().optional(),
  objetivos_aprendizaje: z
    .array(z.string().min(1))
    .min(3, "Debe haber al menos 3 objetivos de aprendizaje"),
  prerequisitos: z.array(z.string()),
  audiencia_objetivo: z.string().min(1, "La audiencia objetivo es requerida"),
  tags: z.array(z.string()),
  visible: z.boolean(),
  estado: z.enum(["borrador", "revision", "publicado"]),
})

type ProgramaFormData = z.infer<typeof programaSchema>

interface ProgramEditorProps {
  programaId: string
  programaActual: any
  onSave: (programa: any) => Promise<void>
  onCancel: () => void
}

export function ProgramEditor({ programaId, programaActual, onSave, onCancel }: ProgramEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(programaActual?.imagen_portada_url || null)
  const [newTag, setNewTag] = useState("")
  const [newPrerequisito, setNewPrerequisito] = useState("")

  const form = useForm<ProgramaFormData>({
    resolver: zodResolver(programaSchema),
    defaultValues: {
      nombre: programaActual?.nombre || "",
      descripcion: programaActual?.descripcion || "",
      categoria: programaActual?.categoria || "",
      duracion_semanas: programaActual?.duracion_semanas || 4,
      nivel_dificultad: programaActual?.nivel_dificultad || "principiante",
      imagen_portada_url: programaActual?.imagen_portada_url || "",
      objetivos_aprendizaje: programaActual?.objetivos_aprendizaje || ["", "", ""],
      prerequisitos: programaActual?.prerequisitos || [],
      audiencia_objetivo: programaActual?.audiencia_objetivo || "",
      tags: programaActual?.tags || [],
      visible: programaActual?.visible ?? true,
      estado: programaActual?.estado || "borrador",
    },
  })

  // Auto-save a localStorage cada 30 segundos
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true)
    })

    const autoSaveInterval = setInterval(() => {
      const values = form.getValues()
      localStorage.setItem(`program-editor-${programaId}`, JSON.stringify(values))
      console.log("Auto-saved to localStorage")
    }, 30000)

    // Recuperar datos guardados
    const saved = localStorage.getItem(`program-editor-${programaId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // No sobrescribir si el usuario ya hizo cambios
        if (!hasUnsavedChanges) {
          Object.keys(parsed).forEach((key) => {
            form.setValue(key as any, parsed[key])
          })
          toast.info("Se recuperaron cambios no guardados")
        }
      } catch (e) {
        console.error("Error parsing saved data:", e)
      }
    }

    return () => {
      subscription.unsubscribe()
      clearInterval(autoSaveInterval)
    }
  }, [form, programaId])

  const onSubmit = async (data: ProgramaFormData) => {
    console.log("onSubmit called with data:", data)
    setIsSaving(true)
    try {
      // Solo enviar los campos del formulario, no incluir campos de metadata
      await onSave(data)
      localStorage.removeItem(`program-editor-${programaId}`)
      setHasUnsavedChanges(false)
      toast.success("Programa guardado exitosamente")
    } catch (error) {
      toast.error("Error al guardar el programa")
      console.error("Error saving:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveClick = async () => {
    console.log("Save button clicked")
    console.log("Form errors:", form.formState.errors)
    console.log("Form values:", form.getValues())

    // Trigger validation manually
    const isValid = await form.trigger()
    console.log("Form is valid:", isValid)

    if (isValid) {
      await form.handleSubmit(onSubmit)()
    } else {
      toast.error("Por favor corrige los errores en el formulario")
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true)
    } else {
      onCancel()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        form.setValue("imagen_portada_url", result, { shouldDirty: true })
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = form.getValues("tags")
      form.setValue("tags", [...currentTags, newTag.trim()], { shouldDirty: true })
      setNewTag("")
    }
  }

  const removeTag = (index: number) => {
    const currentTags = form.getValues("tags")
    form.setValue(
      "tags",
      currentTags.filter((_, i) => i !== index),
      { shouldDirty: true }
    )
  }

  const addPrerequisito = () => {
    if (newPrerequisito.trim()) {
      const currentPrereqs = form.getValues("prerequisitos")
      form.setValue("prerequisitos", [...currentPrereqs, newPrerequisito.trim()], { shouldDirty: true })
      setNewPrerequisito("")
    }
  }

  const removePrerequisito = (index: number) => {
    const currentPrereqs = form.getValues("prerequisitos")
    form.setValue(
      "prerequisitos",
      currentPrereqs.filter((_, i) => i !== index),
      { shouldDirty: true }
    )
  }

  const descripcionLength = form.watch("descripcion")?.length || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Editar: {programaActual?.nombre}</h1>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Cambios sin guardar
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveClick} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Mostrar errores de validación */}
        {Object.keys(form.formState.errors).length > 0 && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Errores de validación</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(form.formState.errors).map(([key, error]) => (
                  <li key={key} className="text-sm text-destructive">
                    {key}: {error?.message?.toString()}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos generales del programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del Programa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Xpertia Emprendedor"
                  {...form.register("nombre")}
                  className={form.formState.errors.nombre ? "border-destructive" : ""}
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="descripcion">
                    Descripción <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className={`text-xs ${descripcionLength < 50 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {descripcionLength} / 50 caracteres mínimo
                  </span>
                </div>
                <Textarea
                  id="descripcion"
                  rows={4}
                  placeholder="Describe el programa..."
                  {...form.register("descripcion")}
                  className={form.formState.errors.descripcion ? "border-destructive" : ""}
                />
                {form.formState.errors.descripcion && (
                  <p className="text-sm text-destructive">{form.formState.errors.descripcion.message}</p>
                )}
              </div>

              {/* Imagen de Portada */}
              <div className="space-y-2">
                <Label htmlFor="imagen_portada">Imagen de Portada</Label>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <div className="relative h-32 w-48 rounded-lg border overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        id="imagen_portada"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("imagen_portada")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Imagen
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Formatos: .jpg, .png (máx. 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Categoría */}
                <div className="space-y-2">
                  <Label htmlFor="categoria">
                    Categoría <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.watch("categoria")} onValueChange={(value) => form.setValue("categoria", value)}>
                    <SelectTrigger className={form.formState.errors.categoria ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Emprendimiento">Emprendimiento</SelectItem>
                      <SelectItem value="Liderazgo">Liderazgo</SelectItem>
                      <SelectItem value="Innovación">Innovación</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoria && (
                    <p className="text-sm text-destructive">{form.formState.errors.categoria.message}</p>
                  )}
                </div>

                {/* Duración */}
                <div className="space-y-2">
                  <Label htmlFor="duracion_semanas">
                    Duración Estimada <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="duracion_semanas"
                      type="number"
                      min={1}
                      max={52}
                      {...form.register("duracion_semanas", { valueAsNumber: true })}
                      className={form.formState.errors.duracion_semanas ? "border-destructive" : ""}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">semanas</span>
                  </div>
                  {form.formState.errors.duracion_semanas && (
                    <p className="text-sm text-destructive">{form.formState.errors.duracion_semanas.message}</p>
                  )}
                </div>

                {/* Nivel de Dificultad */}
                <div className="space-y-2">
                  <Label htmlFor="nivel_dificultad">
                    Nivel de Dificultad <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.watch("nivel_dificultad")}
                    onValueChange={(value: any) => form.setValue("nivel_dificultad", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principiante">Principiante</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audiencia */}
          <Card>
            <CardHeader>
              <CardTitle>Audiencia y Prerequisitos</CardTitle>
              <CardDescription>Define para quién es este programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Audiencia Objetivo */}
              <div className="space-y-2">
                <Label htmlFor="audiencia_objetivo">
                  Audiencia Objetivo <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="audiencia_objetivo"
                  rows={2}
                  placeholder="Ej: Emprendedores en etapa de validación..."
                  {...form.register("audiencia_objetivo")}
                  className={form.formState.errors.audiencia_objetivo ? "border-destructive" : ""}
                />
                {form.formState.errors.audiencia_objetivo && (
                  <p className="text-sm text-destructive">{form.formState.errors.audiencia_objetivo.message}</p>
                )}
              </div>

              {/* Prerequisitos */}
              <div className="space-y-2">
                <Label>Prerequisitos</Label>
                <p className="text-sm text-muted-foreground">
                  Conocimientos o experiencias previas necesarias
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Escribe un prerequisito..."
                    value={newPrerequisito}
                    onChange={(e) => setNewPrerequisito(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addPrerequisito()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addPrerequisito}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch("prerequisitos")?.map((prereq, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {prereq}
                      <button
                        type="button"
                        onClick={() => removePrerequisito(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Objetivos de Aprendizaje */}
              <div className="space-y-2">
                <Label>
                  Objetivos de Aprendizaje <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">Mínimo 3 objetivos</p>
                <div className="space-y-3">
                  {form.watch("objetivos_aprendizaje")?.map((_, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Input
                        placeholder={`Objetivo ${index + 1}...`}
                        {...form.register(`objetivos_aprendizaje.${index}` as const)}
                      />
                      {form.watch("objetivos_aprendizaje").length > 3 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const currentObjetivos = form.getValues("objetivos_aprendizaje")
                            form.setValue(
                              "objetivos_aprendizaje",
                              currentObjetivos.filter((_, i) => i !== index),
                              { shouldDirty: true }
                            )
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentObjetivos = form.getValues("objetivos_aprendizaje")
                    form.setValue("objetivos_aprendizaje", [...currentObjetivos, ""], { shouldDirty: true })
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Objetivo
                </Button>
                {form.formState.errors.objetivos_aprendizaje && (
                  <p className="text-sm text-destructive">{form.formState.errors.objetivos_aprendizaje.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clasificación */}
          <Card>
            <CardHeader>
              <CardTitle>Clasificación</CardTitle>
              <CardDescription>Etiquetas para búsqueda y categorización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Etiquetas (Tags)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Agrega tags..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch("tags")?.map((tag, index) => (
                    <Badge key={index} className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1 hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publicación */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Publicación</CardTitle>
              <CardDescription>Controla la visibilidad y estado del programa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visible */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="visible">Visible para Instructores</Label>
                  <p className="text-sm text-muted-foreground">Si desactivas, solo tú podrás ver este programa</p>
                </div>
                <Switch
                  id="visible"
                  checked={form.watch("visible")}
                  onCheckedChange={(checked) => form.setValue("visible", checked)}
                />
              </div>

              <Separator />

              {/* Estado */}
              <div className="space-y-3">
                <Label>Estado del Programa</Label>
                <RadioGroup
                  value={form.watch("estado")}
                  onValueChange={(value: any) => form.setValue("estado", value)}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent">
                    <RadioGroupItem value="borrador" id="estado-borrador" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="estado-borrador" className="font-semibold cursor-pointer">
                        Borrador
                      </Label>
                      <p className="text-sm text-muted-foreground">En construcción</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent">
                    <RadioGroupItem value="revision" id="estado-revision" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="estado-revision" className="font-semibold cursor-pointer">
                        En Revisión
                      </Label>
                      <p className="text-sm text-muted-foreground">Listo para revisar</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent">
                    <RadioGroupItem value="publicado" id="estado-publicado" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="estado-publicado" className="font-semibold cursor-pointer">
                        Publicado
                      </Label>
                      <p className="text-sm text-muted-foreground">Disponible para crear cohortes</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          {programaActual?.estadisticas && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Estadísticas de Uso</CardTitle>
                </div>
                <CardDescription>Información sobre el uso del programa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {programaActual.estadisticas?.cohortes_activas || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Cohortes Creadas</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-500/10 p-3">
                      <Users className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Estudiantes Totales</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">—</div>
                      <div className="text-sm text-muted-foreground">Tasa Completación</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/10 p-3">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">—</div>
                      <div className="text-sm text-muted-foreground">Score Promedio</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>

      {/* Diálogo de confirmación de cancelación */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si cancelas, estos cambios se perderán. Los cambios guardados en localStorage
              se mantendrán para la próxima vez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir Editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCancelDialog(false)
                onCancel()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar Cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
