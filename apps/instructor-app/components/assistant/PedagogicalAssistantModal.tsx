"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles, Wand2, Check } from "lucide-react"
import { apiClient } from "@/services/api/client"
import { exerciseCategoriesMetadata } from "@/services/api/exercises"
import type { ProofPointResponse, AddExerciseToProofPointRequest } from "@/types/api"
import { toast } from "sonner"

// Tipos para el flujo
type Step = "intro" | "context" | "review" | "loading"

interface ContextData {
  concepcionesErroneas: string
  barrerasConceptuales: string
}

interface ExerciseRecommendation extends AddExerciseToProofPointRequest {
  proofPointId: string
  // Campos adicionales para la UI
  _templateNombre: string
  _fasePatron: string // Ej: "Fase 1: Activar"
  _proposito: string   // Ej: "Para confrontar la idea errónea X"
}

interface PedagogicalAssistantModalProps {
  programId: string
  programName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function PedagogicalAssistantModal({
  programId,
  programName,
  open,
  onOpenChange,
  onComplete
}: PedagogicalAssistantModalProps) {
  const [step, setStep] = useState<Step>("intro")
  const [proofPoints, setProofPoints] = useState<ProofPointResponse[]>([])
  const [contexts, setContexts] = useState<Record<string, ContextData>>({}) // key: ppId
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([])
  const [selectedRecommendations, setSelectedRecommendations] = useState<Record<number, boolean>>({}) // key: index

  // Cargar todos los Proof Points del programa cuando el modal se prepara para el paso 'context'
  const loadProofPoints = async () => {
    setStep("loading")
    try {
      // Primero obtener todas las fases del programa
      const fases = await apiClient.get<any[]>(`/programs/${programId}/fases`)

      // Luego obtener todos los proof points de todas las fases
      let allProofPoints: ProofPointResponse[] = []
      for (const fase of fases) {
        const pps = await apiClient.get<ProofPointResponse[]>(`/fases/${fase.id}/proof-points`)
        allProofPoints = [...allProofPoints, ...pps]
      }

      setProofPoints(allProofPoints)

      // Inicializar el estado de contextos
      const initialContexts: Record<string, ContextData> = {}
      allProofPoints.forEach((pp) => {
        initialContexts[pp.id] = {
          concepcionesErroneas: pp.documentacionContexto || "", // Pre-llenar si existe
          barrerasConceptuales: "",
        }
      })
      setContexts(initialContexts)
      setStep("context")
    } catch (err: any) {
      toast.error("Error al cargar la estructura del programa.", {
        description: err.message,
      })
      setStep("intro")
    }
  }

  // Llamar a la IA para OBTENER RECOMENDACIONES
  const handleGeneratePlan = async () => {
    setStep("loading")
    try {
      // Llama al nuevo endpoint del backend
      const plan = await apiClient.post<{ recommendations: ExerciseRecommendation[] }>(
        `/programs/${programId}/recommend-exercise-plan`,
        { proofPointContexts: contexts }
      )

      setRecommendations(plan.recommendations)

      // Marcar todas las recomendaciones como seleccionadas por defecto
      const initialSelections: Record<number, boolean> = {}
      plan.recommendations.forEach((_, index) => {
        initialSelections[index] = true
      })
      setSelectedRecommendations(initialSelections)

      setStep("review")
    } catch (err: any) {
      toast.error("Error al generar el plan de IA.", {
        description: err.message,
      })
      setStep("context") // Volver al paso anterior
    }
  }

  // APLICAR el plan y crear los ejercicios
  const handleApplyPlan = async () => {
    setStep("loading")
    try {
      const recommendationsToApply = recommendations.filter(
        (_, index) => selectedRecommendations[index]
      )

      if (recommendationsToApply.length === 0) {
        toast.warning("No has seleccionado ninguna recomendación.")
        setStep("review")
        return
      }

      // Llama al segundo endpoint del backend
      await apiClient.post(
        `/programs/${programId}/apply-exercise-plan`,
        { recommendationsToApply }
      )

      onComplete() // Cierra el modal y refresca la página

    } catch (err: any) {
      toast.error("Error al guardar los ejercicios.", {
        description: err.message,
      })
      setStep("review")
    }
  }

  // --- Renderizado de Pasos ---

  const renderIntro = () => (
    <>
      <DialogDescription>
        Hemos detectado que tu programa <strong>{programName}</strong> ya tiene Fases y Proof Points,
        pero aún no tiene ejercicios. ¿Te gustaría que nuestra IA te ayude a crear un plan
        de ejercicios inicial basado en tu estructura?
      </DialogDescription>
      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Lo haré manualmente</Button>
        <Button onClick={loadProofPoints}>
          <Sparkles className="mr-2 h-4 w-4" />
          Sí, ayúdame
        </Button>
      </DialogFooter>
    </>
  )

  const renderContext = () => (
    <>
      <DialogDescription>
        Para recomendar los mejores ejercicios, la IA necesita entender el "por qué" de cada
        Proof Point (Concepto Umbral). ¿Por qué son difíciles? ¿Qué suelen pensar mal los estudiantes?
      </DialogDescription>
      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
        <Accordion type="multiple" className="w-full">
          {proofPoints.map(pp => (
            <AccordionItem value={pp.id} key={pp.id}>
              <AccordionTrigger>{pp.nombre}</AccordionTrigger>
              <AccordionContent className="space-y-3 px-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Pregunta Central:</strong> {pp.preguntaCentral}
                </p>
                <div className="space-y-1">
                  <Label>Concepciones Erróneas Comunes</Label>
                  <Textarea
                    placeholder="Ej: 'Los estudiantes creen que la evolución tiene un propósito...'"
                    value={contexts[pp.id]?.concepcionesErroneas || ""}
                    onChange={e => setContexts(prev => ({
                      ...prev,
                      [pp.id]: { ...prev[pp.id], concepcionesErroneas: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Barreras Conceptuales</Label>
                  <Textarea
                    placeholder="Ej: 'El concepto es contraintuitivo porque...'"
                    value={contexts[pp.id]?.barrerasConceptuales || ""}
                    onChange={e => setContexts(prev => ({
                      ...prev,
                      [pp.id]: { ...prev[pp.id], barrerasConceptuales: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => setStep("intro")}>Volver</Button>
        <Button onClick={handleGeneratePlan}>
          <Wand2 className="mr-2 h-4 w-4" />
          Generar Plan de Ejercicios
        </Button>
      </DialogFooter>
    </>
  )

  const renderReview = () => {
    // Agrupar recomendaciones por proof point
    const groupedRecs: Record<string, ExerciseRecommendation[]> = {}
    recommendations.forEach((rec, index) => {
      if (!groupedRecs[rec.proofPointId]) {
        groupedRecs[rec.proofPointId] = []
      }
      groupedRecs[rec.proofPointId].push(rec)
    })

    return (
      <>
        <DialogDescription>
          ¡Plan generado! Revisa las recomendaciones de la IA. Desmarca las que no quieras
          agregar. Los ejercicios se crearán con esta configuración, listos para "Generar Contenido".
        </DialogDescription>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {proofPoints.map(pp => {
            const ppRecs = recommendations.filter(r => r.proofPointId === pp.id)
            if (ppRecs.length === 0) return null

            return (
              <div key={pp.id}>
                <h4 className="font-semibold mb-2">Proof Point: {pp.nombre}</h4>
                <div className="space-y-2">
                  {ppRecs.map((rec, localIndex) => {
                    const globalIndex = recommendations.indexOf(rec)
                    return (
                      <Card key={globalIndex} className="bg-muted/50">
                        <CardContent className="p-3 flex items-start gap-3">
                          <Checkbox
                            id={`rec-${globalIndex}`}
                            checked={selectedRecommendations[globalIndex]}
                            onCheckedChange={checked =>
                              setSelectedRecommendations(prev => ({ ...prev, [globalIndex]: !!checked }))
                            }
                            className="mt-1"
                          />
                          <div className="grid gap-1 flex-1">
                            <Label htmlFor={`rec-${globalIndex}`} className="font-normal cursor-pointer">
                              <strong>{rec._templateNombre}</strong> ({rec._fasePatron})
                            </Label>
                            <p className="text-xs text-muted-foreground">{rec._proposito}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setStep("context")}>Volver y Editar Contexto</Button>
          <Button onClick={handleApplyPlan}>
            <Check className="mr-2 h-4 w-4" />
            Aplicar Plan y Crear {Object.values(selectedRecommendations).filter(Boolean).length} Ejercicios
          </Button>
        </DialogFooter>
      </>
    )
  }

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-48">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Analizando y diseñando... esto puede tardar un minuto.</p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Asistente Pedagógico IA</DialogTitle>
        </DialogHeader>
        {step === "intro" && renderIntro()}
        {step === "context" && renderContext()}
        {step === "review" && renderReview()}
        {step === "loading" && renderLoading()}
      </DialogContent>
    </Dialog>
  )
}
