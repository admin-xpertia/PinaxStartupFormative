"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { MessageCircle, Bot, User, Send, RotateCcw, Sparkles } from "lucide-react"
import { exercisesApi } from "@/services/api"

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleResetConversation = () => {
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
      const trimmed = text.trim()
      if (!trimmed) return

      const userMessage = createMessage("user", trimmed)
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsSending(true)

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
        })

        const assistantReply = response.respuesta?.trim() || "Estoy procesando tus reflexiones..."
        const assistantMessage = createMessage("assistant", assistantReply)
        setMessages((prev) => [...prev, assistantMessage])
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
    [buildSectionContext, content?.system_prompt_chat, exerciseId, historyPayload, messages.length, sessionTitle]
  )

  const handleSaveWithData = async () => {
    await onSave({
      messages,
      lastInteraction: messages[messages.length - 1]?.timestamp,
    })
  }

  const handleCompleteWithData = async () => {
    await onComplete({
      messages,
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
      onSave={handleSaveWithData}
      onComplete={handleCompleteWithData}
      onExit={onExit}
      showAIAssistant={false}
      contentMaxWidthClassName="max-w-5xl"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)]">
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

        <Card className="border-2">
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold">Diálogo en vivo</span>
                <Badge variant="outline">{messages.length} turnos</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetConversation}>
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
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage(input)
                  }
                }}
                placeholder="Comparte lo que aprendiste, lo que te confundió o las decisiones que tomarás después de esta sesión..."
                className="min-h-[110px] resize-none"
                disabled={isSending}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Enter para enviar · Shift + Enter para nueva línea</span>
                <Button
                  size="sm"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isSending}
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
