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
  type LessonProgressState,
  type QuestionUIState,
} from "../../lessons/InteractiveLessonRenderer"
import { exercisesApi } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

const defaultProfile = {
  correctas: 0,
  incorrectas: 0,
  parciales: 0,
  preguntasDificiles: [] as string[],
}

const deriveProfileFromState = (state: Record<string, QuestionUIState> = {}) => {
  const next = { ...defaultProfile }

  Object.entries(state).forEach(([questionId, info]) => {
    if (info.status === "correcto") {
      next.correctas += 1
    } else if (info.status === "parcialmente_correcto") {
      next.parciales += 1
      next.preguntasDificiles.push(questionId)
    } else if (info.status === "incorrecto") {
      next.incorrectas += 1
      next.preguntasDificiles.push(questionId)
    }
  })

  next.preguntasDificiles = Array.from(new Set(next.preguntasDificiles))
  return next
}

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

export function LeccionInteractivaPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
  savedData,
}: LeccionInteractivaPlayerProps) {
  const normalizedContent = useMemo(() => ensureLessonContentHasMarkdown(content), [content])
  const [sections, setSections] = useState<LessonSectionInfo[]>([])
  const [currentSection, setCurrentSection] = useState<LessonSectionInfo | null>(null)

  // Store initial state separately from the synced state
  const initialLessonState = useMemo(() => ({
    questionState: savedData?.questionState || {},
    attempts: savedData?.attempts || {},
    currentSectionId: savedData?.currentSectionId ?? null,
  }), []) // Empty deps - only initialize once

  const [lessonState, setLessonState] = useState<LessonProgressState>(initialLessonState)
  const [profile, setProfile] = useState(() =>
    savedData?.profile ? { ...defaultProfile, ...savedData.profile } : deriveProfileFromState(savedData?.questionState)
  )
  const { toast } = useToast()

  const exerciseDescription = useMemo(() => {
    if (normalizedContent.metadata?.objetivoPrincipal) return normalizedContent.metadata.objetivoPrincipal
    if (normalizedContent.metadata?.conceptosClave?.length) {
      return normalizedContent.metadata.conceptosClave.join(" • ")
    }
    return undefined
  }, [normalizedContent])

  const handleQuestionResult = useCallback(
    (payload: QuestionResultPayload) => {
      setProfile((prev: typeof defaultProfile) => ({
        correctas: payload.status === "correcto" ? prev.correctas + 1 : prev.correctas,
        incorrectas: payload.status === "incorrecto" ? prev.incorrectas + 1 : prev.incorrectas,
        parciales: payload.status === "parcialmente_correcto" ? prev.parciales + 1 : prev.parciales,
        preguntasDificiles:
          payload.status === "incorrecto" || payload.status === "parcialmente_correcto"
            ? Array.from(new Set([...prev.preguntasDificiles, payload.questionId]))
            : prev.preguntasDificiles,
      }))

      // Mostrar toast según el resultado
      if (payload.status === "correcto") {
        toast({
          title: "¡Excelente!",
          description: "Respuesta correcta. Sigue así.",
          variant: "default",
        })
      } else if (payload.status === "parcialmente_correcto") {
        toast({
          title: "Parcialmente correcto",
          description: "Vas por buen camino, pero revisa algunos detalles.",
          variant: "default",
        })
      }
    },
    [toast]
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

  const syncLessonState = useCallback(
    (state: LessonProgressState) => {
      setLessonState((prev) => {
        const nextSectionId = state.currentSectionId ?? prev.currentSectionId
        const noChange =
          prev.questionState === state.questionState &&
          prev.attempts === state.attempts &&
          prev.currentSectionId === nextSectionId

        if (noChange) {
          return prev
        }

        return {
          ...prev,
          questionState: state.questionState,
          attempts: state.attempts,
          currentSectionId: nextSectionId,
        }
      })
    },
    []
  )

  // Remove this effect - savedData is only used for initialization
  // Syncing back from savedData would cause loops

  const buildProgressPayload = useCallback(() => {
    return {
      ...lessonState,
      currentSectionId: currentSection?.id ?? lessonState.currentSectionId ?? null,
      profile,
    }
  }, [currentSection?.id, lessonState, profile])

  const handlePersistedSave = useCallback(async () => {
    const payload = buildProgressPayload()
    await onSave(payload)
  }, [buildProgressPayload, onSave])

  const handlePersistedComplete = useCallback(async () => {
    const payload = buildProgressPayload()
    await onComplete(payload)
  }, [buildProgressPayload, onComplete])

  const handleAssistantMessageStream = useCallback(
    async (
      message: string,
      history: Array<{ role: "user" | "assistant"; content: string }>,
      callbacks: {
        onStart?: () => void
        onChunk: (chunk: string) => void
        onDone: (referencias: string[]) => void
        onError?: (error: string) => void
      }
    ): Promise<void> => {
      try {
        await exercisesApi.sendLessonAssistantMessageStream(
          exerciseId,
          {
            pregunta: message,
            seccionId: currentSection?.id || "leccion",
            seccionTitulo: currentSection?.title || normalizedContent.metadata?.titulo || proofPointName,
            seccionContenido: currentSection?.content || sections[0]?.content || normalizedContent.markdown,
            historial: history,
            perfilComprension: comprehensionProfile,
          },
          callbacks
        )
      } catch (error) {
        console.error("Error al consultar IA con streaming:", error)
        callbacks.onError?.("No pude consultar a la IA en este momento. Intenta nuevamente en unos segundos.")
      }
    },
    [
      comprehensionProfile,
      normalizedContent.markdown,
      normalizedContent.metadata?.titulo,
      currentSection,
      exerciseId,
      proofPointName,
      sections
    ]
  )

  const handleAssistantMessage = useCallback(
    async (message: string, history: Array<{ role: "user" | "assistant"; content: string }>): Promise<string> => {
      try {
        const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
          pregunta: message,
          seccionId: currentSection?.id || "leccion",
          seccionTitulo: currentSection?.title || normalizedContent.metadata?.titulo || proofPointName,
          seccionContenido: currentSection?.content || sections[0]?.content || normalizedContent.markdown,
          historial: history,
          perfilComprension: comprehensionProfile,
        })

        return response.respuesta
      } catch (error) {
        console.error("Error al consultar IA:", error)
        return "No pude consultar a la IA en este momento. Intenta nuevamente en unos segundos."
      }
    },
    [
      comprehensionProfile,
      normalizedContent.markdown,
      normalizedContent.metadata?.titulo,
      currentSection,
      exerciseId,
      proofPointName,
      sections,
    ]
  )

  // Criterio para permitir completar: que haya respondido al menos el 70% de las preguntas correctamente o parcialmente
  const canFinish = useMemo(() => {
    const totalPreguntas = normalizedContent.preguntasVerificacion?.length || 0
    if (totalPreguntas === 0) return true // Si no hay preguntas, puede completar

    const respuestasValidas = profile.correctas + profile.parciales
    const porcentajeCompletado = (respuestasValidas / totalPreguntas) * 100

    return porcentajeCompletado >= 70
  }, [profile, normalizedContent.preguntasVerificacion])

  const handleSectionChange = useCallback(
    (section: LessonSectionInfo | null) => {
      setCurrentSection((prevSection) => {
        const nextId = section?.id || null
        const prevId = prevSection?.id || null
        if (prevId === nextId) {
          return prevSection
        }
        return section
      })

      setLessonState((prev) => {
        const nextId = section?.id ?? prev.currentSectionId ?? null
        if (prev.currentSectionId === nextId) {
          return prev
        }
        return {
          ...prev,
          currentSectionId: nextId,
        }
      })
    },
    []
  )

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={exerciseDescription}
      proofPointName={proofPointName}
      totalSteps={1}
      contentMaxWidthClassName="max-w-4xl"
      currentStep={1}
      onSave={handlePersistedSave}
      onComplete={handlePersistedComplete}
      onExit={onExit}
      showAIAssistant={true}
      aiContext={currentSection?.title || normalizedContent.metadata?.titulo || "Lección General"}
      onAskAssistant={handleAssistantMessage}
      onAskAssistantStream={handleAssistantMessageStream}
      canComplete={canFinish}
    >
      <InteractiveLessonRenderer
        content={normalizedContent}
        onSectionsMetadata={setSections}
        onSectionChange={handleSectionChange}
        onQuestionResult={handleQuestionResult}
        onRequestDeepDive={(_, prompt) => {
          // Deep dive functionality can be integrated with AI assistant if needed
          console.log("Deep dive requested:", prompt)
        }}
        evaluateShortAnswer={handleEvaluateShortAnswer}
        initialState={initialLessonState}
        onStateChange={syncLessonState}
      />
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
