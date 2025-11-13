"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Sparkles } from "lucide-react"
import { exerciseTemplatesApi, exerciseCategoriesMetadata } from "@/services/api"
import type { ExerciseTemplateResponse, ExerciseCategory } from "@/types/api"
import { toast } from "sonner"
import { ExerciseTypeCard } from "./ExerciseTypeCard"
import { ExerciseConfigForm } from "./ExerciseConfigForm"
import { ExerciseInstanceList } from "./ExerciseInstanceList"

interface ExerciseSelectorProps {
  proofPointId: string
  proofPointName: string
}

export function ExerciseSelector({ proofPointId, proofPointName }: ExerciseSelectorProps) {
  const [templates, setTemplates] = useState<ExerciseTemplateResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ExerciseTemplateResponse | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load exercise templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const data = await exerciseTemplatesApi.getAll()
      setTemplates(data)
    } catch (error) {
      console.error("Error loading exercise templates:", error)
      toast.error("Error al cargar los tipos de ejercicios")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTemplate = async (template: ExerciseTemplateResponse) => {
    // Fetch the latest version of the template to ensure we have the most up-to-date schema
    try {
      const latestTemplate = await exerciseTemplatesApi.getById(template.id)
      setSelectedTemplate(latestTemplate)
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Error loading template details:", error)
      // Fallback to cached template if fetch fails
      setSelectedTemplate(template)
      setIsDialogOpen(true)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedTemplate(null)
  }

  const handleExerciseCreated = () => {
    // Refresh the exercise list
    setRefreshKey(prev => prev + 1)
    handleCloseDialog()
  }

  // Group templates by category
  const templatesByCategory = templates.reduce(
    (acc, template) => {
      if (!acc[template.categoria]) {
        acc[template.categoria] = []
      }
      acc[template.categoria].push(template)
      return acc
    },
    {} as Record<ExerciseCategory, ExerciseTemplateResponse[]>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando tipos de ejercicios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Ejercicios - {proofPointName}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Selecciona el tipo de ejercicio que mejor se adapte a este proof point. Cada tipo está
          optimizado para diferentes objetivos pedagógicos.
        </p>
      </div>

      {/* Current Exercises */}
      <ExerciseInstanceList
        key={refreshKey}
        proofPointId={proofPointId}
        onExerciseDeleted={() => setRefreshKey(prev => prev + 1)}
      />

      {/* Exercise Type Grid */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Agregar Nuevo Ejercicio</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Object.entries(exerciseCategoriesMetadata).map(([categoria, metadata]) => {
            const template = templatesByCategory[categoria as ExerciseCategory]?.[0]
            return (
              <ExerciseTypeCard
                key={categoria}
                categoria={categoria as ExerciseCategory}
                metadata={metadata}
                template={template}
                onSelect={() => template && handleSelectTemplate(template)}
              />
            )
          })}
        </div>
      </div>

      {/* Configuration Dialog */}
      {selectedTemplate && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{exerciseCategoriesMetadata[selectedTemplate.categoria].icono}</span>
                <div>
                  <DialogTitle>{selectedTemplate.nombre}</DialogTitle>
                  <DialogDescription>{selectedTemplate.descripcion}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ExerciseConfigForm
              template={selectedTemplate}
              proofPointId={proofPointId}
              onClose={handleCloseDialog}
              onSuccess={handleExerciseCreated}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
