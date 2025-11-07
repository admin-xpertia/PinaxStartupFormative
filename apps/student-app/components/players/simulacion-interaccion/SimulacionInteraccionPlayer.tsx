"use client"

import { useState, useRef, useEffect } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Send,
  RotateCcw,
  User,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for Simulación de Interacción
interface SimulationScenario {
  titulo: string
  descripcion: string
  personaje_ia: {
    nombre: string
    rol: string
    personalidad: string
    tono: string
    contexto: string
  }
  objetivo_estudiante: string
  situacion_inicial: string
  criterios_exito: string[]
  nivel_dificultad: "principiante" | "intermedio" | "avanzado"
  tiempo_sugerido?: number
}

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  feedback?: {
    tipo: "positivo" | "neutral" | "mejora"
    mensaje: string
  }
}

interface SimulacionInteraccionPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: SimulationScenario
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
}

export function SimulacionInteraccionPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
}: SimulacionInteraccionPlayerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "system",
      content: content.situacion_inicial,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [showObjectives, setShowObjectives] = useState(true)
  const [conversationComplete, setConversationComplete] = useState(false)
  const [successCriteriaMet, setSuccessCriteriaMet] = useState<Set<number>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isThinking) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsThinking(true)

    // TODO: Call AI API with simulation context
    // For now, simulate response
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: `[Respuesta de ${content.personaje_ia.nombre}] Entiendo tu punto. Como ${content.personaje_ia.rol}, mi perspectiva es...`,
        timestamp: new Date(),
      }

      // Randomly add feedback for demonstration
      if (Math.random() > 0.5) {
        aiResponse.feedback = {
          tipo: Math.random() > 0.3 ? "positivo" : "mejora",
          mensaje:
            Math.random() > 0.3
              ? "Excelente enfoque. Estás demostrando empatía y escucha activa."
              : "Considera reformular tu mensaje para ser más específico.",
        }
      }

      setMessages(prev => [...prev, aiResponse])
      setIsThinking(false)

      // Check if conversation objectives are met
      checkSuccessCriteria(messages.length + 2)
    }, 1500)
  }

  const checkSuccessCriteria = (messageCount: number) => {
    // Simple heuristic: mark criteria as met based on message count
    // In production, this would use AI to analyze conversation
    const newMet = new Set(successCriteriaMet)
    if (messageCount >= 4) newMet.add(0)
    if (messageCount >= 8) newMet.add(1)
    if (messageCount >= 12) newMet.add(2)
    setSuccessCriteriaMet(newMet)

    if (newMet.size >= content.criterios_exito.length) {
      setConversationComplete(true)
    }
  }

  const handleReset = () => {
    setMessages([
      {
        id: "initial",
        role: "system",
        content: content.situacion_inicial,
        timestamp: new Date(),
      },
    ])
    setConversationComplete(false)
    setSuccessCriteriaMet(new Set())
  }

  const handleSaveWithData = async () => {
    await onSave({
      messages,
      successCriteriaMet: Array.from(successCriteriaMet),
      conversationComplete,
    })
  }

  const handleCompleteWithData = async () => {
    await onComplete({
      messages,
      successCriteriaMet: Array.from(successCriteriaMet),
      conversationComplete,
    })
  }

  const getDifficultyColor = () => {
    switch (content.nivel_dificultad) {
      case "principiante":
        return "bg-green-500"
      case "intermedio":
        return "bg-yellow-500"
      case "avanzado":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={content.descripcion}
      proofPointName={proofPointName}
      totalSteps={1}
      currentStep={1}
      estimatedMinutes={content.tiempo_sugerido}
      onSave={handleSaveWithData}
      onComplete={conversationComplete ? handleCompleteWithData : undefined}
      onExit={onExit}
      showAIAssistant={false} // Simulation IS the AI interaction
    >
      <div className="space-y-6">
        {/* Scenario Info */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5" />
                  {content.titulo}
                </CardTitle>
                <p className="text-sm text-foreground/80">{content.descripcion}</p>
              </div>
              <Badge className={getDifficultyColor()}>
                {content.nivel_dificultad}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-1">Tu Objetivo:</h4>
                <p className="text-sm text-foreground/90">{content.objetivo_estudiante}</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                <Avatar>
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{content.personaje_ia.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {content.personaje_ia.rol} • {content.personaje_ia.tono}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Criteria */}
        {showObjectives && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Criterios de Éxito</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowObjectives(false)}
                >
                  Ocultar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {content.criterios_exito.map((criterio, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {successCriteriaMet.has(idx) ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 mt-0.5 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        successCriteriaMet.has(idx) && "text-muted-foreground line-through"
                      )}
                    >
                      {criterio}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <Card className="border-2">
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-semibold">Conversación</span>
                <Badge variant="outline">{messages.filter(m => m.role !== "system").length} mensajes</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === "system" ? (
                    <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                      <p className="text-sm italic">{message.content}</p>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
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
                          "max-w-[70%] space-y-2",
                          message.role === "user" && "items-end"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg p-3",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.feedback && (
                          <div
                            className={cn(
                              "text-xs p-2 rounded border-l-2",
                              message.feedback.tipo === "positivo" &&
                                "bg-green-50 border-green-500 text-green-900",
                              message.feedback.tipo === "mejora" &&
                                "bg-orange-50 border-orange-500 text-orange-900",
                              message.feedback.tipo === "neutral" &&
                                "bg-blue-50 border-blue-500 text-blue-900"
                            )}
                          >
                            <div className="flex items-start gap-1">
                              <Lightbulb className="h-3 w-3 mt-0.5" />
                              <span>{message.feedback.mensaje}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  placeholder={`Escribe tu mensaje para ${content.personaje_ia.nombre}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isThinking || conversationComplete}
                  className="resize-none min-h-[80px]"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isThinking || conversationComplete}
                  size="lg"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Presiona Enter para enviar, Shift+Enter para nueva línea
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completion Message */}
        {conversationComplete && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">
                    ¡Simulación Completada!
                  </h4>
                  <p className="text-sm text-green-800">
                    Has cumplido todos los criterios de éxito. Puedes continuar la conversación
                    o completar el ejercicio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ExercisePlayer>
  )
}
