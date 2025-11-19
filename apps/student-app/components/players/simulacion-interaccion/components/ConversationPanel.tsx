import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, MessageSquare, RotateCcw, Send, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SimulationMessage } from "../types"

interface ConversationPanelProps {
  messages: SimulationMessage[]
  personaName: string
  isThinking: boolean
  error?: string | null
  disabled?: boolean
  onSend: (message: string) => Promise<void> | void
  onReset: () => void
}

export function ConversationPanel({
  messages,
  personaName,
  isThinking,
  error,
  disabled,
  onSend,
  onReset,
}: ConversationPanelProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || disabled || isThinking) return

    setInput("")
    await onSend(trimmed)
  }

  return (
    <Card className="border-2">
      <CardHeader className="border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold">Conversación</span>
            <Badge variant="outline">{messages.filter((m) => m.role !== "system").length} mensajes</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onReset} disabled={disabled}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3 border-b px-4 pb-3 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="h-[480px] space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "system" ? (
                <div className="rounded-lg border-l-4 border-primary bg-muted/50 p-4">
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
                        "rounded-lg p-3 text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
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
            <div className="flex justify-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-100" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder={`Escribe tu mensaje para ${personaName}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={disabled || isThinking}
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isThinking || disabled}
              size="lg"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
