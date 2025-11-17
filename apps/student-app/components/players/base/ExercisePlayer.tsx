"use client"

import { useState, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  RotateCcw,
  MessageSquare,
  X,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface ExercisePlayerProps {
  exerciseId: string
  exerciseName: string
  exerciseDescription?: string
  proofPointName: string
  totalSteps?: number
  currentStep?: number
  estimatedMinutes?: number
  onSave?: (data: any) => Promise<void>
  onComplete?: (data: any) => Promise<void>
  onPrevious?: () => void
  onNext?: () => void
  onExit?: () => void
  children: ReactNode
  showAIAssistant?: boolean
  aiContext?: string
  contentMaxWidthClassName?: string
  onAskAssistant?: (message: string, history: Array<{ role: "user" | "assistant"; content: string }>) => Promise<string>
  onAskAssistantStream?: (
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    callbacks: {
      onStart?: () => void
      onChunk: (chunk: string) => void
      onDone: (referencias: string[]) => void
      onError?: (error: string) => void
    }
  ) => Promise<void>
  canComplete?: boolean
}

export function ExercisePlayer({
  exerciseId,
  exerciseName,
  exerciseDescription,
  proofPointName,
  totalSteps = 1,
  currentStep = 1,
  estimatedMinutes,
  onSave,
  onComplete,
  onPrevious,
  onNext,
  onExit,
  children,
  showAIAssistant = false,
  aiContext,
  contentMaxWidthClassName,
  onAskAssistant,
  onAskAssistantStream,
  canComplete = true,
}: ExercisePlayerProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [aiInput, setAiInput] = useState("")
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const shellClass = "mx-auto w-full max-w-[1600px] px-6"

  const progress = (currentStep / totalSteps) * 100
  const isLastStep = currentStep === totalSteps

  const handleSave = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      // The parent component should pass the exercise data
      await onSave({})
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async () => {
    if (!onComplete) return
    setIsCompleting(true)
    try {
      await onComplete({})
    } finally {
      setIsCompleting(false)
    }
  }

  const handleAIMessage = async () => {
    if (!aiInput.trim()) return

    const userMessage = aiInput.trim()
    setAiInput("")
    const nextHistory = [...aiMessages, { role: "user" as const, content: userMessage }]
    setAiMessages(nextHistory)

    // Prefer streaming if available
    if (onAskAssistantStream) {
      setIsAssistantTyping(true)
      setStreamingContent("")

      // Use a local variable to accumulate content since state updates are async
      let accumulatedContent = ""

      try {
        await onAskAssistantStream(userMessage, nextHistory, {
          onStart: () => {
            setIsAssistantTyping(true)
            setStreamingContent("")
            accumulatedContent = ""
          },
          onChunk: (chunk: string) => {
            accumulatedContent += chunk
            setStreamingContent(accumulatedContent)
          },
          onDone: (referencias: string[]) => {
            setAiMessages((prev) => [
              ...prev,
              { role: "assistant", content: accumulatedContent },
            ])
            setStreamingContent("")
            setIsAssistantTyping(false)
          },
          onError: (error: string) => {
            console.error("AI streaming error:", error)
            setAiMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "No pude procesar tu pregunta. Intenta nuevamente más tarde.",
              },
            ])
            setStreamingContent("")
            setIsAssistantTyping(false)
          },
        })
      } catch (error) {
        console.error("AI streaming error:", error)
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "No pude procesar tu pregunta. Intenta nuevamente más tarde.",
          },
        ])
        setStreamingContent("")
        setIsAssistantTyping(false)
      }
      return
    }

    // Fallback to non-streaming
    if (!onAskAssistant) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "El asistente IA no está disponible en este momento.",
        },
      ])
      return
    }

    setIsAssistantTyping(true)
    try {
      const response = await onAskAssistant(userMessage, nextHistory)
      setAiMessages((prev) => [...prev, { role: "assistant", content: response }])
    } catch (error) {
      console.error("AI assistant error:", error)
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "No pude procesar tu pregunta. Intenta nuevamente más tarde.",
        },
      ])
    } finally {
      setIsAssistantTyping(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className={`${shellClass} flex h-16 items-center justify-between`}>
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
                ⏱ {estimatedMinutes} min
              </Badge>
            )}
            {showAIAssistant && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAI(!showAI)}
                className={cn(showAI && "bg-primary/10")}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Asistente IA
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !onSave}
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Exercise Content */}
        <div className={cn(
          "flex-1 overflow-y-auto",
          showAI && "lg:mr-96"
        )}>
          <div className={`${shellClass} py-8`}>
            <div
              className={cn(
                "mx-auto w-full",
                contentMaxWidthClassName ?? "max-w-4xl"
              )}
            >
              {exerciseDescription && (
                <Card className="mb-6 bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">{exerciseDescription}</p>
                </Card>
              )}
              {children}
            </div>
          </div>
        </div>

        {/* AI Assistant Sidebar */}
        {showAIAssistant && showAI && (
          <aside className="fixed right-0 top-16 bottom-16 w-96 border-l bg-background overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Asistente IA
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAI(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pregúntame cualquier cosa sobre este ejercicio
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.length === 0 && !isAssistantTyping && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Haz una pregunta para comenzar
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
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {/* Streaming content or typing indicator */}
              {isAssistantTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted">
                    {streamingContent ? (
                      <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isAssistantTyping ? "Generando respuesta..." : "Escribe tu pregunta..."}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isAssistantTyping && handleAIMessage()}
                  disabled={isAssistantTyping}
                  className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button size="sm" onClick={handleAIMessage} disabled={isAssistantTyping || !aiInput.trim()}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className={`${shellClass} flex h-16 items-center justify-between`}>
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!onPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="text-sm text-muted-foreground">
            {Math.round(progress)}% completado
          </div>

          {isLastStep ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleComplete}
                    disabled={isCompleting || !onComplete || !canComplete}
                  >
                    {isCompleting ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                        Completando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Completar
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {!canComplete && (
                  <TooltipContent>
                    <p>Completa todas las actividades para finalizar</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button onClick={onNext} disabled={!onNext}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
