"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface SubmissionViewerProps {
  template?: string | null
  submission?: any
  exerciseContent?: any
}

type TranscriptMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export function SubmissionViewer({ template, submission, exerciseContent }: SubmissionViewerProps) {
  const parsedContent = useMemo(() => parseExerciseContent(exerciseContent), [exerciseContent])
  const detectedType = detectTemplateFromSubmission(template, submission)

  if (!submission || Object.keys(submission || {}).length === 0) {
    return <EmptyState message="Todavía no recibimos datos para este ejercicio." />
  }

  if (detectedType?.includes("simulacion")) {
    const messages = extractMessages(submission)
    return messages.length > 0 ? (
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "assistant" ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                message.role === "assistant"
                  ? "border bg-white text-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState message="La simulación no contiene mensajes aún." />
    )
  }

  if (detectedType === "cuaderno_trabajo") {
    const responses = normalizeResponses(submission)
    return <WorkbookAnswers responses={responses} content={parsedContent} />
  }

  return <JsonFallback data={submission} />
}

function detectTemplateFromSubmission(template?: string | null, submission?: any): string {
  if (template) {
    return template.toLowerCase()
  }

  if (submission) {
    if (
      Array.isArray(submission?.historial) ||
      Array.isArray(submission?.history) ||
      Array.isArray(submission?.assistantMessages)
    ) {
      return "simulacion_interaccion"
    }

    if (submission?.responses || submission?.respuestas) {
      return "cuaderno_trabajo"
    }
  }

  return "desconocido"
}

function parseExerciseContent(raw: any) {
  if (!raw) return null
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  if (typeof raw === "object") {
    if (typeof raw.contenido_generado === "string") {
      try {
        return JSON.parse(raw.contenido_generado)
      } catch {
        return raw.contenido_generado
      }
    }
    return raw
  }
  return null
}

function extractMessages(submission: any): TranscriptMessage[] {
  const history = submission?.historial ?? submission?.history ?? submission?.assistantMessages ?? []
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .map((message, idx) => {
      if (!message) return null
      if (typeof message === "string") {
        return {
          id: `msg-${idx}`,
          role: idx % 2 === 0 ? "user" : "assistant",
          content: message,
        }
      }
      const role =
        message.role === "assistant" || message.role === "system" ? "assistant" : "user"
      const content = typeof message.content === "string" ? message.content : JSON.stringify(message.content)
      return {
        id: message.id || `msg-${idx}`,
        role,
        content,
      }
    })
    .filter((msg): msg is TranscriptMessage => Boolean(msg && msg.content))
}

function normalizeResponses(submission: any) {
  if (submission?.responses && typeof submission.responses === "object") {
    return submission.responses
  }
  if (submission?.respuestas && typeof submission.respuestas === "object") {
    return submission.respuestas
  }
  if (typeof submission === "object" && !Array.isArray(submission)) {
    return submission
  }
  return {}
}

function WorkbookAnswers({ responses, content }: { responses: Record<string, any>; content: any }) {
  const entries = Object.entries(responses).filter(([_, value]) => {
    if (value === null || value === undefined) return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === "string") return value.trim().length > 0
    if (typeof value === "object") return Object.keys(value).length > 0
    return true
  })

  if (entries.length === 0) {
    return <EmptyState message="No encontramos respuestas almacenadas en este cuaderno." />
  }

  const sections = extractSections(content)

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl border bg-white/80 p-3 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">
            {labelFromKey(key, sections)}
          </p>
          <div className="mt-2 text-sm text-foreground">{renderValue(value)}</div>
        </div>
      ))}
    </div>
  )
}

function extractSections(content: any) {
  if (!content || typeof content !== "object") return []
  if (Array.isArray(content.secciones)) return content.secciones
  if (Array.isArray(content?.contenido?.secciones)) {
    return content.contenido.secciones
  }
  return []
}

function labelFromKey(key: string, sections: any[]) {
  const match = key.match(/^s(\d+)_p(\d+)$/i)
  if (match) {
    const sectionIdx = Number(match[1])
    const promptIdx = Number(match[2])
    const section = sections[sectionIdx]
    const prompt = section?.prompts?.[promptIdx]
    if (prompt) {
      const sectionLabel = section?.titulo || `Sección ${sectionIdx + 1}`
      return `${sectionLabel} · ${prompt.pregunta || `Pregunta ${promptIdx + 1}`}`
    }
  }
  return `Campo ${key}`
}

function renderValue(value: any) {
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, idx) => (
          <li key={idx}>{renderValue(item)}</li>
        ))}
      </ul>
    )
  }
  if (typeof value === "object") {
    return (
      <pre className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }
  return <span>{String(value)}</span>
}

function JsonFallback({ data }: { data: any }) {
  return (
    <pre className="rounded-xl border border-dashed bg-muted/20 p-4 text-xs text-muted-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
      {message}
    </div>
  )
}
