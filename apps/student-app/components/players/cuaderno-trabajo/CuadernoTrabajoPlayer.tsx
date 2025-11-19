"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { exercisesApi } from "@/services/api/exercises.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback"
import { ProactiveSuggestionCard } from "./ProactiveSuggestionCard"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Lightbulb,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for Cuaderno de Trabajo
interface WorkbookPrompt {
  tipo: "texto_corto" | "texto_largo" | "lista" | "tabla" | "reflexion"
  pregunta: string
  guia?: string
  ejemplos?: string[]
  min_palabras?: number
  max_palabras?: number
  placeholder?: string
  id?: string
  criteriosDeEvaluacion?: string[]
  criteriosEvaluacion?: string[]
}

interface WorkbookSection {
  titulo: string
  descripcion?: string
  instrucciones: string
  prompts: WorkbookPrompt[]
  criteriosDeEvaluacion?: string[]
  criterios_evaluacion?: string[]
}

interface WorkbookContent {
  titulo: string
  objetivo: string
  contexto: string
  secciones: WorkbookSection[]
  criterios_evaluacion?: string[]
  tiempo_sugerido?: number
}

interface CuadernoTrabajoPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: WorkbookContent
  initialResponses?: Record<string, any>
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
}

export function CuadernoTrabajoPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  initialResponses = {},
  savedData,
  onSave,
  onComplete,
  onExit,
}: CuadernoTrabajoPlayerProps) {
  const [currentSection, setCurrentSection] = useState(() => {
    // Try to restore the last section the student was working on
    if (savedData?.currentSection !== undefined && typeof savedData.currentSection === 'number') {
      return savedData.currentSection
    }
    return 0
  })
  const [responses, setResponses] = useState<Record<string, any>>(
    () => (savedData?.responses as Record<string, any>) || (savedData as Record<string, any>) || initialResponses || {}
  )
  const [completedSections, setCompletedSections] = useState<Set<number>>(() => {
    // Restore completed sections
    if (Array.isArray(savedData?.completedSections)) {
      return new Set(savedData.completedSections)
    }
    return new Set()
  })
  const [proactiveFeedback, setProactiveFeedback] = useState<Record<string, string | null>>({})
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Rehydrate responses if saved data arrives later
  useEffect(() => {
    if (savedData && typeof savedData === "object") {
      // Try nested structure first (new format), fallback to flat object (old format for backward compatibility)
      const loadedResponses = (savedData.responses as Record<string, any>) || (savedData as Record<string, any>)
      setResponses(loadedResponses || {})

      // Restore completed sections
      if (Array.isArray(savedData.completedSections)) {
        setCompletedSections(new Set(savedData.completedSections))
      }

      // Restore current section
      if (savedData.currentSection !== undefined && typeof savedData.currentSection === 'number') {
        setCurrentSection(savedData.currentSection)
      }
    } else if (initialResponses) {
      setResponses(initialResponses)
    }
  }, [initialResponses, savedData])

  const totalSections = content.secciones.length
  const currentSectionData = content.secciones[currentSection]

  const getResponseKey = useCallback((sectionIdx: number, promptIdx: number) => {
    return `s${sectionIdx}_p${promptIdx}`
  }, [])

  const getPromptQuestionId = useCallback(
    (sectionIdx: number, promptIdx: number) => {
      const prompt = content.secciones[sectionIdx]?.prompts[promptIdx]
      if (!prompt) {
        return getResponseKey(sectionIdx, promptIdx)
      }

      if (prompt.id) {
        return String(prompt.id)
      }

      const questionText = (prompt.pregunta || (prompt as any)?.enunciado || "").trim()
      if (!questionText) {
        return getResponseKey(sectionIdx, promptIdx)
      }

      const normalized = questionText.substring(0, 30).replace(/\s+/g, "_")
      return normalized || getResponseKey(sectionIdx, promptIdx)
    },
    [content, getResponseKey]
  )

  const analyzeDraft = useCallback(
    async (questionId: string, draftText: string) => {
      const trimmed = draftText.trim()
      if (!trimmed || trimmed.length < 30) {
        setProactiveFeedback(prev => ({ ...prev, [questionId]: null }))
        setIsAnalyzing(prev => ({ ...prev, [questionId]: false }))
        return
      }

      setIsAnalyzing(prev => ({ ...prev, [questionId]: true }))
      setProactiveFeedback(prev => ({ ...prev, [questionId]: null }))

      try {
        const response = await exercisesApi.analyzeDraft(exerciseId, {
          questionId,
          draftText: trimmed,
        })

        setProactiveFeedback(prev => ({ ...prev, [questionId]: response.suggestion }))
      } catch (error) {
        console.error("Error analyzing draft:", error)
      } finally {
        setIsAnalyzing(prev => ({ ...prev, [questionId]: false }))
      }
    },
    [exerciseId]
  )

  const [debouncedAnalyzeDraft, cancelDebouncedAnalyze] = useDebouncedCallback(
    (questionId: string, draftText: string) => {
      void analyzeDraft(questionId, draftText)
    },
    1500
  )

  const scheduleProactiveAnalysis = useCallback(
    (sectionIdx: number, promptIdx: number, value: string) => {
      const questionId = getPromptQuestionId(sectionIdx, promptIdx)
      const trimmed = value.trim()

      if (!trimmed || trimmed.length < 30) {
        cancelDebouncedAnalyze(questionId)
        setProactiveFeedback(prev => ({ ...prev, [questionId]: null }))
        setIsAnalyzing(prev => ({ ...prev, [questionId]: false }))
        return
      }

      debouncedAnalyzeDraft(questionId, value)
    },
    [cancelDebouncedAnalyze, debouncedAnalyzeDraft, getPromptQuestionId]
  )

  const buildSectionContext = useCallback(
    (section?: WorkbookSection) => {
      if (!section) {
        return (
          content.contexto ||
          content.objetivo ||
          `Cuaderno "${content.titulo}" sin contexto adicional`
        )
      }

      const sectionCriteria = [
        ...(section.criteriosDeEvaluacion || []),
        ...(section.criterios_evaluacion || []),
      ]
      const globalCriteria = content.criterios_evaluacion || []

      const promptsSummary = section.prompts
        .map((prompt, idx) => {
          const promptCriteria = (prompt.criteriosDeEvaluacion || prompt.criteriosEvaluacion || []).join("; ")
          return [
            `Prompt ${idx + 1} (${prompt.tipo}): ${prompt.pregunta}`,
            prompt.guia && `Guía: ${prompt.guia}`,
            promptCriteria && `Criterios: ${promptCriteria}`,
          ]
            .filter(Boolean)
            .join("\n")
        })
        .filter(Boolean)
        .join("\n\n")

      return [
        section.descripcion && `Descripción: ${section.descripcion}`,
        `Instrucciones: ${section.instrucciones}`,
        promptsSummary && `Prompts:\n${promptsSummary}`,
        sectionCriteria.length > 0 && `Criterios de la sección: ${sectionCriteria.join("; ")}`,
        globalCriteria.length > 0 && `Criterios globales del cuaderno: ${globalCriteria.join("; ")}`,
      ]
        .filter(Boolean)
        .join("\n\n")
    },
    [content.contexto, content.objetivo, content.criterios_evaluacion, content.titulo]
  )

  const handleAskAssistant = useCallback(
    async (
      message: string,
      history: Array<{ role: "user" | "assistant"; content: string }>
    ) => {
      const section = currentSectionData
      const sectionContext = buildSectionContext(section)
      const perfilComprension = {
        seccionesCompletadas: completedSections.size,
        totalSecciones: totalSections,
        progresoActual: (currentSection + 1) / totalSections,
      }

      const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
        pregunta: message,
        seccionId: `cuaderno_section_${currentSection}`,
        seccionTitulo: section?.titulo || `Sección ${currentSection + 1}`,
        seccionContenido: sectionContext,
        historial: history.slice(-10),
        perfilComprension,
        conceptoFocal: section?.titulo || content.titulo,
      })

      return response.respuesta
    },
    [
      buildSectionContext,
      completedSections,
      content.titulo,
      currentSection,
      currentSectionData,
      exerciseId,
      totalSections,
    ]
  )

  const updateResponse = (sectionIdx: number, promptIdx: number, value: any) => {
    const key = getResponseKey(sectionIdx, promptIdx)
    setResponses(prev => ({ ...prev, [key]: value }))

    // Trigger proactive feedback analysis for long text responses
    const prompt = content.secciones[sectionIdx]?.prompts[promptIdx]
    if (prompt && (prompt.tipo === "texto_largo" || prompt.tipo === "reflexion")) {
      scheduleProactiveAnalysis(sectionIdx, promptIdx, value || "")
    }
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      cancelDebouncedAnalyze()
    }
  }, [cancelDebouncedAnalyze])

  const getResponse = (sectionIdx: number, promptIdx: number) => {
    const key = getResponseKey(sectionIdx, promptIdx)
    return responses[key] || ""
  }

  const isSectionComplete = (sectionIdx: number) => {
    const section = content.secciones[sectionIdx]
    return section.prompts.every((prompt, pIdx) => {
      const response = getResponse(sectionIdx, pIdx)
      if (prompt.tipo === "lista") {
        return Array.isArray(response) && response.length > 0
      }
      return response && response.toString().trim().length > 0
    })
  }

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      const wasSectionComplete = isSectionComplete(currentSection)
      if (wasSectionComplete) {
        setCompletedSections(prev => new Set([...prev, currentSection]))
        toast({
          title: "Sección Completada",
          description: "Tus respuestas han sido guardadas.",
          variant: "default",
        })
      }
      setCurrentSection(currentSection + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length
  }

  const renderPrompt = (prompt: WorkbookPrompt, promptIdx: number) => {
    const responseValue = getResponse(currentSection, promptIdx)

    switch (prompt.tipo) {
      case "texto_corto":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{prompt.pregunta}</label>
              {prompt.guia && (
                <p className="text-sm text-muted-foreground mt-1">{prompt.guia}</p>
              )}
            </div>
            <Input
              placeholder={prompt.placeholder || "Escribe tu respuesta..."}
              value={responseValue}
              onChange={(e) => updateResponse(currentSection, promptIdx, e.target.value)}
              className="text-base"
            />
          </div>
        )

      case "texto_largo":
      case "reflexion":
        const wordCount = countWords(responseValue || "")
        const minWords = prompt.min_palabras || 0
        const maxWords = prompt.max_palabras || 1000
        const isWordCountValid = wordCount >= minWords && wordCount <= maxWords
        const questionId = getPromptQuestionId(currentSection, promptIdx)

        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{prompt.pregunta}</label>
              {prompt.guia && (
                <p className="text-sm text-muted-foreground mt-1">{prompt.guia}</p>
              )}
            </div>
            <Textarea
              placeholder={prompt.placeholder || "Desarrolla tu respuesta aquí..."}
              value={responseValue}
              onChange={(e) => updateResponse(currentSection, promptIdx, e.target.value)}
              className="min-h-[200px] text-base"
            />
            <div className="flex items-center justify-between text-sm">
              <span
                className={cn(
                  "text-muted-foreground",
                  !isWordCountValid && "text-orange-600"
                )}
              >
                {wordCount} palabras
                {minWords > 0 && ` (mínimo ${minWords})`}
              </span>
              {prompt.ejemplos && prompt.ejemplos.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    /* TODO: Show examples modal */
                  }}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Ver ejemplos
                </Button>
              )}
            </div>
            <ProactiveSuggestionCard
              isAnalyzing={isAnalyzing[questionId]}
              suggestion={proactiveFeedback[questionId]}
            />
          </div>
        )

      case "lista":
        const listItems = (responseValue as string[]) || [""]

        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{prompt.pregunta}</label>
              {prompt.guia && (
                <p className="text-sm text-muted-foreground mt-1">{prompt.guia}</p>
              )}
            </div>
            <div className="space-y-2">
              {listItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                  <Input
                    placeholder="Escribe un ítem..."
                    value={item}
                    onChange={(e) => {
                      const newList = [...listItems]
                      newList[idx] = e.target.value
                      updateResponse(currentSection, promptIdx, newList)
                    }}
                  />
                  {idx === listItems.length - 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateResponse(currentSection, promptIdx, [...listItems, ""])
                      }}
                    >
                      +
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case "tabla":
        // Simple 2-column table implementation
        const tableData = (responseValue as Array<[string, string]>) || [["", ""]]

        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{prompt.pregunta}</label>
              {prompt.guia && (
                <p className="text-sm text-muted-foreground mt-1">{prompt.guia}</p>
              )}
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Columna 1</th>
                    <th className="p-3 text-left text-sm font-medium">Columna 2</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">
                        <Input
                          value={row[0]}
                          onChange={(e) => {
                            const newTable = [...tableData]
                            newTable[idx][0] = e.target.value
                            updateResponse(currentSection, promptIdx, newTable)
                          }}
                          placeholder="..."
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row[1]}
                          onChange={(e) => {
                            const newTable = [...tableData]
                            newTable[idx][1] = e.target.value
                            updateResponse(currentSection, promptIdx, newTable)
                          }}
                          placeholder="..."
                        />
                      </td>
                      <td className="p-2">
                        {idx === tableData.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              updateResponse(currentSection, promptIdx, [
                                ...tableData,
                                ["", ""],
                              ])
                            }}
                          >
                            +
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const sectionCompletionPercentage = () => {
    const completedPrompts = currentSectionData.prompts.filter((_, pIdx) => {
      const response = getResponse(currentSection, pIdx)
      return response && response.toString().trim().length > 0
    }).length
    return Math.round((completedPrompts / currentSectionData.prompts.length) * 100)
  }

  const handleSaveWithData = async () => {
    await onSave({
      responses,
      completedSections: Array.from(completedSections),
      currentSection,
    })
  }

  const handleCompleteWithData = async () => {
    if (isSectionComplete(currentSection)) {
      setCompletedSections(prev => new Set([...prev, currentSection]))
    }
    await onComplete({
      responses,
      completedSections: Array.from(completedSections),
      currentSection,
    })
  }

  // Verificar si todas las secciones están completas (incluyendo la actual)
  const isFullyComplete = useMemo(() => {
    const currentComplete = isSectionComplete(currentSection)
    const allPreviousComplete = Array.from({ length: totalSections }, (_, i) => i)
      .filter(i => i !== currentSection)
      .every(i => completedSections.has(i) || isSectionComplete(i))

    return currentComplete && allPreviousComplete
  }, [completedSections, currentSection, totalSections, isSectionComplete])

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={content.objetivo}
      proofPointName={proofPointName}
      totalSteps={totalSections}
      currentStep={currentSection + 1}
      estimatedMinutes={content.tiempo_sugerido}
      onSave={handleSaveWithData}
      onComplete={handleCompleteWithData}
      onPrevious={currentSection > 0 ? handlePrevious : undefined}
      onNext={currentSection < totalSections - 1 ? handleNext : undefined}
      onExit={onExit}
      showAIAssistant={true}
      aiContext={currentSectionData.titulo}
      onAskAssistant={handleAskAssistant}
      canComplete={isFullyComplete}
    >
      <div className="space-y-6">
        {/* Context Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contexto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90">{content.contexto}</p>
          </CardContent>
        </Card>

        {/* Section Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          {content.secciones.map((section, idx) => (
            <Button
              key={idx}
              variant={currentSection === idx ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentSection(idx)}
              className="relative"
            >
              {completedSections.has(idx) ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 mr-2" />
              )}
              Sección {idx + 1}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Current Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{currentSectionData.titulo}</h2>
            {currentSectionData.descripcion && (
              <p className="text-muted-foreground">{currentSectionData.descripcion}</p>
            )}
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{currentSectionData.instrucciones}</p>
              </div>
            </CardContent>
          </Card>

          {/* Prompts */}
          <div className="space-y-6">
            {currentSectionData.prompts.map((prompt, pIdx) => (
              <Card key={pIdx}>
                <CardContent className="p-6">
                  {renderPrompt(prompt, pIdx)}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Section Progress */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Progreso de la sección
                </span>
                <Badge variant={sectionCompletionPercentage() === 100 ? "default" : "secondary"}>
                  {sectionCompletionPercentage()}% completado
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evaluation Criteria */}
        {content.criterios_evaluacion && content.criterios_evaluacion.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criterios de Evaluación</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {content.criterios_evaluacion.map((criterio, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{criterio}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ExercisePlayer>
  )
}
