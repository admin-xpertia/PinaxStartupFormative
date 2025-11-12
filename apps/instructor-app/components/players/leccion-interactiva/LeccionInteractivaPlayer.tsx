"use client"

import { useMemo } from "react"
import type { LeccionContent, LessonVerificationQuestion, LessonQuestionType } from "@/types/content"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { InteractiveLessonRenderer } from "../../lessons/InteractiveLessonRenderer"

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
  savedData,
  onSave,
  onComplete,
  onExit,
}: LeccionInteractivaPlayerProps) {
  const normalizedContent = useMemo(() => ensureLessonContentHasMarkdown(content), [content])
  const exerciseDescription = useMemo(() => {
    if (normalizedContent.metadata?.objetivoPrincipal) return normalizedContent.metadata.objetivoPrincipal
    if (normalizedContent.metadata?.conceptosClave?.length) {
      return normalizedContent.metadata.conceptosClave.join(" • ")
    }
    return undefined
  }, [normalizedContent])

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={exerciseDescription}
      proofPointName={proofPointName}
      totalSteps={1}
      currentStep={1}
      onSave={onSave}
      onComplete={onComplete}
      onExit={onExit}
      showAIAssistant={false}
    >
      <InteractiveLessonRenderer content={normalizedContent} readOnly />
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
