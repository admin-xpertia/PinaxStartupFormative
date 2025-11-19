"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  UserCog,
  Target,
  CheckCircle2,
  Circle,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  BookOpen,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { exercisesApi } from "@/services/api"
import { useAutoSave } from "@/hooks/useAutoSave"

// Types for Mentor/Asesor IA
interface MentorStep {
  numero: number
  titulo: string
  instruccion: string
  pregunta_reflexion: string
  recursos?: Array<{ titulo: string; contenido: string; tipo: "consejo" | "ejemplo" | "link" }>
  criterio_avance: string
  criterios_ia?: string[] // Semantic validation criteria
}

interface MentorContent {
  titulo: string
  objetivo_general: string
  contexto_mentor: {
    nombre: string
    especialidad: string
    estilo: string
    enfoque: string
  }
  pasos: MentorStep[]
  reflexion_final: string
  metricas_seguimiento?: string[]
}

interface StepResponse {
  reflexion: string
  acciones_tomadas?: string[]
  aprendizajes?: string[]
  dudas?: string[]
}

interface MentorIAPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: MentorContent
  initialResponses?: Record<number, StepResponse>
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
  readOnly?: boolean
}

export function MentorIAPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  initialResponses = {},
  savedData,
  onSave,
  onComplete,
  onExit,
  readOnly = false,
}: MentorIAPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<number, StepResponse>>(
    () => (savedData as Record<number, StepResponse>) || initialResponses || {}
  )
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [showMentorAdvice, setShowMentorAdvice] = useState(false)
  const [mentorMessage, setMentorMessage] = useState("")
  const [isRequestingAdvice, setIsRequestingAdvice] = useState(false)
  const [validationError, setValidationError] = useState<{
    feedback: string
    missingAspects: string[]
    qualityScore: number
  } | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const currentStepData = content.pasos[currentStep]
  const totalSteps = content.pasos.length

  const mentorPayload = useMemo(
    () => ({
      responses,
      completedSteps: Array.from(completedSteps),
      currentStep,
    }),
    [responses, completedSteps, currentStep],
  )

  useAutoSave({
    exerciseId,
    data: mentorPayload,
    enabled: !readOnly,
    interval: 12000,
  })

  // Restore saved answers when available
  useEffect(() => {
    if (savedData && typeof savedData === "object") {
      setResponses((savedData as Record<number, StepResponse>) || {})
    } else if (initialResponses) {
      setResponses(initialResponses)
    }
  }, [initialResponses, savedData])

  const updateResponse = (field: keyof StepResponse, value: any) => {
    if (readOnly) return
    setResponses(prev => ({
      ...prev,
      [currentStep]: {
        ...prev[currentStep],
        [field]: value,
      },
    }))

    // Clear validation error when user edits their reflexion
    if (field === "reflexion" && validationError) {
      setValidationError(null)
    }
  }

  const getResponse = (field: keyof StepResponse) => {
    return responses[currentStep]?.[field] || ""
  }

  const buildMentorContext = useCallback(() => {
    const reflections = content.pasos
      .map((step, idx) => {
        const reflexion = responses[idx]?.reflexion
        if (!reflexion) return null
        return `Paso ${idx + 1} - ${step.titulo}: ${reflexion}`
      })
      .filter(Boolean)
      .slice(-5)
      .join("\n")

    return `Guía socrática enfocada en ${content.objetivo_general}.
Paso actual: ${currentStepData.titulo}
Estilo del mentor: ${content.contexto_mentor.estilo} (${content.contexto_mentor.especialidad})
Criterio de avance: ${currentStepData.criterio_avance}
Reflexiones recientes:
${reflections || "No hay reflexiones previas todavía."}`
  }, [
    content.contexto_mentor.especialidad,
    content.contexto_mentor.estilo,
    content.objetivo_general,
    content.pasos,
    currentStepData.criterio_avance,
    currentStepData.titulo,
    responses,
  ])

  const buildMentorHistory = useCallback(
    (prompt: string) => {
      const historyMessages =
        content.pasos
          .map((step, idx) => {
            const reflexion = responses[idx]?.reflexion
            if (!reflexion) return null
            return {
              role: "user" as const,
              content: `Paso ${idx + 1} (${step.titulo}): ${reflexion}`,
            }
          })
          .filter((msg): msg is { role: "user"; content: string } => msg !== null)
          .slice(-6) || []

      return [...historyMessages, { role: "user" as const, content: prompt }]
    },
    [content.pasos, responses]
  )

  const isStepComplete = (stepIdx: number) => {
    const response = responses[stepIdx]
    return response?.reflexion && response.reflexion.trim().length > 100
  }

  const handleStepComplete = async () => {
    if (readOnly || !isStepComplete(currentStep)) return

    // Clear previous validation error
    setValidationError(null)

    // Check if this step has semantic validation criteria
    const criteriosIA = currentStepData.criterios_ia
    if (criteriosIA && criteriosIA.length > 0) {
      setIsValidating(true)

      try {
        const studentResponse = getResponse("reflexion") as string

        // Send validation request
        const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
          pregunta: studentResponse,
          seccionId: `mentor_step_${currentStep + 1}`,
          seccionTitulo: currentStepData.titulo,
          seccionContenido: buildMentorContext(),
          historial: buildMentorHistory(studentResponse),
          conceptoFocal: content.objetivo_general,
          perfilComprension: {
            tipo: "mentor",
            pasosCompletados: completedSteps.size,
            pasoActual: currentStep + 1,
          },
          // Shadow Monitor validation parameters
          criteriosValidacion: criteriosIA,
          umbralCalidad: 3, // From template default config
        })

        // Check validation result
        if (response.validationResult?.isValid === false) {
          // Show error feedback - don't advance
          setValidationError({
            feedback: response.validationResult.feedback,
            missingAspects: response.validationResult.missingAspects,
            qualityScore: response.validationResult.qualityScore,
          })
          setIsValidating(false)
          return // Block advance
        }
      } catch (error) {
        console.error("Validation error:", error)
        setValidationError({
          feedback: "No se pudo validar la respuesta. Por favor, intenta nuevamente.",
          missingAspects: [],
          qualityScore: 0,
        })
        setIsValidating(false)
        return
      } finally {
        setIsValidating(false)
      }
    }

    // If validation passed (or no validation required), proceed with completion
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const requestMentorAdvice = async () => {
    if (readOnly) return
    const prompt =
      (getResponse("reflexion") as string) || currentStepData.pregunta_reflexion
    if (!prompt) return

    setShowMentorAdvice(true)
    setIsRequestingAdvice(true)

    try {
      const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
        pregunta: prompt,
        seccionId: `mentor_step_${currentStep + 1}`,
        seccionTitulo: currentStepData.titulo,
        seccionContenido: buildMentorContext(),
        historial: buildMentorHistory(prompt),
        conceptoFocal: content.objetivo_general,
        perfilComprension: {
          tipo: "mentor",
          pasosCompletados: completedSteps.size,
          pasoActual: currentStep + 1,
        },
      })

      setMentorMessage(
        response.respuesta?.trim() ||
          "No pude generar una recomendación del mentor en este momento."
      )
    } catch (error) {
      console.error("Mentor advice error:", error)
      setMentorMessage("No pude consultar al mentor ahora. Intenta nuevamente.")
    } finally {
      setIsRequestingAdvice(false)
    }
  }

  const handleSaveWithData = async () => {
    if (readOnly) return
    await onSave(mentorPayload)
  }

  const handleCompleteWithData = async () => {
    if (readOnly) return
    if (isStepComplete(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
    }
    await onComplete(mentorPayload)
  }

  const overallProgress = (completedSteps.size / totalSteps) * 100

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={content.objetivo_general}
      proofPointName={proofPointName}
      totalSteps={totalSteps}
      currentStep={currentStep + 1}
      onSave={!readOnly ? handleSaveWithData : undefined}
      onComplete={!readOnly ? handleCompleteWithData : undefined}
      onPrevious={currentStep > 0 ? handlePrevious : undefined}
      onNext={
        currentStep < totalSteps - 1 && completedSteps.has(currentStep)
          ? handleNext
          : undefined
      }
      onExit={onExit}
      showAIAssistant={false} // Has its own mentor interaction
      canComplete={!readOnly && completedSteps.size === totalSteps}
    >
      <div className="space-y-6">
        {/* Mentor Info */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-background">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>{content.contexto_mentor.nombre}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {content.contexto_mentor.especialidad}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{content.contexto_mentor.estilo}</Badge>
                  <Badge variant="outline">{content.contexto_mentor.enfoque}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Overall Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progreso General</span>
                <span className="text-sm text-muted-foreground">
                  {completedSteps.size} / {totalSteps} pasos completados
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Step Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {content.pasos.map((step, idx) => (
            <Button
              key={idx}
              variant={currentStep === idx ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentStep(idx)}
              className={cn(
                "flex-shrink-0 relative",
                completedSteps.has(idx) && "border-green-500"
              )}
            >
              {completedSteps.has(idx) ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 mr-2" />
              )}
              Paso {idx + 1}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Current Step Content */}
        <div className="space-y-6">
          {/* Step Header */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold">Paso {currentStep + 1}: {currentStepData.titulo}</h2>
              <Badge variant={completedSteps.has(currentStep) ? "default" : "secondary"}>
                {completedSteps.has(currentStep) ? "Completado" : "En progreso"}
              </Badge>
            </div>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{currentStepData.instruccion}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reflexion Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Pregunta de Reflexión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/90 font-medium">
                {currentStepData.pregunta_reflexion}
              </p>
              <Textarea
                placeholder="Escribe tu reflexión aquí... (mínimo 100 palabras)"
                value={getResponse("reflexion") as string}
                onChange={(e) => updateResponse("reflexion", e.target.value)}
                disabled={readOnly}
                className={cn(
                  "min-h-[200px]",
                  readOnly && "bg-muted text-muted-foreground resize-none"
                )}
              />
              <div className="flex items-center justify-between text-sm">
                <span className={cn(
                  "text-muted-foreground",
                  (getResponse("reflexion") as string)?.length < 100 && "text-orange-600"
                )}>
                  {(getResponse("reflexion") as string)?.length || 0} caracteres
                  {(getResponse("reflexion") as string)?.length < 100 && " (mínimo 100)"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestMentorAdvice}
                  disabled={isRequestingAdvice || readOnly}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {isRequestingAdvice ? "Consultando..." : "Pedir consejo al mentor"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation Error Feedback */}
          {validationError && (
            <Card className="border-red-500 bg-red-50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">
                        La respuesta necesita mayor profundidad
                      </h4>
                      <p className="text-sm text-red-800 mb-3">{validationError.feedback}</p>

                      {validationError.missingAspects.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-red-900 mb-2">
                            Aspectos que necesitan más desarrollo:
                          </p>
                          <ul className="space-y-1">
                            {validationError.missingAspects.map((aspect, idx) => (
                              <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                                <span className="text-red-600">•</span>
                                {aspect}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-red-100 rounded-lg">
                        <p className="text-xs text-red-900">
                          <strong>Calidad actual:</strong> {validationError.qualityScore}/5
                          (necesitas mínimo 3/5 para continuar)
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (readOnly) return
                          setValidationError(null)
                        }}
                        disabled={readOnly}
                        className="mt-4"
                      >
                        Entendido, voy a mejorar mi respuesta
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mentor Advice */}
          {showMentorAdvice && mentorMessage && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserCog className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{content.contexto_mentor.nombre} dice:</h4>
                    <p className="text-sm">{mentorMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resources */}
          {currentStepData.recursos && currentStepData.recursos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recursos de Apoyo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentStepData.recursos.map((recurso, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-lg border-l-4",
                        recurso.tipo === "consejo" && "bg-blue-50 border-blue-500",
                        recurso.tipo === "ejemplo" && "bg-green-50 border-green-500",
                        recurso.tipo === "link" && "bg-purple-50 border-purple-500"
                      )}
                    >
                      <h5 className="font-medium text-sm mb-1">{recurso.titulo}</h5>
                      <p className="text-sm text-muted-foreground">{recurso.contenido}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Inputs */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Acciones Tomadas (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="¿Qué acciones has tomado o planeas tomar basándote en este paso?"
                  value={(getResponse("acciones_tomadas") as string[])?.join("\n") || ""}
                  onChange={(e) => {
                    if (readOnly) return
                    const lines = e.target.value.split("\n").filter(l => l.trim())
                    updateResponse("acciones_tomadas", lines)
                  }}
                  disabled={readOnly}
                  className={cn(
                    "min-h-[120px]",
                    readOnly && "bg-muted text-muted-foreground resize-none"
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Aprendizajes Clave (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="¿Qué has aprendido en este paso?"
                  value={(getResponse("aprendizajes") as string[])?.join("\n") || ""}
                  onChange={(e) => {
                    if (readOnly) return
                    const lines = e.target.value.split("\n").filter(l => l.trim())
                    updateResponse("aprendizajes", lines)
                  }}
                  disabled={readOnly}
                  className={cn(
                    "min-h-[120px]",
                    readOnly && "bg-muted text-muted-foreground resize-none"
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Advancement Criteria */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Para avanzar al siguiente paso:</p>
                  <p className="text-sm text-muted-foreground">{currentStepData.criterio_avance}</p>
                  {currentStepData.criterios_ia && currentStepData.criterios_ia.length > 0 && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-800">
                        ✨ <strong>Validación Semántica Activa:</strong> Tu respuesta será evaluada automáticamente por calidad y profundidad argumentativa, no solo por extensión.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complete Step Button */}
          {!readOnly && !completedSteps.has(currentStep) && (
            <Button
              onClick={handleStepComplete}
              disabled={!isStepComplete(currentStep) || isValidating || readOnly}
              size="lg"
              className="w-full"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {isValidating ? "Validando respuesta..." : `Completar Paso ${currentStep + 1}`}
            </Button>
          )}
        </div>

        {/* Final Reflection */}
        {currentStep === totalSteps - 1 && completedSteps.has(currentStep) && (
          <Card className="border-primary bg-gradient-to-r from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Reflexión Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 mb-4">{content.reflexion_final}</p>
              {content.metricas_seguimiento && content.metricas_seguimiento.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Métricas para dar seguimiento:</h4>
                  <ul className="space-y-1">
                    {content.metricas_seguimiento.map((metrica, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {metrica}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ExercisePlayer>
  )
}
