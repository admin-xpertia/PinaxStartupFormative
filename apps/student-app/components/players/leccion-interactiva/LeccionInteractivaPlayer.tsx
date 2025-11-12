"use client"

import { useMemo, useState, useCallback } from "react"
import type {
  LeccionContent,
  LessonVerificationQuestion,
  LessonQuestionType,
} from "@shared-types/content"
import { ExercisePlayer } from "../base/ExercisePlayer"
import {
  InteractiveLessonRenderer,
  type LessonSectionInfo,
  type QuestionResultPayload,
  type EvaluateShortAnswerInput,
  type EvaluateShortAnswerResult,
} from "../../lessons/InteractiveLessonRenderer"
import { exercisesApi } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, MessageCircle, Sparkles } from "lucide-react"

interface LeccionInteractivaPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: LeccionContent
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
}

type AssistantMessage = {
  role: "user" | "assistant"
  content: string
}

const defaultSuggestions = [
  "¿Puedes resumir esta sección?",
  "Dame un ejemplo aplicado",
  "¿Cuál sería el siguiente paso?",
]

export function LeccionInteractivaPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
}: LeccionInteractivaPlayerProps) {
  const normalizedContent = useMemo(() => ensureLessonContentHasMarkdown(content), [content])
  const [sections, setSections] = useState<LessonSectionInfo[]>([])
  const [currentSection, setCurrentSection] = useState<LessonSectionInfo | null>(null)
  const [aiMessages, setAiMessages] = useState<AssistantMessage[]>([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(true)
  const [profile, setProfile] = useState({
    correctas: 0,
    incorrectas: 0,
    parciales: 0,
    preguntasDificiles: [] as string[],
  })

  const exerciseDescription = useMemo(() => {
    if (normalizedContent.metadata?.objetivoPrincipal) return normalizedContent.metadata.objetivoPrincipal
    if (normalizedContent.metadata?.conceptosClave?.length) {
      return normalizedContent.metadata.conceptosClave.join(" • ")
    }
    return undefined
  }, [normalizedContent])

  const handleQuestionResult = useCallback(
    (payload: QuestionResultPayload) => {
      setProfile((prev) => ({
        correctas: payload.status === "correcto" ? prev.correctas + 1 : prev.correctas,
        incorrectas: payload.status === "incorrecto" ? prev.incorrectas + 1 : prev.incorrectas,
        parciales: payload.status === "parcialmente_correcto" ? prev.parciales + 1 : prev.parciales,
        preguntasDificiles:
          payload.status === "incorrecto" || payload.status === "parcialmente_correcto"
            ? Array.from(new Set([...prev.preguntasDificiles, payload.questionId]))
            : prev.preguntasDificiles,
      }))
    },
    []
  )

  const handleEvaluateShortAnswer = useCallback(
    async ({ question, answer, section }: EvaluateShortAnswerInput): Promise<EvaluateShortAnswerResult> => {
      const response = await exercisesApi.evaluateLessonQuestion(exerciseId, {
        preguntaId: question.id,
        tipoPregunta: "respuesta_corta",
        enunciado: question.enunciado,
        respuestaEstudiante: answer,
        criteriosEvaluacion: question.criteriosEvaluacion || [],
        seccionContenido: section?.content || normalizedContent.markdown,
        seccionTitulo: section?.title || normalizedContent.metadata?.titulo || proofPointName,
        perfilComprension: {
          correctas: profile.correctas,
          incorrectas: profile.incorrectas,
          parciales: profile.parciales,
        },
      })

      return {
        score: response.score,
        feedback: response.feedback,
        sugerencias: response.sugerencias,
      }
    },
    [normalizedContent.markdown, normalizedContent.metadata?.titulo, exerciseId, profile, proofPointName]
  )

  const comprehensionProfile = useMemo(
    () => ({
      correctas: profile.correctas,
      incorrectas: profile.incorrectas,
      parciales: profile.parciales,
      preguntasDificiles: profile.preguntasDificiles,
    }),
    [profile]
  )

  const handleAssistantMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return
      const trimmed = message.trim()
      const historyWithUser = [
        ...aiMessages.slice(-9),
        {
          role: "user" as const,
          content: trimmed,
        },
      ]

      setAiMessages(historyWithUser)
      setAiInput("")
      setAiLoading(true)

      try {
        const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
          pregunta: trimmed,
          seccionId: currentSection?.id || "leccion",
          seccionTitulo: currentSection?.title || normalizedContent.metadata?.titulo || proofPointName,
          seccionContenido: currentSection?.content || sections[0]?.content || normalizedContent.markdown,
          historial: historyWithUser,
          perfilComprension: comprehensionProfile,
        })

        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.respuesta,
          },
        ])
      } catch (error) {
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "No pude consultar a la IA en este momento. Intenta nuevamente en unos segundos.",
          },
        ])
      } finally {
        setAiLoading(false)
      }
    },
    [
      aiMessages,
      comprehensionProfile,
      normalizedContent.markdown,
      normalizedContent.metadata?.titulo,
      currentSection,
      exerciseId,
      proofPointName,
      sections,
    ]
  )

  const handleDeepDive = useCallback((prompt: string) => {
    setAssistantOpen(true)
    setAiInput(prompt)
  }, [])

  const layout = (
    <div className="flex w-full flex-col gap-8 xl:flex-row xl:items-start">
      <div className="flex-1">
        <InteractiveLessonRenderer
          content={normalizedContent}
          onSectionsMetadata={setSections}
          onSectionChange={setCurrentSection}
          onQuestionResult={handleQuestionResult}
          onRequestDeepDive={(_, prompt) => prompt && handleDeepDive(prompt)}
          evaluateShortAnswer={handleEvaluateShortAnswer}
        />
      </div>

      <Card className="lg:w-[360px]">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Tutor IA</p>
            <CardTitle className="mt-1 flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              Pregunta al mentor
            </CardTitle>
            <p className="text-xs text-muted-foreground">
            Contexto: {currentSection?.title || normalizedContent.metadata?.titulo}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setAssistantOpen((prev) => !prev)}
          >
            {assistantOpen ? "Ocultar" : "Mostrar"}
          </Button>
        </CardHeader>
        {assistantOpen && (
          <>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Perfil de Comprensión</p>
                <p>
                  ✓ {profile.correctas} respondidas correctamente • ∆ {profile.parciales} parciales • !{" "}
                  {profile.incorrectas} por reforzar
                </p>
              </div>

              <ScrollArea className="h-64 rounded-2xl border border-muted">
                <div className="space-y-3 p-3">
                  {aiMessages.length === 0 && (
                    <div className="rounded-xl border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
                      Explica qué parte no quedó clara o pregúntame por un ejemplo.
                    </div>
                  )}
                  {aiMessages.map((message, idx) => (
                    <div
                      key={`assistant-msg-${idx}`}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm shadow ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-white text-slate-800"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Elaborando respuesta...
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex flex-wrap gap-2">
                {defaultSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-wrap"
                    onClick={() => setAiInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>

              <div className="space-y-2 rounded-2xl border border-muted bg-white/80 p-3 shadow-inner">
                <Textarea
                  value={aiInput}
                  placeholder="Formula tu pregunta..."
                  onChange={(event) => setAiInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      handleAssistantMessage(aiInput)
                    }
                  }}
                  className="min-h-[90px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleAssistantMessage(aiInput)}
                    disabled={!aiInput.trim() || aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Pensando...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={exerciseDescription}
      proofPointName={proofPointName}
      totalSteps={1}
      contentMaxWidthClassName="max-w-6xl"
      currentStep={1}
      onSave={onSave}
      onComplete={onComplete}
      onExit={onExit}
      showAIAssistant={false}
    >
      {layout}
    </ExercisePlayer>
  )
}

const slugify = (value: string, fallback: string) => {
  if (!value || typeof value !== "string") return fallback
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-") || fallback
}

function ensureLessonContentHasMarkdown(raw: LeccionContent): LeccionContent {
  if (raw?.markdown && raw.markdown.trim().length > 0) {
    return raw
  }

  const legacy: any = raw || {}
  const mdParts: string[] = []
  const legacySections: Array<{ titulo?: string; contenido?: string; items?: string[] }> = Array.isArray(
    legacy.secciones,
  )
    ? legacy.secciones
    : []
  const sectionIds: string[] = []

  if (legacy.titulo) {
    mdParts.push(`# ${legacy.titulo}`)
  }

  if (legacy.introduccion) {
    mdParts.push(legacy.introduccion)
  }

  legacySections.forEach((section, index) => {
    const title = section.titulo || `Sección ${index + 1}`
    const sectionId = slugify(title, `seccion-${index + 1}`)
    sectionIds.push(sectionId)
    mdParts.push(`## ${title}`)
    if (section.contenido) {
      mdParts.push(section.contenido)
    }
    if (Array.isArray(section.items) && section.items.length > 0) {
      mdParts.push(section.items.map((item) => `- ${item}`).join("\n"))
    }
  })

  if (Array.isArray(legacy.conceptos_clave) && legacy.conceptos_clave.length > 0) {
    mdParts.push(
      `### Conceptos Clave\n${legacy.conceptos_clave
        .map((concepto: string) => `- ${concepto}`)
        .join("\n")}`,
    )
  }

  const markdown = mdParts.join("\n\n").trim()

  const preguntas: LessonVerificationQuestion[] =
    raw.preguntasVerificacion && raw.preguntasVerificacion.length > 0
      ? raw.preguntasVerificacion
      : normalizeLegacyQuiz(legacy.quiz, sectionIds)

  return {
    ...raw,
    markdown,
    metadata: raw.metadata ?? {
      titulo: legacy.titulo || "Lección Interactiva",
      duracionMinutos: legacy.duracion_minutos || 20,
      dificultad: legacy.dificultad || "intermedio",
      conceptosClave: legacy.conceptos_clave || [],
      nivelNarrativa: "narrativo",
      objetivoPrincipal: legacy.objetivo || "",
    },
    glosario: raw.glosario ?? legacy.glosario ?? [],
    preguntasVerificacion: preguntas,
  }
}

function normalizeLegacyQuiz(
  quiz: Array<{
    pregunta: string
    tipo?: string
    opciones?: string[]
    respuesta_correcta?: string | string[]
    explicacion?: string
  }> = [],
  sectionIds: string[],
): LessonVerificationQuestion[] {
  return quiz.map((question, index) => {
    const opciones =
      question.tipo === "verdadero_falso"
        ? (["Verdadero", "Falso"] as string[])
        : Array.isArray(question.opciones)
          ? question.opciones
          : []

    const optionObjects = opciones.map((texto, optionIdx) => ({
      id: `legacy-${index}-${optionIdx}`,
      texto,
      esCorrecta: false,
    }))

    const expectedValues = Array.isArray(question.respuesta_correcta)
      ? question.respuesta_correcta
      : question.respuesta_correcta
        ? [question.respuesta_correcta]
        : []

    const respuestaCorrecta = expectedValues
      .map((value) => {
        const match = optionObjects.find((opt) => opt.texto === value)
        if (match) {
          match.esCorrecta = true
          return match.id
        }
        return null
      })
      .filter(Boolean) as string[]

    if (respuestaCorrecta.length === 0 && optionObjects[0]) {
      respuestaCorrecta.push(optionObjects[0].id)
      optionObjects[0].esCorrecta = true
    }

    return {
      id: `legacy-question-${index}`,
      seccionId: sectionIds[Math.min(index, sectionIds.length - 1)] || sectionIds[0] || "leccion",
      tipo: (question.tipo as LessonQuestionType) || "multiple_choice",
      enunciado: question.pregunta,
      opciones: optionObjects,
      respuestaCorrecta,
      criteriosEvaluacion: [],
      feedback: {
        correcto: question.explicacion || "¡Correcto!",
        incorrecto: question.explicacion || "Revisa el contenido y vuelve a intentarlo.",
      },
      accionChatSugerida: question.explicacion
        ? `No entiendo la explicación de "${question.explicacion}". ¿Puedes verla desde otro ángulo?`
        : undefined,
    }
  })
}
