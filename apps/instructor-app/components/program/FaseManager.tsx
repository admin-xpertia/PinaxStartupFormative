"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, GripVertical, Clock, Target } from "lucide-react"
import { fasesApi } from "@/services/api"
import type { FaseResponse, AddFaseRequest } from "@/types/api"
import { toast } from "sonner"

interface FaseManagerProps {
  programId: string
  onFaseCreated?: (fase: FaseResponse) => void
  onFaseUpdated?: (fase: FaseResponse) => void
  onFaseDeleted?: (faseId: string) => void
}

interface FaseFormData extends AddFaseRequest {
  objetivosAprendizajeText?: string
}

export function FaseManager({ programId, onFaseCreated, onFaseUpdated, onFaseDeleted }: FaseManagerProps) {
  const [fases, setFases] = useState<FaseResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFase, setEditingFase] = useState<FaseResponse | null>(null)
  const [formData, setFormData] = useState<FaseFormData>({
    nombre: "",
    descripcion: "",
    objetivosAprendizaje: [],
    duracionSemanasEstimada: 1,
    objetivosAprendizajeText: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // Load fases
  useEffect(() => {
    loadFases()
  }, [programId])

  const loadFases = async () => {
    try {
      setIsLoading(true)
      const data = await fasesApi.getByProgram(programId)
      setFases(data)
    } catch (error) {
      console.error("Error loading fases:", error)
      toast.error("Error al cargar las fases")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (fase?: FaseResponse) => {
    if (fase) {
      setEditingFase(fase)
      setFormData({
        nombre: fase.nombre,
        descripcion: fase.descripcion,
        objetivosAprendizaje: fase.objetivosAprendizaje || [],
        duracionSemanasEstimada: fase.duracionSemanasEstimada,
        objetivosAprendizajeText: (fase.objetivosAprendizaje || []).join("\n"),
      })
    } else {
      setEditingFase(null)
      setFormData({
        nombre: "",
        descripcion: "",
        objetivosAprendizaje: [],
        duracionSemanasEstimada: 1,
        objetivosAprendizajeText: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingFase(null)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.nombre.trim()) {
      toast.error("El nombre de la fase es requerido")
      return
    }

    if (!formData.descripcion.trim()) {
      toast.error("La descripción de la fase es requerida")
      return
    }

    if (formData.duracionSemanasEstimada < 1) {
      toast.error("La duración debe ser al menos 1 semana")
      return
    }

    setIsSaving(true)

    try {
      const payload: AddFaseRequest = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        objetivosAprendizaje: formData.objetivosAprendizajeText
          ? formData.objetivosAprendizajeText.split("\n").filter(o => o.trim())
          : [],
        duracionSemanasEstimada: formData.duracionSemanasEstimada,
      }

      if (editingFase) {
        // Update existing fase
        const updated = await fasesApi.update(editingFase.id, payload)
        setFases(fases.map(f => (f.id === updated.id ? updated : f)))
        toast.success("Fase actualizada exitosamente")
        onFaseUpdated?.(updated)
      } else {
        // Create new fase
        const created = await fasesApi.create(programId, payload)
        setFases([...fases, created])
        toast.success("Fase creada exitosamente")
        onFaseCreated?.(created)
      }

      handleCloseDialog()
    } catch (error: any) {
      console.error("Error saving fase:", error)
      toast.error(error.message || "Error al guardar la fase")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (faseId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta fase? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      await fasesApi.delete(faseId)
      setFases(fases.filter(f => f.id !== faseId))
      toast.success("Fase eliminada exitosamente")
      onFaseDeleted?.(faseId)
    } catch (error: any) {
      console.error("Error deleting fase:", error)
      toast.error(error.message || "Error al eliminar la fase")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando fases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fases del Programa</h3>
          <p className="text-sm text-muted-foreground">
            {fases.length === 0
              ? "No hay fases creadas aún"
              : `${fases.length} fase${fases.length !== 1 ? "s" : ""} configurada${fases.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Fase
        </Button>
      </div>

      {/* Fases List */}
      {fases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center mb-4">
              Las fases organizan tu programa en bloques temáticos de aprendizaje.
              <br />
              Cada fase puede contener múltiples proof points.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Fase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fases.map((fase, index) => (
            <Card key={fase.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 cursor-grab">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Fase {index + 1}</Badge>
                        <CardTitle className="text-base">{fase.nombre}</CardTitle>
                      </div>
                      <CardDescription>{fase.descripcion}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(fase)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(fase.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{fase.duracionSemanasEstimada} semanas</span>
                  </div>
                  {fase.objetivosAprendizaje && fase.objetivosAprendizaje.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{fase.objetivosAprendizaje.length} objetivos</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFase ? "Editar Fase" : "Crear Nueva Fase"}</DialogTitle>
            <DialogDescription>
              {editingFase
                ? "Modifica la información de la fase."
                : "Define un nuevo bloque temático de aprendizaje para tu programa."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre de la Fase <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Fundamentos de Programación"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descripcion"
                placeholder="Describe el enfoque y contenido de esta fase..."
                rows={3}
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            {/* Duración */}
            <div className="space-y-2">
              <Label htmlFor="duracion">
                Duración Estimada (semanas) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="duracion"
                type="number"
                min="1"
                max="52"
                value={formData.duracionSemanasEstimada}
                onChange={e =>
                  setFormData({ ...formData, duracionSemanasEstimada: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            {/* Objetivos de Aprendizaje */}
            <div className="space-y-2">
              <Label htmlFor="objetivos">Objetivos de Aprendizaje</Label>
              <Textarea
                id="objetivos"
                placeholder="Escribe un objetivo por línea&#10;Ej: Comprender variables y tipos de datos&#10;Dominar estructuras de control"
                rows={5}
                value={formData.objetivosAprendizajeText}
                onChange={e =>
                  setFormData({ ...formData, objetivosAprendizajeText: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Escribe un objetivo por línea. Estos aparecerán como lista en la fase.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : editingFase ? "Guardar Cambios" : "Crear Fase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
