'use client'

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkDirective from "remark-directive"
import rehypeKatex from "rehype-katex"
import { visit } from "unist-util-visit"
import type { Components } from "react-markdown"
import type { Heading, Text } from "mdast"
import type { GlossaryEntry, LeccionContent, LessonVerificationQuestion } from "@shared-types/content"
import "katex/dist/katex.min.css"
import { Lightbulb } from "lucide-react"

export interface LessonSectionInfo {
  id: string
  title: string
  content: string
  index: number
}

export interface EvaluateShortAnswerInput {
  question: LessonVerificationQuestion
  answer: string
  section: LessonSectionInfo | undefined
}

export interface EvaluateShortAnswerResult {
  score: "correcto" | "parcialmente_correcto" | "incorrecto"
  feedback: string
  sugerencias?: string[]
}

export interface QuestionResultPayload {
  questionId: string
  status: "correcto" | "incorrecto" | "parcialmente_correcto"
  attempts: number
}

export interface InteractiveLessonRendererProps {
  content: LeccionContent
  readOnly?: boolean
  onSectionChange?: (section: LessonSectionInfo | null) => void
  onSectionsMetadata?: (sections: LessonSectionInfo[]) => void
  onQuestionResult?: (payload: QuestionResultPayload) => void
  onRequestDeepDive?: (question: LessonVerificationQuestion, prompt: string) => void
  evaluateShortAnswer?: (input: EvaluateShortAnswerInput) => Promise<EvaluateShortAnswerResult>
  initialState?: Partial<LessonProgressState>
  onStateChange?: (state: LessonProgressState) => void
}

export interface QuestionUIState {
  selectedOptionIds?: string[]
  answerText?: string
  status?: "idle" | "checking" | "correcto" | "incorrecto" | "parcialmente_correcto"
  feedback?: string
  suggestions?: string[]
}

export interface LessonProgressState {
  questionState: Record<string, QuestionUIState>
  attempts: Record<string, number>
  currentSectionId: string | null
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")

const extractSections = (markdown?: string): LessonSectionInfo[] => {
  const safeMarkdown = typeof markdown === "string" ? markdown : ""
  const lines = safeMarkdown.split("\n")
  const sections: LessonSectionInfo[] = []
  let current: LessonSectionInfo | null = null
  const pushCurrent = () => {
    if (current) {
      sections.push({
        ...current,
        content: current.content.trim(),
      })
    }
  }

  lines.forEach((line) => {
    const headingMatch = line.match(/^##\s+(.*)/)
    if (headingMatch) {
      pushCurrent()
      const title = headingMatch[1].trim()
      current = {
        id: slugify(title),
        title,
        content: "",
        index: sections.length,
      }
    } else if (current) {
      current.content += `${line}\n`
    }
  })

  pushCurrent()
  return sections
}

const shallowEqualRecord = (a?: Record<string, any>, b?: Record<string, any>) => {
  if (a === b) return true
  if (!a || !b) return false
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key) => a[key] === b[key])
}

const normalizeLooseExampleBlocks = (markdown?: string): string => {
  const text = typeof markdown === "string" ? markdown : ""
  if (!text || !text.toLowerCase().includes("example {")) return text

  let result = ""
  let cursor = 0
  const lower = text.toLowerCase()

  while (cursor < text.length) {
    const nextIdx = lower.indexOf("example {", cursor)
    if (nextIdx === -1) {
      result += text.slice(cursor)
      break
    }

    // Skip if inside a fenced code block
    const fencesBefore = (text.slice(0, nextIdx).match(/```/g) || []).length
    if (fencesBefore % 2 === 1) {
      result += text.slice(cursor, nextIdx + "example {".length)
      cursor = nextIdx + "example {".length
      continue
    }

    const braceStart = text.indexOf("{", nextIdx)
    if (braceStart === -1) {
      result += text.slice(cursor)
      break
    }

    let depth = 0
    let inString = false
    let endIdx = -1

    for (let i = braceStart; i < text.length; i++) {
      const char = text[i]
      const prev = text[i - 1]

      if (char === '"' && prev !== "\\") {
        inString = !inString
      }

      if (!inString) {
        if (char === "{") depth += 1
        if (char === "}") depth -= 1
        if (depth === 0) {
          endIdx = i
          break
        }
      }
    }

    if (endIdx === -1) {
      result += text.slice(cursor)
      break
    }

    const rawBlock = text.slice(braceStart, endIdx + 1)
    const cleanedBlock = rawBlock
      .split("\n")
      .map((line) => line.replace(/^\s*>\s?/, "").trimEnd())
      .join("\n")
      .trim()

    const jsonBlock = cleanedBlock.startsWith("{") ? cleanedBlock : `{${cleanedBlock}`
    result += `${text.slice(cursor, nextIdx)}\n\n\`\`\`example\n${jsonBlock}\n\`\`\`\n\n`
    cursor = endIdx + 1
  }

  return result
}

const remarkCallout = () => (tree: any) => {
  visit(tree, (node: any) => {
    if (node.type === "containerDirective" && node.name === "callout") {
      const data = node.data || (node.data = {})
      data.hName = "div"
      data.hProperties = {
        className: "lesson-callout",
      }
    }
  })
}

const remarkGlossary = (glossary: GlossaryEntry[] | undefined) => () => (tree: any) => {
  if (!glossary || glossary.length === 0) return

  visit(tree, "text", (node: Text, index: number | undefined, parent: any) => {
    if (!parent || ["link", "code", "inlineCode"].includes(parent.type)) {
      return
    }

    const value = node.value
    if (!value || typeof value !== "string") return

    const matches: Array<{
      start: number
      end: number
      entry: GlossaryEntry
      matchText: string
    }> = []

    glossary.forEach((entry) => {
      const regex = new RegExp(`\\b(${escapeRegExp(entry.termino)})\\b`, "gi")
      let match
      while ((match = regex.exec(value)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          entry,
          matchText: match[0],
        })
      }
    })

    if (matches.length === 0) return
    matches.sort((a, b) => a.start - b.start)

    const segments: any[] = []
    let cursor = 0

    matches.forEach((match) => {
      if (match.start < cursor) {
        return
      }

      const before = value.slice(cursor, match.start)
      if (before) {
        segments.push({
          type: "text",
          value: before,
        })
      }

      segments.push({
        type: "glossaryTerm",
        data: {
          hName: "span",
          hProperties: {
            className: "lesson-glossary-term",
            "data-term": match.entry.termino,
            "data-definition": match.entry.definicion,
          },
        },
        children: [
          {
            type: "text",
            value: match.matchText,
          },
        ],
      })

      cursor = match.end
    })

    const after = value.slice(cursor)
    if (after) {
      segments.push({
        type: "text",
        value: after,
      })
    }

    if (parent && Array.isArray(parent.children) && index !== undefined) {
      parent.children.splice(index, 1, ...segments)
    }
  })
}

const getNodeText = (node: Heading | any): string => {
  if (!node) return ""
  if (node.type === "text") {
    return node.value || ""
  }
  if (!node.children) return ""
  return node.children.map((child: any) => getNodeText(child)).join("")
}

const defaultQuestionState: QuestionUIState = {
  selectedOptionIds: [],
  status: "idle",
}

const isArrayEqual = (a: string[] = [], b: string[] = []) => {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, idx) => value === sortedB[idx])
}

const VerificationShell = ({
  status,
  children,
}: {
  status?: QuestionUIState["status"]
  children: React.ReactNode
}) => {
  const borderClass =
    status === "correcto"
      ? "border-green-500 bg-green-50/80"
      : status === "incorrecto"
        ? "border-red-500 bg-red-50/80"
        : status === "parcialmente_correcto"
          ? "border-amber-400 bg-amber-50/80"
          : "border-slate-200 bg-white"

  return (
    <div className={`rounded-2xl border p-6 shadow-sm transition-colors ${borderClass}`}>
      {children}
    </div>
  )
}

const GlossaryTerm = ({
  term,
  definition,
  children,
}: {
  term: string
  definition: string
  children: React.ReactNode
}) => {
  const [visible, setVisible] = useState(false)
  return (
    <span
      className="relative cursor-help border-b border-dotted border-cyan-400 text-cyan-700 hover:text-cyan-600"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <span
        className={`pointer-events-none absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-xl ${
          visible ? "opacity-100" : "opacity-0"
        } transition-opacity duration-150`}
      >
        <span className="mb-1 block text-[0.65rem] uppercase tracking-wide text-slate-400">
          {term}
        </span>
        {definition}
      </span>
    </span>
  )
}

interface LessonExampleMetric {
  label: string
  value: string
}

interface LessonExampleCase {
  title: string
  description?: string
  details: LessonExampleMetric[]
}

interface LessonExampleNormalizedData {
  id?: string
  title: string
  subtitle?: string
  context?: string
  bullets: string[]
  cases: LessonExampleCase[]
  metrics: LessonExampleMetric[]
  result?: string
  action?: string
}

const parseExampleBlock = (raw: string): LessonExampleNormalizedData | null => {
  const parsed = parseJsonWithFallback(raw)
  if (!parsed) return null
  return normalizeExampleData(parsed)
}

const parseJsonWithFallback = (raw: string): any | null => {
  try {
    return JSON.parse(raw)
  } catch {
    try {
      const normalized = raw
        .replace(/\\r/g, "")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
      return JSON.parse(normalized)
    } catch {
      return null
    }
  }
}

const normalizeExampleData = (raw: any): LessonExampleNormalizedData | null => {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const title = raw.titulo || raw.title || raw.heading || "Ejemplo aplicado"
  const subtitle = raw.subtitulo || raw.summary || raw.descripcion || raw.subtitle
  const contextText = raw.contexto || raw.context || raw.escenario || raw.scenario || raw.descripcion
  const bullets = toStringArray(raw.pasos || raw.steps || raw.bullets || raw.hallazgos || raw.claves || raw.highlights)
  const cases = toCaseArray(raw.casos || raw.examples || raw.ejemplos || raw.case || raw.variantes)
  const metrics = toMetricsArray(raw.metricas || raw.metrics || raw.datos || raw.tabla || raw.datosComparativos)
  const resultText = raw.resultado || raw.result || raw.insight || raw.conclusion
  const action = raw.accion || raw.callToAction || raw.siguientePaso || raw.nextStep

  return {
    id: raw.id,
    title: String(title),
    subtitle: subtitle ? String(subtitle) : undefined,
    context: contextText ? String(contextText) : undefined,
    bullets,
    cases,
    metrics,
    result: resultText ? String(resultText) : undefined,
    action: action ? String(action) : undefined,
  }
}

const toStringArray = (value: any): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry : String(entry)))
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(/\n|•/g)
      .map((segment) => segment.trim())
      .filter(Boolean)
  }
  return []
}

const toCaseArray = (value: any): LessonExampleCase[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(normalizeCase).filter(Boolean) as LessonExampleCase[]
  }
  const normalized = normalizeCase(value)
  return normalized ? [normalized] : []
}

const normalizeCase = (value: any): LessonExampleCase | null => {
  if (!value || typeof value !== "object") {
    return null
  }

  const title = value.titulo || value.title || value.nombre || value.heading || value.label
  if (!title) {
    return null
  }

  const description =
    value.descripcion || value.description || value.detalle || value.contexto || value.summary

  return {
    title: String(title),
    description: description ? String(description) : undefined,
    details: toMetricsArray(value.detalles || value.datos || value.metrics || value.puntos),
  }
}

const toMetricsArray = (value: any): LessonExampleMetric[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const label = entry.label || entry.etiqueta || entry.nombre || entry.title
          const metricValue =
            entry.value || entry.valor || entry.descripcion || entry.detalle || entry.metrica
          if (label && metricValue) {
            return { label: String(label), value: String(metricValue) }
          }
        }
        return null
      })
      .filter(Boolean) as LessonExampleMetric[]
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([label, metricValue]) => ({
      label,
      value: typeof metricValue === "string" ? metricValue : JSON.stringify(metricValue),
    }))
  }

  return []
}

const LessonExampleCard = ({ data }: { data: LessonExampleNormalizedData }) => {
  const hasList = data.bullets.length > 0
  const hasCases = data.cases.length > 0
  const hasMetrics = data.metrics.length > 0

  return (
    <div className="w-full max-w-[900px] mx-auto whitespace-normal break-words hyphens-auto [overflow-wrap:anywhere] overflow-visible rounded-3xl border border-amber-100 bg-amber-50/70 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
        <Lightbulb className="h-4 w-4" />
        Ejemplo práctico
      </div>
      <h3 className="mt-2 text-2xl font-semibold text-slate-900">{data.title}</h3>
      {data.subtitle && <p className="mt-1 text-sm text-slate-600">{data.subtitle}</p>}
      {data.context && <p className="mt-4 text-base text-slate-800">{data.context}</p>}

      {hasList && (
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {data.bullets.map((item, idx) => (
            <li key={`example-bullet-${idx}`} className="flex gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {hasCases && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {data.cases.map((item, idx) => (
            <div
              key={`example-case-${idx}`}
              className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">{item.title}</p>
              {item.description && <p className="mt-1 text-sm text-slate-700">{item.description}</p>}
              {item.details.length > 0 && (
                <dl className="mt-3 space-y-1 text-sm text-slate-600">
                  {item.details.map((detail, detailIdx) => (
                    <div
                      key={`example-case-detail-${idx}-${detailIdx}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <dt className="font-medium text-slate-500">{detail.label}</dt>
                      <dd className="text-slate-900">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMetrics && (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {data.metrics.map((metric, idx) => (
            <div
              key={`example-metric-${idx}`}
              className="rounded-2xl border border-amber-100 bg-white/80 p-4"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                {metric.label}
              </dt>
              <dd className="text-lg font-semibold text-slate-900">{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {data.result && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-white/90 p-4 text-sm text-slate-800">
          <p className="font-semibold text-amber-700">Resultado clave</p>
          <p className="mt-1">{data.result}</p>
        </div>
      )}

      {data.action && (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          {data.action}
        </div>
      )}
    </div>
  )
}

export function InteractiveLessonRenderer({
  content,
  readOnly = false,
  onSectionChange,
  onSectionsMetadata,
  onQuestionResult,
  onRequestDeepDive,
  evaluateShortAnswer,
  initialState,
  onStateChange,
}: InteractiveLessonRendererProps) {
  const [questionState, setQuestionState] = useState<Record<string, QuestionUIState>>(
    () => initialState?.questionState || {},
  )
  const [attempts, setAttempts] = useState<Record<string, number>>(
    () => initialState?.attempts || {},
  )
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(
    initialState?.currentSectionId ?? null,
  )
  const enhancedMarkdown = useMemo(
    () => normalizeLooseExampleBlocks(content.markdown),
    [content.markdown],
  )
  const sections = useMemo(() => extractSections(enhancedMarkdown), [enhancedMarkdown])
  const articleRef = useRef<HTMLDivElement | null>(null)
  const lastEmittedStateRef = useRef<LessonProgressState | null>(null)
  const sectionMap = useMemo(() => {
    const obj: Record<string, LessonSectionInfo> = {}
    sections.forEach((section) => {
      obj[section.id] = section
    })
    return obj
  }, [sections])
  const hasInlineVerificationBlocks = useMemo(
    () => typeof enhancedMarkdown === "string" && enhancedMarkdown.includes("```verification"),
    [enhancedMarkdown],
  )

  const questionsMap = useMemo(() => {
    const map: Record<string, LessonVerificationQuestion> = {}
    ;(content.preguntasVerificacion || []).forEach((question) => {
      map[question.id] = question
    })
    return map
  }, [content.preguntasVerificacion])

  useEffect(() => {
    onSectionsMetadata?.(sections)
  }, [sections, onSectionsMetadata])

  useEffect(() => {
    if (!articleRef.current || sections.length === 0) return

    const headings = Array.from(articleRef.current.querySelectorAll("h2"))
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry =
          entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0] || entries[0]

        if (!visibleEntry?.target?.id) return
        const section = sectionMap[visibleEntry.target.id]
        onSectionChange?.(section || null)
        setCurrentSectionId(section?.id || null)
      },
      {
        root: null,
        threshold: 0.35,
      }
    )

    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [sections, sectionMap, onSectionChange])

  const updateState = useCallback((questionId: string, updater: (prev: QuestionUIState) => QuestionUIState) => {
    setQuestionState((prev) => {
      const next = { ...prev }
      next[questionId] = updater(prev[questionId] || defaultQuestionState)
      return next
    })
  }, [])

  // Sync with initialState only when initialState changes (not when local state changes)
  // This prevents infinite loops
  const initialStateRef = useRef(initialState)

  useEffect(() => {
    // Only update if initialState reference changed
    if (initialStateRef.current === initialState) return

    initialStateRef.current = initialState

    if (initialState?.questionState) {
      setQuestionState(initialState.questionState)
    }
    if (initialState?.attempts) {
      setAttempts(initialState.attempts)
    }
    if (initialState && "currentSectionId" in initialState) {
      setCurrentSectionId(initialState.currentSectionId ?? null)
    }
  }, [initialState])

  useEffect(() => {
    if (!onStateChange) return

    const nextState = {
      questionState,
      attempts,
      currentSectionId,
    }

    if (
      lastEmittedStateRef.current &&
      shallowEqualRecord(lastEmittedStateRef.current.questionState, nextState.questionState) &&
      shallowEqualRecord(lastEmittedStateRef.current.attempts, nextState.attempts) &&
      lastEmittedStateRef.current.currentSectionId === nextState.currentSectionId
    ) {
      return
    }

    lastEmittedStateRef.current = nextState
    onStateChange(nextState)
  }, [questionState, attempts, currentSectionId, onStateChange])

  const incrementAttempts = useCallback((questionId: string) => {
    setAttempts((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + 1,
    }))
  }, [])

  const handleSelectOption = (question: LessonVerificationQuestion, optionId: string, multi = false) => {
    updateState(question.id, (prev) => {
      const current = prev.selectedOptionIds || []
      let nextSelection: string[]
      if (multi) {
        if (current.includes(optionId)) {
          nextSelection = current.filter((id) => id !== optionId)
        } else {
          nextSelection = [...current, optionId]
        }
      } else {
        nextSelection = [optionId]
      }

      return {
        ...prev,
        selectedOptionIds: nextSelection,
        status: "idle",
        feedback: undefined,
        suggestions: undefined,
      }
    })
  }

  const handleCheckAnswer = (question: LessonVerificationQuestion) => {
    const selected = questionState[question.id]?.selectedOptionIds || []
    if (selected.length === 0) return

    incrementAttempts(question.id)

    const expected = Array.isArray(question.respuestaCorrecta)
      ? (question.respuestaCorrecta as string[])
      : [String(question.respuestaCorrecta)]

    const isMulti = expected.length > 1
    const isCorrect = isMulti ? isArrayEqual(selected, expected) : expected.includes(selected[0])

    const status: QuestionUIState["status"] = isCorrect ? "correcto" : "incorrecto"

    let feedback: string
    if (isCorrect) {
      feedback = question.feedback.correcto
    } else {
      const optionFeedback: string | undefined = question.feedback.porOpcion?.find((entry) => entry.optionId && selected.includes(entry.optionId))?.feedback
      const incorrectFeedback: string | undefined = question.feedback.incorrecto
      feedback = optionFeedback || incorrectFeedback || "Revisa el concepto y vuelve a intentarlo."
    }

    updateState(question.id, (prev) => ({
      ...prev,
      status,
      feedback,
      suggestions: undefined,
    }))

    onQuestionResult?.({
      questionId: question.id,
      status,
      attempts: (attempts[question.id] || 0) + 1,
    })
  }

  const handleShortAnswer = async (question: LessonVerificationQuestion) => {
    const answer = questionState[question.id]?.answerText?.trim()
    if (!answer) return

    incrementAttempts(question.id)
    updateState(question.id, (prev) => ({
      ...prev,
      status: "checking",
      feedback: undefined,
      suggestions: undefined,
    }))

    try {
      const result = await evaluateShortAnswer?.({
        question,
        answer,
        section: sectionMap[question.seccionId],
      })

      if (!result) {
        updateState(question.id, (prev) => ({
          ...prev,
          status: "incorrecto",
          feedback: "No se pudo evaluar automáticamente. Intenta de nuevo.",
        }))
        return
      }

      updateState(question.id, (prev) => ({
        ...prev,
        status: result.score,
        feedback: result.feedback,
        suggestions: result.sugerencias,
      }))

      onQuestionResult?.({
        questionId: question.id,
        status: result.score,
        attempts: attempts[question.id] || 1,
      })
    } catch (error) {
      updateState(question.id, (prev) => ({
        ...prev,
        status: "incorrecto",
        feedback: "No se pudo evaluar en este momento. Intenta más tarde.",
      }))
    }
  }

  const handleRequestDeepDive = (question: LessonVerificationQuestion) => {
    if (!question.accionChatSugerida) return
    onRequestDeepDive?.(question, question.accionChatSugerida)
  }

  const renderVerificationBlock = (question: LessonVerificationQuestion) => {
    const state = questionState[question.id] || defaultQuestionState
    const expected = Array.isArray(question.respuestaCorrecta)
      ? (question.respuestaCorrecta as string[])
      : [String(question.respuestaCorrecta)]
    const isMultiSelect = expected.length > 1

    if (question.tipo === "respuesta_corta") {
      return (
        <VerificationShell status={state.status}>
          <p className="text-sm font-medium text-slate-800">{question.enunciado}</p>
          <textarea
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white/80 p-3 text-sm shadow-inner focus:border-slate-400 focus:outline-none"
            placeholder="Escribe tu respuesta aquí..."
            value={state.answerText || ""}
            disabled={readOnly || state.status === "checking"}
            onChange={(event) =>
              updateState(question.id, (prev) => ({
                ...prev,
                answerText: event.target.value,
                status: "idle",
              }))
            }
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleShortAnswer(question)}
              disabled={!evaluateShortAnswer || !state.answerText?.trim() || readOnly || state.status === "checking"}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {state.status === "checking" ? "Evaluando..." : "Evaluar con IA"}
            </button>
            {!readOnly && question.accionChatSugerida && (
              <button
                type="button"
                onClick={() => handleRequestDeepDive(question)}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                Profundizar en Chat
              </button>
            )}
          </div>

          {state.feedback && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-700">
              {state.feedback}
              {state.suggestions && state.suggestions.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                  {state.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </VerificationShell>
      )
    }

    return (
      <VerificationShell status={state.status}>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{question.enunciado}</p>
            {question.criteriosEvaluacion && question.criteriosEvaluacion.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                {question.criteriosEvaluacion.join(" • ")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {(question.opciones || []).map((option) => {
              const isSelected = state.selectedOptionIds?.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleSelectOption(question, option.id, isMultiSelect)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition hover:border-slate-400 ${
                    isSelected ? "border-slate-900 bg-slate-900/5" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-4 w-4 rounded-full border ${
                        isSelected ? "border-slate-900 bg-slate-900" : "border-slate-300"
                      }`}
                    />
                    <span>{option.texto}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {!readOnly && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={state.selectedOptionIds?.length === 0}
                onClick={() => handleCheckAnswer(question)}
              >
                Revisar respuesta
              </button>
              <button
                type="button"
                onClick={() =>
                  updateState(question.id, () => ({
                    selectedOptionIds: [],
                    status: "idle",
                  }))
                }
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                Reintentar
              </button>
              {question.accionChatSugerida && (
                <button
                  type="button"
                  onClick={() => handleRequestDeepDive(question)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                >
                  Profundizar en Chat
                </button>
              )}
            </div>
          )}
          {state.feedback && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-700">
              {state.feedback}
            </div>
          )}
        </div>
      </VerificationShell>
    )
  }

  const components: Components = {
    h2: ({ node, ...props }) => {
      const text = getNodeText(node as any)
      const id = slugify(text)
      return (
        <h2
          id={id}
          className="scroll-mt-28 text-2xl font-semibold tracking-tight text-slate-900"
          {...props}
        />
      )
    },
    h3: ({ node, ...props }) => {
      const text = getNodeText(node as any)
      const id = slugify(text)
      return (
        <h3
          id={id}
          className="scroll-mt-28 text-xl font-semibold text-slate-900"
          {...props}
        />
      )
    },
    p: ({ node, children, ...props }) => {
      const childArray = React.Children.toArray(children)
      const blockTags = new Set([
        "div",
        "section",
        "article",
        "ul",
        "ol",
        "li",
        "pre",
        "code",
        "blockquote",
        "table",
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
      ])

      const reactHasBlockChildren = childArray.some(
        (child) =>
          React.isValidElement(child) &&
          typeof child.type === "string" &&
          blockTags.has(child.type),
      )

      const nodeHasBlockChildren = Array.isArray((node as any)?.children)
        ? (node as any).children.some(
            (child: any) =>
              child?.type === "element" &&
              typeof child?.tagName === "string" &&
              blockTags.has(child.tagName),
          )
        : false

      if (reactHasBlockChildren || nodeHasBlockChildren) {
        const { className, ...rest } = props
        const mergedClassName = ["space-y-3", className].filter(Boolean).join(" ")
        return (
          <div {...rest} className={mergedClassName}>
            {childArray}
          </div>
        )
      }

      return (
        <p {...props}>
          {childArray}
        </p>
      )
    },
    code({ node, children, className, inline, ...props }: any) {
      const language = ((node as any)?.data?.meta || className?.replace(/language-/, "") || "").toLowerCase()
      if (language === "verification") {
        let parsed: Partial<LessonVerificationQuestion & { seccionId?: string }> | null = null
        try {
          parsed = JSON.parse(String(children).trim())
        } catch {
          parsed = null
        }

        const questionFromSchema = parsed?.id ? questionsMap[parsed.id] : null
        const question = questionFromSchema || (parsed as LessonVerificationQuestion | null)

        if (!question) {
          return (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              No se pudo renderizar esta pregunta de verificación.
            </div>
          )
        }

        return renderVerificationBlock(question)
      }
      if (language === "example") {
        const parsed = parseExampleBlock(String(children).trim())
        if (!parsed) {
          return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
              No se pudo interpretar este ejemplo práctico.
            </div>
          )
        }
        return <LessonExampleCard data={parsed} />
      }

      return inline ? (
        <code className={className} {...props}>
          {children}
        </code>
      ) : (
        <pre className="rounded-xl bg-slate-900/90 p-4 text-sm text-slate-50">
          <code>{children}</code>
        </pre>
      )
    },
    div({ node, ...props }: any) {
      if (node?.properties?.className?.toString().includes("lesson-callout")) {
        return (
          <div className="my-6 rounded-2xl border-l-4 border-amber-400 bg-amber-50/80 p-4 shadow-sm" {...props} />
        )
      }
      return <div {...props} />
    },
    span({ node, ...props }: any) {
      const term = node?.properties?.["data-term"] as string | undefined
      const definition = node?.properties?.["data-definition"] as string | undefined
      if (term && definition && node?.properties?.className?.toString().includes("lesson-glossary-term")) {
        return (
          <GlossaryTerm term={term} definition={definition}>
            {props.children}
          </GlossaryTerm>
        )
      }
      return <span {...props} />
    },
  }

  return (
    <article
      ref={articleRef}
      className="mx-auto w-full max-w-[900px] space-y-8 px-4 py-6 leading-relaxed text-slate-800"
    >
      <header className="space-y-3 border-b border-slate-200 pb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          {content.metadata?.nivelNarrativa || "Lección Interactiva"}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{content.metadata?.titulo}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          {content.metadata?.duracionMinutos && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              ⏱ {content.metadata.duracionMinutos} min
            </span>
          )}
          {content.metadata?.dificultad && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 capitalize">
              🎯 {content.metadata.dificultad}
            </span>
          )}
          {content.metadata?.conceptosClave?.length && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
              📚 {content.metadata.conceptosClave.slice(0, 3).join(" • ")}
            </span>
          )}
        </div>
      </header>

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkCallout, remarkGlossary(content.glosario)]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {enhancedMarkdown}
      </ReactMarkdown>

      {!hasInlineVerificationBlocks && content.preguntasVerificacion && content.preguntasVerificacion.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white/70 p-6">
          <h4 className="text-base font-semibold text-slate-900">Preguntas de verificación</h4>
          <p className="text-sm text-slate-500">Aplica lo aprendido respondiendo estas preguntas rápidas.</p>
          <div className="mt-4 space-y-6">
            {content.preguntasVerificacion.map((question) => (
              <div key={`fallback-question-${question.id}`}>{renderVerificationBlock(question)}</div>
            ))}
          </div>
        </section>
      )}

      {content.glosario && content.glosario.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Glosario rápido</h4>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            {content.glosario.map((entry) => (
              <div key={entry.termino}>
                <dt className="font-semibold text-slate-900">{entry.termino}</dt>
                <dd>{entry.definicion}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  )
}
