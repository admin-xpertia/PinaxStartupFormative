import { Sparkles, MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface AiAssistantPanelProps {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onPrefill: (value: string) => void
}

export function AiAssistantPanel({
  messages,
  input,
  onInputChange,
  onSend,
  onPrefill,
}: AiAssistantPanelProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSend()
    }
  }

  const quickPrompts = [
    "¿Cuál es el objetivo principal de este proof point?",
    "Dame ejemplos prácticos para aplicar lo aprendido.",
  ]

  return (
    <aside className="flex w-full flex-col border-l bg-white/80 lg:w-80">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Asistente IA</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Consulta dudas sobre actividades, conceptos o evidencia.
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Pregunta cualquier cosa sobre este proof point
            </p>
            <div className="space-y-2">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left text-xs"
                  onClick={() => onPrefill(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm",
                  message.role === "user"
                    ? "ml-6 bg-primary text-primary-foreground"
                    : "mr-6 bg-muted text-foreground"
                )}
              >
                {message.content}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Escribe tu pregunta..."
            className="min-h-[80px] resize-none"
            onKeyDown={handleKeyDown}
          />
          <Button size="icon" onClick={onSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
