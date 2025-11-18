"use client"

import { useState, useEffect, useCallback, ReactNode, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  RotateCcw,
  MessageSquare,
  X,
  Sparkles,
  BookOpen,
  Clock,
  Send,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { exercisesApi, type SaveProgressParams, type CompleteExerciseParams } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

export interface Section {
  id: string
  title: string
  completed?: boolean
}

export interface ExercisePlayerEnhancedProps {
  exerciseId: string
  exerciseName: string
  exerciseDescription?: string
  proofPointName: string
  estudianteId: string // Required for progress tracking
  cohorteId: string // Required for progress tracking
  sections?: Section[] // For left outline
  currentSectionId?: string
  onSectionChange?: (sectionId: string) => void
  totalSteps?: number
  currentStep?: number
  estimatedMinutes?: number
  getData?: () => any // Function to get current exercise data
  onComplete?: (result: any) => Promise<void>
  onExit?: () => void
  children: ReactNode
  aiContext?: string
  onPromptAI?: (prompt: string) => Promise<string>
}

export function ExercisePlayerEnhanced({
  exerciseId,
  exerciseName,
  exerciseDescription,
  proofPointName,
  estudianteId,
  cohorteId,
  sections = [],
  currentSectionId,
  onSectionChange,
  totalSteps = 1,
  currentStep = 1,
  estimatedMinutes,
  getData,
  onComplete,
  onExit,
  children,
  aiContext,
  onPromptAI,
}: ExercisePlayerEnhancedProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const timeTrackerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const startTimeRef = useRef<Date>(new Date())

  const progress = (currentStep / totalSteps) * 100
  const isLastStep = currentStep === totalSteps

  // Start exercise on mount
  useEffect(() => {
    if (!exerciseId || !estudianteId || !cohorteId) {
      return
    }

    const startExercise = async () => {
      try {
        await exercisesApi.start(exerciseId, {
          estudianteId,
          cohorteId,
        })
      } catch (error: any) {
        console.error('Failed to start exercise:', error)
        // Don't block if already started
      }
    }

    startExercise()
    startTimeRef.current = new Date()

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
      if (timeTrackerRef.current) {
        clearInterval(timeTrackerRef.current)
      }
    }
  }, [exerciseId, estudianteId, cohorteId])

  // Track time spent
  useEffect(() => {
    timeTrackerRef.current = setInterval(() => {
      const now = new Date()
      const minutes = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000 / 60)
      setTimeSpent(minutes)
    }, 60000) // Update every minute

    return () => {
      if (timeTrackerRef.current) {
        clearInterval(timeTrackerRef.current)
      }
    }
  }, [])

  const handleAutoSave = useCallback(async () => {
    if (!getData || !estudianteId || !cohorteId) return

    try {
      const data = getData()
      const params: SaveProgressParams = {
        estudianteId,
        cohorteId,
        datos: data,
        porcentajeCompletitud: Math.round(progress),
        tiempoInvertidoMinutos: timeSpent,
      }

      // Fire-and-forget auto-save
      await exercisesApi.autoSave(exerciseId, params)
      setLastSaved(new Date())
    } catch (error) {
      console.warn('Auto-save failed:', error)
    }
  }, [exerciseId, estudianteId, cohorteId, getData, progress, timeSpent])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!estudianteId || !cohorteId) return

    autoSaveTimerRef.current = setInterval(() => {
      handleAutoSave()
    }, 30000) // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [cohorteId, estudianteId, handleAutoSave])

  const handleManualSave = async () => {
    if (!getData) return
    if (!estudianteId || !cohorteId) {
      toast({
        title: "No se puede guardar",
        description: "Falta el contexto de estudiante o cohorte para guardar el progreso",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const data = getData()
      const params: SaveProgressParams = {
        estudianteId,
        cohorteId,
        datos: data,
        porcentajeCompletitud: Math.round(progress),
        tiempoInvertidoMinutos: timeSpent,
      }

      await exercisesApi.saveProgress(exerciseId, params)
      setLastSaved(new Date())

      toast({
        title: "Progreso guardado",
        description: "Tu trabajo se guardó exitosamente",
      })
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el progreso",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async () => {
    if (!getData) return
    if (!estudianteId || !cohorteId) {
      toast({
        title: "No se puede completar",
        description: "Falta el contexto de estudiante o cohorte para completar el ejercicio",
        variant: "destructive",
      })
      return
    }

    setIsCompleting(true)
    try {
      const data = getData()
      const params: CompleteExerciseParams = {
        estudianteId,
        cohorteId,
        datos: data,
        tiempoInvertidoMinutos: timeSpent,
      }

      const result = await exercisesApi.complete(exerciseId, params)

      toast({
        title: "¡Ejercicio completado!",
        description: result.feedback || "Has completado el ejercicio exitosamente",
      })

      if (onComplete) {
        await onComplete(result)
      }
    } catch (error: any) {
      toast({
        title: "Error al completar",
        description: error.message || "No se pudo completar el ejercicio",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleAIMessage = async () => {
    if (!aiInput.trim() || aiLoading) return

    const userMessage = aiInput.trim()
    setAiInput("")
    const nextHistory = [...aiMessages, { role: "user" as const, content: userMessage }]
    setAiMessages(nextHistory)

    if (!onPromptAI) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "El asistente IA no está disponible en este momento.",
        },
      ])
      return
    }

    setAiLoading(true)
    try {
      const contextInfo = aiContext || `Estás trabajando en: ${exerciseName}`
      const response = await onPromptAI(
        `${contextInfo}\n\nPregunta del estudiante: ${userMessage}`,
      )
      setAiMessages((prev) => [...prev, { role: "assistant", content: response }])
    } catch (error) {
      console.error("AI message failed:", error)
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "No pude responder en este momento. Intenta de nuevo más tarde.",
        },
      ])
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onExit}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{exerciseName}</h1>
                {totalSteps > 1 && (
                  <Badge variant="secondary">
                    Paso {currentStep} de {totalSteps}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{proofPointName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {estimatedMinutes && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {estimatedMinutes} min
              </Badge>
            )}
            {timeSpent > 0 && (
              <Badge variant="outline">
                Tiempo: {timeSpent} min
              </Badge>
            )}
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Guardado {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Outline (10%) */}
        {sections.length > 0 && (
          <aside className="w-64 border-r bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Contenido
                </h3>
                <div className="space-y-1">
                  {sections.map((section, idx) => (
                    <button
                      key={section.id}
                      onClick={() => onSectionChange?.(section.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        currentSectionId === section.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                        section.completed && "opacity-75"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                        <span className="flex-1">{section.title}</span>
                        {section.completed && (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Progress Summary */}
                <div className="mt-6 p-3 bg-muted rounded-md">
                  <div className="text-xs text-muted-foreground mb-2">Progreso</div>
                  <Progress value={progress} className="h-2 mb-2" />
                  <div className="text-xs font-medium">{Math.round(progress)}% completado</div>
                </div>
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Center - Main Content (60%) */}
        <div className="flex-1 overflow-y-auto">
          <div className="container max-w-4xl py-8 px-6">
            {exerciseDescription && (
              <Card className="mb-6 p-4 bg-primary/5 border-primary/20">
                <p className="text-sm">{exerciseDescription}</p>
              </Card>
            )}
            {children}
          </div>
        </div>

        {/* Right Sidebar - AI Assistant (30%) */}
        <aside className="w-96 border-l bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Asistente IA</h3>
            </div>
            {aiContext && (
              <p className="text-xs text-muted-foreground">
                Contexto: {aiContext}
              </p>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {aiMessages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Haz una pregunta sobre este ejercicio
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left text-xs"
                      onClick={() => setAiInput("¿Puedes explicarme esto mejor?")}
                    >
                      ¿Puedes explicarme esto mejor?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left text-xs"
                      onClick={() => setAiInput("Dame un ejemplo práctico")}
                    >
                      Dame un ejemplo práctico
                    </Button>
                  </div>
                </div>
              )}
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-2",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[85%]",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="bg-background border rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Escribe tu pregunta..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAIMessage()
                  }
                }}
                className="min-h-[60px] resize-none"
              />
              <Button size="icon" onClick={handleAIMessage} disabled={aiLoading || !aiInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Button variant="outline" onClick={onExit}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Salir
          </Button>

          <div className="text-sm text-muted-foreground">
            {Math.round(progress)}% completado
          </div>

          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Completando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Completar Ejercicio
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
