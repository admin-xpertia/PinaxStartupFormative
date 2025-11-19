"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { MessageCircle, Bot, User, Send, RotateCcw, Sparkles, Lightbulb, CheckCircle2, AlertCircle } from "lucide-react"
import { exercisesApi } from "@/services/api"
import { useAutoSave } from "@/hooks/useAutoSave"

type ChatRole = "user" | "assistant"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
}

interface MetacognitionContent {
  titulo: string
  mensaje_apertura_ia?: string
  system_prompt_chat?: string
  minimo_insights_requeridos?: number
}

interface MetacognicionPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: MetacognitionContent
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
  readOnly?: boolean
}

const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${role}-${Date.now()}-${Math.random()}`,
  role,
  content,
  timestamp: new Date().toISOString(),
})

const normalizeSavedMessages = (savedData?: any): ChatMessage[] | null => {
  if (!savedData?.messages || !Array.isArray(savedData.messages)) return null
  const mapped = savedData.messages
    .map((msg: any) => {
      if (!msg || (msg.role !== "assistant" && msg.role !== "user")) {
        return null
      }
      if (typeof msg.content !== "string" || msg.content.trim().length === 0) {
        return null
      }
      return {
        id: msg.id ?? createMessage(msg.role, msg.content).id,
        role: msg.role as ChatRole,
        content: msg.content,
        timestamp: msg.timestamp ?? new Date().toISOString(),
      }
    })
    .filter(Boolean) as ChatMessage[]

  return mapped.length > 0 ? mapped : null
}

export function MetacognicionPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  savedData,
  onSave,
  onComplete,
  onExit,
  readOnly = false,
}: MetacognicionPlayerProps) {
  const sessionTitle = content?.titulo || exerciseName
  const normalizedSavedMessages = useMemo(() => normalizeSavedMessages(savedData), [savedData])
  const initialMessages =
    normalizedSavedMessages ??
    (content?.mensaje_apertura_ia
      ? [createMessage("assistant", content.mensaje_apertura_ia)]
      : [])

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [insightCount, setInsightCount] = useState(savedData?.insightCount || 0)
  const [detectedInsights, setDetectedInsights] = useState<string[]>(savedData?.detectedInsights || [])
  const [latestInsight, setLatestInsight] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const chatPayload = useMemo(
    () => ({
      messages,
      insightCount,
      detectedInsights,
    }),
    [messages, insightCount, detectedInsights],
  )

  useAutoSave({
    exerciseId,
    data: chatPayload,
    enabled: !readOnly,
    interval: 12000,
  })

  const minimoInsights = content?.minimo_insights_requeridos || 3
  const canComplete = insightCount >= minimoInsights

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleResetConversation = () => {
    if (readOnly) return
    const opening = content?.mensaje_apertura_ia
    setMessages(opening ? [createMessage("assistant", opening)] : [])
    setInput("")
  }

  const buildSectionContext = useCallback(() => {
    const recentThoughts = messages
      .slice(-4)
      .map((msg) => `${msg.role === "assistant" ? "IA" : "Estudiante"}: ${msg.content}`)
      .join("\n")

    return `Sesion de metacognicion enfocada en el aprendizaje actual.
Titulo: ${sessionTitle}
Bitacora reciente:
${recentThoughts || "Aun no hay mensajes previos."}`
  }, [messages, sessionTitle])

  const historyPayload = useCallback(
    (extraMessage?: ChatMessage) => {
      const base = extraMessage ? [...messages, extraMessage] : messages
      return base.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    },
    [messages]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (readOnly) return
      const trimmed = text.trim()
      if (!trimmed) return

      const userMessage = createMessage("user", trimmed)
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsSending(true)
      setLatestInsight(null) // Clear previous latest insight

      try {
        const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
          pregunta: trimmed,
          seccionId: "metacognicion_chat",
          seccionTitulo: sessionTitle,
          seccionContenido: buildSectionContext(),
          historial: historyPayload(userMessage),
          perfilComprension: {
            tipo: "metacognicion",
            turnos: messages.length,
          },
          conceptoFocal: "metacognicion",
          systemPromptOverride: content?.system_prompt_chat,
          // Shadow Monitor insight tracking
          insightCount: insightCount,
        })

        const assistantReply = response.respuesta?.trim() || "Estoy procesando tus reflexiones..."
        const assistantMessage = createMessage("assistant", assistantReply)
        setMessages((prev) => [...prev, assistantMessage])

        // Process Shadow Monitor insights result
        if (response.insightsResult) {
          const newInsightCount = response.insightsResult.insightCount || insightCount
          const newDetectedInsights = response.insightsResult.detectedInsights || []

          if (newInsightCount > insightCount) {
            console.log(`✨ Shadow Monitor: Nuevo insight detectado! Total: ${newInsightCount}`)
            setInsightCount(newInsightCount)
            setLatestInsight(response.insightsResult.latestInsight)
          }

          if (newDetectedInsights.length > 0) {
            setDetectedInsights((prev) => {
              const combined = [...prev, ...newDetectedInsights]
              // Remove duplicates
              return Array.from(new Set(combined))
            })
          }
        }
      } catch (error) {
        console.error("Metacognicion chat error:", error)
        const fallback = createMessage(
          "assistant",
          "No pude responder en este momento, pero sigamos reflexionando cuando estés listo."
        )
        setMessages((prev) => [...prev, fallback])
      } finally {
        setIsSending(false)
      }
    },
    [buildSectionContext, content?.system_prompt_chat, exerciseId, historyPayload, insightCount, messages.length, readOnly, sessionTitle]
  )

  const handleSaveWithData = async () => {
    if (readOnly) return
    await onSave({
      ...chatPayload,
      lastInteraction: messages[messages.length - 1]?.timestamp,
    })
  }

  const handleCompleteWithData = async () => {
    if (readOnly || !canComplete) {
      return // Block completion if minimum insights not reached
    }

    await onComplete({
      ...chatPayload,
      completedAt: new Date().toISOString(),
      turns: messages.length,
    })
  }

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={sessionTitle}
      proofPointName={proofPointName}
      exerciseDescription="Reflexiona sobre tu propio proceso de aprendizaje. Explora claridad, emociones y estrategias."
      totalSteps={1}
      currentStep={1}
      estimatedMinutes={20}
      onSave={!readOnly ? handleSaveWithData : undefined}
      onComplete={!readOnly ? handleCompleteWithData : undefined}
      onExit={onExit}
      showAIAssistant={false}
      contentMaxWidthClassName="max-w-5xl"
      canComplete={!readOnly && canComplete}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {/* Insights Progress Card */}
          <Card className={cn(
            "border-2 transition-all",
            canComplete ? "border-green-500 bg-green-50/30" : "border-amber-500 bg-amber-50/30"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className={cn(
                  "h-5 w-5",
                  canComplete ? "text-green-600" : "text-amber-600"
                )} />
                Insights Detectados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {insightCount} de {minimoInsights} insights
                  </span>
                  <Badge variant={canComplete ? "default" : "secondary"}>
                    {canComplete ? "Completo ✓" : "En progreso"}
                  </Badge>
                </div>
                <Progress
                  value={(insightCount / minimoInsights) * 100}
                  className={cn(
                    "h-3",
                    canComplete && "bg-green-100"
                  )}
                />
              </div>

              {!canComplete && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-900">
                      Necesitas {minimoInsights - insightCount} insight{minimoInsights - insightCount > 1 ? 's' : ''} más para completar la sesión. Los insights son conexiones causales sobre tu aprendizaje.
                    </p>
                  </div>
                </div>
              )}

              {canComplete && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-900 font-medium">
                      ¡Excelente! Has identificado suficientes insights. Puedes finalizar cuando estés listo.
                    </p>
                  </div>
                </div>
              )}

              {detectedInsights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Tus insights:</p>
                  <ul className="space-y-2">
                    {detectedInsights.map((insight, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          "flex items-start gap-2 p-2 rounded-lg text-xs bg-blue-50 border border-blue-100",
                          idx === detectedInsights.length - 1 && latestInsight && "ring-2 ring-blue-400 animate-pulse"
                        )}
                      >
                        <Lightbulb className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-900">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-rose-500" />
                Ritual de Metacognición
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Esta sesión está centrada en tu proceso, no en la evaluación de respuestas. Sé honesto con lo que
                funcionó, lo que confundió y cómo te sentiste.
              </p>
              <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 p-4 text-rose-900">
                <p className="font-semibold">Protocolo Conversacional</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Anclar: vuelve a la pregunta detonadora.</li>
                  <li>Profundizar: explora comprensión, estrategias y emociones.</li>
                  <li>Conectar: busca patrones con reflexiones pasadas.</li>
                  <li>Transferir: imagina cómo aplicarás estos insights.</li>
                  <li>Sintetizar: cierra identificando aprendizajes clave.</li>
                </ol>
              </div>
              <p>
                El facilitador virtual mantendrá un tono empático y normalizará la confusión. Usa la conversación para
                regular tu proceso y planear tu próximo movimiento.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2">
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold">Diálogo en vivo</span>
                <Badge variant="outline">{messages.length} turnos</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetConversation} disabled={readOnly}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex h-[520px] flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Inicia la conversación respondiendo a la pregunta detonadora o compartiendo cómo te sientes tras este
                  aprendizaje.
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl p-3 text-sm shadow",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-slate-800 border border-slate-100"
                    )}
                  >
                    {message.content}
                    <p className="mt-2 text-[11px] text-slate-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl bg-muted px-4 py-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-100" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 border-t pt-4">
              <Textarea
                value={input}
                onChange={(event) => {
                  if (readOnly) return
                  setInput(event.target.value)
                }}
                onKeyDown={(event) => {
                  if (readOnly) return
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage(input)
                  }
                }}
                placeholder="Comparte lo que aprendiste, lo que te confundió o las decisiones que tomarás después de esta sesión..."
                className={cn(
                  "min-h-[110px] resize-none",
                  readOnly && "bg-muted text-muted-foreground"
                )}
                disabled={isSending || readOnly}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Enter para enviar · Shift + Enter para nueva línea</span>
                <Button
                  size="sm"
                  onClick={() => sendMessage(input)}
                  disabled={readOnly || !input.trim() || isSending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ExercisePlayer>
  )
}
