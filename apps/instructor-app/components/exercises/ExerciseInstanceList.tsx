"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, GripVertical, Clock, Sparkles, CheckCircle, AlertCircle } from "lucide-react"
import { exerciseInstancesApi, exerciseCategoriesMetadata } from "@/services/api"
import type { ExerciseInstanceResponse } from "@/types/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ExerciseWizardDialog } from "@/components/exercise-wizard-dialog"
import { ExercisePreviewDialog } from "@/components/exercise-preview-dialog"

interface ExerciseInstanceListProps {
  proofPointId: string
  onExerciseDeleted?: () => void
}

export function ExerciseInstanceList({ proofPointId, onExerciseDeleted }: ExerciseInstanceListProps) {
  const [exercises, setExercises] = useState<ExerciseInstanceResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [instanceToPreview, setInstanceToPreview] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [instanceToEdit, setInstanceToEdit] = useState<ExerciseInstanceResponse | null>(null)

  useEffect(() => {
    loadExercises()
  }, [proofPointId])

  const loadExercises = async () => {
    try {
      setIsLoading(true)
      const data = await exerciseInstancesApi.getByProofPoint(proofPointId)
      setExercises(data)
    } catch (error) {
      console.error("Error loading exercises:", error)
      toast.error("Error al cargar los ejercicios")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenPreview = (exerciseId: string) => {
    setInstanceToPreview(exerciseId)
    setPreviewDialogOpen(true)
  }

  const handleOpenEdit = (exercise: ExerciseInstanceResponse) => {
    setInstanceToEdit(exercise)
    setEditDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setEditDialogOpen(open)
    if (!open) {
      setInstanceToEdit(null)
    }
  }

  const handlePreviewClose = (open: boolean) => {
    setPreviewDialogOpen(open)
    if (!open) {
      setInstanceToPreview(null)
    }
  }

  const handleExerciseUpdated = () => {
    loadExercises()
    handleDialogClose(false)
  }

  const handleDelete = async (exerciseId: string) => {
    if (!confirm("¿Estás seguro de eliminar este ejercicio? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      await exerciseInstancesApi.delete(exerciseId)
      setExercises(exercises.filter(e => e.id !== exerciseId))
      toast.success("Ejercicio eliminado exitosamente")
      onExerciseDeleted?.()
    } catch (error: any) {
      console.error("Error deleting exercise:", error)
      toast.error(error.message || "Error al eliminar el ejercicio")
    }
  }

  const handleGenerateContent = async (exerciseId: string) => {
    try {
      toast.loading("Generando contenido con IA...", { id: exerciseId })
      await exerciseInstancesApi.generateContent(exerciseId)
      toast.success("Contenido generado exitosamente", { id: exerciseId })
    } catch (error: any) {
      console.error("Error generating content:", error)
      toast.error(error.message || "Error al generar contenido", { id: exerciseId })
    } finally {
      loadExercises()
    }
  }

  const getStatusInfo = (estado: string) => {
    switch (estado) {
      case "sin_generar":
        return {
          label: "Sin Generar",
          variant: "outline" as const,
          icon: AlertCircle,
          color: "text-muted-foreground",
        }
      case "generando":
        return {
          label: "Generando...",
          variant: "secondary" as const,
          icon: Sparkles,
          color: "text-blue-500",
        }
      case "generado":
        return {
          label: "Generado",
          variant: "secondary" as const,
          icon: Sparkles,
          color: "text-primary",
        }
      case "draft":
        return {
          label: "Borrador",
          variant: "secondary" as const,
          icon: Edit,
          color: "text-yellow-500",
        }
      case "publicado":
        return {
          label: "Publicado",
          variant: "default" as const,
          icon: CheckCircle,
          color: "text-green-500",
        }
      case "error":
        return {
          label: "Error",
          variant: "destructive" as const,
          icon: AlertCircle,
          color: "text-destructive",
        }
      default:
        return {
          label: estado,
          variant: "outline" as const,
          icon: AlertCircle,
          color: "text-muted-foreground",
        }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Cargando ejercicios...</p>
        </div>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground text-center">
            Aún no hay ejercicios para este proof point.
            <br />
            Selecciona un tipo de ejercicio abajo para comenzar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Ejercicios Actuales ({exercises.length})</h4>
      {exercises.map((exercise, index) => {
        // Get template metadata from category
        const templateMetadata = Object.entries(exerciseCategoriesMetadata).find(
          ([cat]) => exercise.template.includes(cat)
        )?.[1]

        const statusInfo = getStatusInfo(exercise.estadoContenido)
        const StatusIcon = statusInfo.icon

        return (
          <Card key={exercise.id} className="border-l-4" style={{ borderLeftColor: templateMetadata?.color || "#ccc" }}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1 cursor-grab">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {templateMetadata && (
                        <span className="text-xl">{templateMetadata.icono}</span>
                      )}
                      <CardTitle className="text-sm">{exercise.nombre}</CardTitle>
                    </div>
                    {exercise.descripcionBreve && (
                      <CardDescription className="text-xs">
                        {exercise.descripcionBreve}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {(exercise.estadoContenido === "sin_generar" || exercise.estadoContenido === "error") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleGenerateContent(exercise.id)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleOpenPreview(exercise.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleOpenEdit(exercise)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(exercise.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <Badge variant={statusInfo.variant} className="gap-1">
                  <StatusIcon className={cn("h-3 w-3", statusInfo.color)} />
                  {statusInfo.label}
                </Badge>
                {exercise.esObligatorio && (
                  <Badge variant="destructive" className="text-xs">
                    Obligatorio
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{exercise.duracionEstimadaMinutos} min</span>
                </div>
                {templateMetadata && (
                  <span className="text-xs">{templateMetadata.nombre}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
      <ExerciseWizardDialog
        open={editDialogOpen}
        onOpenChange={handleDialogClose}
        template={null}
        proofPointId={proofPointId}
        existingInstance={instanceToEdit}
        onSuccess={handleExerciseUpdated}
      />
      <ExercisePreviewDialog
        open={previewDialogOpen}
        onOpenChange={handlePreviewClose}
        instanceId={instanceToPreview}
      />
    </div>
  )
}
