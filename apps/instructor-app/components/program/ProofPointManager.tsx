"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, GripVertical, Clock, HelpCircle, Package, BookOpen } from "lucide-react"
import { proofPointsApi } from "@/services/api"
import type { ProofPointResponse, AddProofPointRequest } from "@/types/api"
import { toast } from "sonner"
import Link from "next/link"

interface ProofPointManagerProps {
  programId: string
  faseId: string
  faseName: string
  onProofPointCreated?: (proofPoint: ProofPointResponse) => void
  onProofPointUpdated?: (proofPoint: ProofPointResponse) => void
  onProofPointDeleted?: (proofPointId: string) => void
}

interface ProofPointFormData extends AddProofPointRequest {
  prerequisitosText?: string
}

export function ProofPointManager({
  programId,
  faseId,
  faseName,
  onProofPointCreated,
  onProofPointUpdated,
  onProofPointDeleted,
}: ProofPointManagerProps) {
  const [proofPoints, setProofPoints] = useState<ProofPointResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProofPoint, setEditingProofPoint] = useState<ProofPointResponse | null>(null)
  const [formData, setFormData] = useState<ProofPointFormData>({
    nombre: "",
    slug: "",
    descripcion: "",
    preguntaCentral: "",
    duracionEstimadaHoras: 2,
    tipoEntregableFinal: "",
    documentacionContexto: "",
    prerequisitos: [],
    prerequisitosText: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // Load proof points
  useEffect(() => {
    loadProofPoints()
  }, [faseId])

  const loadProofPoints = async () => {
    try {
      setIsLoading(true)
      const data = await proofPointsApi.getByFase(faseId)
      setProofPoints(data)
    } catch (error) {
      console.error("Error loading proof points:", error)
      toast.error("Error al cargar los proof points")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (proofPoint?: ProofPointResponse) => {
    if (proofPoint) {
      setEditingProofPoint(proofPoint)
      setFormData({
        nombre: proofPoint.nombre,
        slug: proofPoint.slug,
        descripcion: proofPoint.descripcion,
        preguntaCentral: proofPoint.preguntaCentral,
        duracionEstimadaHoras: proofPoint.duracionEstimadaHoras,
        tipoEntregableFinal: proofPoint.tipoEntregableFinal,
        documentacionContexto: proofPoint.documentacionContexto,
        prerequisitos: proofPoint.prerequisitos || [],
        prerequisitosText: (proofPoint.prerequisitos || []).join("\n"),
      })
    } else {
      setEditingProofPoint(null)
      setFormData({
        nombre: "",
        slug: "",
        descripcion: "",
        preguntaCentral: "",
        duracionEstimadaHoras: 2,
        tipoEntregableFinal: "",
        documentacionContexto: "",
        prerequisitos: [],
        prerequisitosText: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProofPoint(null)
  }

  const handleNombreBlur = () => {
    // Auto-generate slug if empty and nombre has value
    if (!formData.slug && formData.nombre) {
      const generatedSlug = proofPointsApi.generateSlug(formData.nombre)
      setFormData({ ...formData, slug: generatedSlug })
    }
  }

  const handleSave = async () => {
    // Validation
    if (!formData.nombre.trim()) {
      toast.error("El nombre del proof point es requerido")
      return
    }

    if (!formData.slug.trim()) {
      toast.error("El slug es requerido")
      return
    }

    if (!formData.descripcion.trim()) {
      toast.error("La descripción es requerida")
      return
    }

    if (!formData.preguntaCentral.trim()) {
      toast.error("La pregunta central es requerida")
      return
    }

    if (formData.duracionEstimadaHoras < 1) {
      toast.error("La duración debe ser al menos 1 hora")
      return
    }

    setIsSaving(true)

    try {
      const payload: AddProofPointRequest = {
        nombre: formData.nombre.trim(),
        slug: formData.slug.trim(),
        descripcion: formData.descripcion.trim(),
        preguntaCentral: formData.preguntaCentral.trim(),
        duracionEstimadaHoras: formData.duracionEstimadaHoras,
        tipoEntregableFinal: formData.tipoEntregableFinal?.trim() || undefined,
        documentacionContexto: formData.documentacionContexto?.trim() || undefined,
        prerequisitos: formData.prerequisitosText
          ? formData.prerequisitosText.split("\n").filter(p => p.trim())
          : [],
      }

      if (editingProofPoint) {
        // Update existing proof point
        const updated = await proofPointsApi.update(editingProofPoint.id, payload)
        setProofPoints(proofPoints.map(pp => (pp.id === updated.id ? updated : pp)))
        toast.success("Proof point actualizado exitosamente")
        onProofPointUpdated?.(updated)
      } else {
        // Create new proof point
        const created = await proofPointsApi.create(faseId, payload)
        setProofPoints([...proofPoints, created])
        toast.success("Proof point creado exitosamente")
        onProofPointCreated?.(created)
      }

      handleCloseDialog()
    } catch (error: any) {
      console.error("Error saving proof point:", error)
      toast.error(error.message || "Error al guardar el proof point")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (proofPointId: string) => {
    if (
      !confirm("¿Estás seguro de eliminar este proof point? Esta acción no se puede deshacer.")
    ) {
      return
    }

    try {
      await proofPointsApi.delete(proofPointId)
      setProofPoints(proofPoints.filter(pp => pp.id !== proofPointId))
      toast.success("Proof point eliminado exitosamente")
      onProofPointDeleted?.(proofPointId)
    } catch (error: any) {
      console.error("Error deleting proof point:", error)
      toast.error(error.message || "Error al eliminar el proof point")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando proof points...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold">Proof Points - {faseName}</h4>
          <p className="text-sm text-muted-foreground">
            {proofPoints.length === 0
              ? "No hay proof points creados aún"
              : `${proofPoints.length} proof point${proofPoints.length !== 1 ? "s" : ""} configurado${proofPoints.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Proof Point
        </Button>
      </div>

      {/* Proof Points List */}
      {proofPoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <HelpCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center mb-3">
              Los proof points son los hitos de aprendizaje específicos de esta fase.
              <br />
              Cada proof point demuestra el dominio de una habilidad concreta.
            </p>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Proof Point
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proofPoints.map((pp, index) => (
            <Card key={pp.id} className="border-l-4 border-l-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          PP {index + 1}
                        </Badge>
                        <CardTitle className="text-sm">{pp.nombre}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">{pp.descripcion}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      asChild
                    >
                      <Link href={`/programas/${encodeURIComponent(programId)}/proof-points/${encodeURIComponent(pp.id)}/ejercicios`}>
                        <BookOpen className="h-3 w-3 mr-1" />
                        Ejercicios
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(pp)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(pp.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{pp.duracionEstimadaHoras}h</span>
                  </div>
                  {pp.tipoEntregableFinal && (
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{pp.tipoEntregableFinal}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    <span className="truncate max-w-[300px]">{pp.preguntaCentral}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProofPoint ? "Editar Proof Point" : "Crear Nuevo Proof Point"}
            </DialogTitle>
            <DialogDescription>
              {editingProofPoint
                ? "Modifica la información del proof point."
                : "Define un nuevo hito de aprendizaje para esta fase."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre y Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del Proof Point <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Crear mi primera variable"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  onBlur={handleNombreBlur}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug (URL) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="crear-mi-primera-variable"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Se genera automáticamente</p>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descripcion"
                placeholder="Describe qué aprenderá el estudiante en este proof point..."
                rows={2}
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            {/* Pregunta Central */}
            <div className="space-y-2">
              <Label htmlFor="preguntaCentral">
                Pregunta Central <span className="text-destructive">*</span>
              </Label>
              <Input
                id="preguntaCentral"
                placeholder="¿Qué pregunta guía responde este proof point?"
                value={formData.preguntaCentral}
                onChange={e => setFormData({ ...formData, preguntaCentral: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                La pregunta principal que el estudiante debe poder responder al completar este proof
                point
              </p>
            </div>

            {/* Duración y Tipo de Entregable */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duracion">
                  Duración Estimada (horas) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duracion"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.duracionEstimadaHoras}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      duracionEstimadaHoras: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoEntregable">Tipo de Entregable Final</Label>
                <Input
                  id="tipoEntregable"
                  placeholder="Ej: código, documento, presentación"
                  value={formData.tipoEntregableFinal || ""}
                  onChange={e => setFormData({ ...formData, tipoEntregableFinal: e.target.value })}
                />
              </div>
            </div>

            {/* Documentación de Contexto */}
            <div className="space-y-2">
              <Label htmlFor="documentacion">Documentación de Contexto</Label>
              <Textarea
                id="documentacion"
                placeholder="Información adicional, notas pedagógicas, contexto para instructores..."
                rows={3}
                value={formData.documentacionContexto || ""}
                onChange={e => setFormData({ ...formData, documentacionContexto: e.target.value })}
              />
            </div>

            {/* Prerequisitos */}
            <div className="space-y-2">
              <Label htmlFor="prerequisitos">Prerequisitos (IDs de otros Proof Points)</Label>
              <Textarea
                id="prerequisitos"
                placeholder="Escribe un ID de proof point por línea&#10;Ej: proof_point:abc123"
                rows={3}
                value={formData.prerequisitosText || ""}
                onChange={e => setFormData({ ...formData, prerequisitosText: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                IDs de proof points que deben completarse antes de este
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : editingProofPoint
                  ? "Guardar Cambios"
                  : "Crear Proof Point"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
