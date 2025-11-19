"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { exercisesApi } from "@/services/api"
import { cn } from "@/lib/utils"
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback"
import { ProactiveSuggestionCard } from "../cuaderno-trabajo/ProactiveSuggestionCard"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkDirective from "remark-directive"
import rehypeKatex from "rehype-katex"
import { visit } from "unist-util-visit"
import "katex/dist/katex.min.css"
import { BookOpen, ClipboardList, CheckCircle2, Circle } from "lucide-react"
import { useAutoSave } from "@/hooks/useAutoSave"

interface CasoMetadata {
  conceptosClave?: string[]
  tiempoEstimadoMinutos?: number
  nivelNarrativa?: string
}

interface CasoSection {
  id: string
  titulo: string
  instrucciones: string
  placeholder?: string
  criterios_evaluacion_ia?: string[]
  criteriosEvaluacionIa?: string[]
}

interface CasoContent {
  titulo: string
  narrativa_markdown: string
  metadata?: CasoMetadata
  secciones_analisis: CasoSection[]
}

interface CasoPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: CasoContent
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
  readOnly?: boolean
}

type AssistantMessage = { role: "user" | "assistant"; content: string }

const remarkCallout = () => (tree: any) => {
  visit(tree, (node: any) => {
    if (node.type === "containerDirective" && node.name === "callout") {
      const data = node.data || (node.data = {})
      data.hName = "div"
      data.hProperties = {
        className: "case-callout",
      }
    }
  })
}

const markdownComponents: Components = {
  h2: ({ children, ...props }) => (
    <h2 className="mt-8 text-2xl font-semibold text-slate-900" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 text-xl font-semibold text-slate-800" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mt-4 text-base leading-relaxed text-slate-700" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700" {...props}>
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mt-4 border-l-4 border-primary/40 bg-primary/5 px-4 py-2 text-base italic text-slate-800"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code({ node, children, className, ...props }: any) {
    const inline = !className?.includes('language-')
    if (inline) {
      return (
        <code className={cn("rounded bg-slate-100 px-1 py-0.5 text-sm", className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900/90 p-4 text-sm text-slate-50">
        <code>{children}</code>
      </pre>
    )
  },
  div({ node, ...props }: any) {
    if (node?.properties?.className?.toString().includes("case-callout")) {
      return (
        <div
          className="mt-6 rounded-2xl border-l-4 border-amber-400 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-sm"
          {...props}
        />
      )
    }
    return <div {...props} />
  },
}

const normalizeResponseRecord = (raw: any): Record<string, string> => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const entries = Object.entries(raw as Record<string, any>).map(([key, value]) => [
    key,
    typeof value === "string" ? value : typeof value === "number" ? String(value) : "",
  ])
  return Object.fromEntries(entries)
}

export function CasoPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  savedData,
  onSave,
  onComplete,
  onExit,
  readOnly = false,
}: CasoPlayerProps) {
  const sections = Array.isArray(content.secciones_analisis) ? content.secciones_analisis : []
  const initialResponses = normalizeResponseRecord(
    savedData?.responses ?? savedData?.respuestas ?? (typeof savedData === "object" ? savedData : {}),
  )
  const [responses, setResponses] = useState<Record<string, string>>(initialResponses)
  const [activeSectionIndex, setActiveSectionIndex] = useState(() => {
    const persisted =
      typeof savedData?.activeSectionIndex === "number"
        ? savedData.activeSectionIndex
        : typeof savedData?.currentSectionIndex === "number"
          ? savedData.currentSectionIndex
          : 0
    if (sections.length === 0) return 0
    return Math.min(Math.max(0, persisted), sections.length - 1)
  })
  const [proactiveFeedback, setProactiveFeedback] = useState<Record<string, string | null>>({})
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({})

  const answeredCount = useMemo(() => {
    return sections.filter((section) => responses[section.id]?.trim().length).length
  }, [responses, sections])

  const progress = sections.length > 0 ? Math.round((answeredCount / sections.length) * 100) : 0
  const activeSection = sections[activeSectionIndex]
  const canCompleteExercise = useMemo(
    () =>
      sections.length === 0
        ? true
        : sections.every((section) => Boolean(responses[section.id]?.trim().length)),
    [responses, sections],
  )

  const conceptos = content.metadata?.conceptosClave || []
  const estimatedMinutes = content.metadata?.tiempoEstimadoMinutos
  const exerciseDescription = useMemo(() => {
    if (conceptos.length > 0) {
      return `Conceptos clave: ${conceptos.join(" • ")}`
    }
    if (content.metadata?.nivelNarrativa) {
      return content.metadata.nivelNarrativa
    }
    return "Lee la narrativa y desarrolla tu análisis guiado."
  }, [conceptos, content.metadata?.nivelNarrativa])

  const analyzeDraft = useCallback(
    async (sectionId: string, draftText: string) => {
      const trimmed = draftText.trim()

      if (!trimmed || trimmed.length < 30) {
        setProactiveFeedback((prev) => ({ ...prev, [sectionId]: null }))
        setIsAnalyzing((prev) => ({ ...prev, [sectionId]: false }))
        return
      }

      setIsAnalyzing((prev) => ({ ...prev, [sectionId]: true }))
      setProactiveFeedback((prev) => ({ ...prev, [sectionId]: null }))

      try {
        const response = await exercisesApi.analyzeDraft(exerciseId, {
          questionId: sectionId,
          draftText: trimmed,
        })

        setProactiveFeedback((prev) => ({ ...prev, [sectionId]: response.suggestion }))
      } catch (error) {
        console.error("Error analyzing draft:", error)
      } finally {
        setIsAnalyzing((prev) => ({ ...prev, [sectionId]: false }))
      }
    },
    [exerciseId],
  )

  const [debouncedAnalyzeDraft, cancelDebouncedAnalyze] = useDebouncedCallback(
    (sectionId: string, draftText: string) => {
      void analyzeDraft(sectionId, draftText)
    },
    1500,
  )

  useEffect(() => {
    return () => {
      cancelDebouncedAnalyze()
    }
  }, [cancelDebouncedAnalyze])

  const handleResponseChange = useCallback(
    (sectionId: string, value: string) => {
      if (readOnly) return
      setResponses((prev) => ({
        ...prev,
        [sectionId]: value,
      }))

      const trimmed = value.trim()
      if (!trimmed || trimmed.length < 30) {
        cancelDebouncedAnalyze(sectionId)
        setProactiveFeedback((prev) => ({ ...prev, [sectionId]: null }))
        setIsAnalyzing((prev) => ({ ...prev, [sectionId]: false }))
      } else {
        debouncedAnalyzeDraft(sectionId, value)
      }
    },
    [cancelDebouncedAnalyze, debouncedAnalyzeDraft],
  )

  const buildSectionContext = useCallback(
    (section?: CasoSection) => {
      const criterios = section?.criterios_evaluacion_ia ?? section?.criteriosEvaluacionIa ?? []
      const lines = [
        `Titulo del caso: ${content.titulo}`,
        `Narrativa base:\n${content.narrativa_markdown}`,
        section
          ? `Seccion enfocada: ${section.titulo}\nInstrucciones: ${section.instrucciones}`
          : "Trabaja sobre el caso completo.",
        criterios.length ? `Criterios de evaluacion IA:\n- ${criterios.join("\n- ")}` : "",
      ]
      return lines.filter(Boolean).join("\n\n")
    },
    [content.narrativa_markdown, content.titulo],
  )

  const handleAskAssistant = useCallback(
    async (message: string, history: AssistantMessage[]) => {
      const prompt = message.trim()
      if (!prompt) return ""
      const section = activeSection
      const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
        pregunta: prompt,
        seccionId: section?.id || "caso_general",
        seccionTitulo: section?.titulo || content.titulo,
        seccionContenido: buildSectionContext(section),
        historial: history.slice(-10),
        perfilComprension: {
          progreso: progress,
          seccionesRespondidas: answeredCount,
          totalSecciones: sections.length,
        },
      })
      return response.respuesta
    },
    [activeSection, answeredCount, buildSectionContext, content.titulo, exerciseId, progress, sections.length],
  )

  const currentPayload = useMemo(
    () => ({
      responses,
      activeSectionIndex,
      activeSectionId: activeSection?.id,
      answeredCount,
      totalSections: sections.length,
      updatedAt: new Date().toISOString(),
    }),
    [responses, activeSectionIndex, activeSection?.id, answeredCount, sections.length],
  )

  useAutoSave({
    exerciseId,
    data: currentPayload,
    enabled: !readOnly,
    interval: 15000,
  })

  const handleSaveWithData = async () => {
    if (readOnly) return
    await onSave(currentPayload)
  }

  const handleCompleteWithData = async () => {
    if (readOnly) return
    await onComplete(currentPayload)
  }

  const sectionButtons = (
    <div className="flex flex-wrap gap-2">
      {sections.map((section, idx) => {
        const completed = responses[section.id]?.trim().length > 0
        return (
          <Button
            key={section.id}
            variant={idx === activeSectionIndex ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSectionIndex(idx)}
            className={cn(
              "flex items-center gap-2 truncate",
              completed && idx !== activeSectionIndex && "border-green-500 text-green-700",
            )}
          >
            {completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <span className="max-w-[220px] truncate">{section.titulo}</span>
          </Button>
        )
      })}
    </div>
  )

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={exerciseDescription}
      proofPointName={proofPointName}
      totalSteps={Math.max(1, sections.length)}
      currentStep={sections.length > 0 ? activeSectionIndex + 1 : 1}
      estimatedMinutes={estimatedMinutes}
      onSave={!readOnly ? handleSaveWithData : undefined}
      onComplete={!readOnly ? handleCompleteWithData : undefined}
      onPrevious={activeSectionIndex > 0 ? () => setActiveSectionIndex((prev) => prev - 1) : undefined}
      onNext={
        sections.length > 0 && activeSectionIndex < sections.length - 1
          ? () => setActiveSectionIndex((prev) => prev + 1)
          : undefined
      }
      onExit={onExit}
      showAIAssistant={true}
      aiContext={activeSection?.titulo || content.titulo}
      onAskAssistant={handleAskAssistant}
      contentMaxWidthClassName="max-w-[1400px]"
      canComplete={!readOnly && canCompleteExercise}
    >
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-slate-700">
              <BookOpen className="h-4 w-4 text-primary" />
              {sections.length} secciones de análisis
            </span>
            {estimatedMinutes && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
                ⏱ {estimatedMinutes} min
              </span>
            )}
            {conceptos.slice(0, 3).map((concept) => (
              <Badge key={concept} variant="secondary">
                {concept}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="max-h-[75vh] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                Narrativa del Caso
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Lee detalladamente la situación antes de formular tus hipótesis y recomendaciones.
              </p>
            </CardHeader>
            <CardContent>
              <div className="case-markdown max-h-[60vh] overflow-y-auto pr-2">
                <CaseMarkdown markdown={content.narrativa_markdown} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progreso del Análisis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{answeredCount} secciones completadas</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  Completa cada sección argumentando con evidencia explícita de la narrativa.
                </p>
              </CardContent>
            </Card>

            {sections.length > 0 && (
              <>
                {sectionButtons}
                {activeSection && (
                  <Card className="border-primary/30">
                    <CardHeader>
                      <CardTitle>{activeSection.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground">{activeSection.instrucciones}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(activeSection.criterios_evaluacion_ia?.length ||
                        activeSection.criteriosEvaluacionIa?.length) && (
                        <div className="rounded-2xl bg-muted/50 p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Criterios de la IA
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            {(activeSection.criterios_evaluacion_ia ?? activeSection.criteriosEvaluacionIa ?? []).map(
                              (criterio, idx) => (
                                <li key={`${activeSection.id}-criterio-${idx}`}>{criterio}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                      <Textarea
                        value={responses[activeSection.id] || ""}
                        onChange={(event) => handleResponseChange(activeSection.id, event.target.value)}
                        placeholder={activeSection.placeholder || "Escribe tu análisis fundamentado aquí..."}
                        disabled={readOnly}
                        className={cn(
                          "min-h-[220px]",
                          readOnly && "bg-muted text-muted-foreground resize-none",
                        )}
                      />
                      <div className="mt-4 mb-2">
                        {!readOnly && (
                          <ProactiveSuggestionCard
                            isAnalyzing={isAnalyzing[activeSection.id]}
                            suggestion={proactiveFeedback[activeSection.id]}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Referencia siempre evidencia concreta del caso y anticipa contraargumentos.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mapa de Secciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {sections.map((section, idx) => {
                    const filled = responses[section.id]?.trim().length > 0
                    return (
                      <li key={`overview-${section.id}`} className="flex items-start gap-2">
                        {filled ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">
                            Sección {idx + 1}: {section.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground">{section.instrucciones}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ExercisePlayer>
  )
}

function CaseMarkdown({ markdown }: { markdown?: string }) {
  if (!markdown) {
    return <p className="text-sm text-muted-foreground">La narrativa aún no está disponible.</p>
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkCallout]}
      rehypePlugins={[rehypeKatex]}
      components={markdownComponents}
    >
      {markdown}
    </ReactMarkdown>
  )
}
