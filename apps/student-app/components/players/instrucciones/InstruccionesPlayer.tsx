"use client"

import { useCallback, useMemo, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { exercisesApi } from "@/services/api"
import { cn } from "@/lib/utils"
import { useAutoSave } from "@/hooks/useAutoSave"
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Target,
} from "lucide-react"

interface ActivityStep {
  id: string
  nombre: string
  descripcion: string
}

interface ChecklistItem {
  id?: string
  texto: string
  completado?: boolean
}

interface ChecklistBlock {
  titulo: string
  items: ChecklistItem[]
}

interface ActivityInstructionsContent {
  titulo: string
  resumen_mision: string
  pasos_ejecucion: ActivityStep[]
  checklists: ChecklistBlock[]
  preguntas_asistencia_sugeridas?: string[]
  contexto_ia?: string
}

interface StepProgress {
  notas?: string
  completado?: boolean
  updatedAt?: string
}

type ChecklistState = Record<string, boolean>
type AssistantMessage = { role: "user" | "assistant"; content: string }

interface InstruccionesPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: ActivityInstructionsContent
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
  readOnly?: boolean
}

const getChecklistItemKey = (listIdx: number, itemIdx: number, item: ChecklistItem) => {
  const baseId = typeof item.id === "string" && item.id.trim().length ? item.id : `item-${listIdx}-${itemIdx}`
  return baseId
}

const parseStepState = (savedData: any, steps: ActivityStep[]): Record<string, StepProgress> => {
  const raw = savedData?.stepState ?? savedData?.pasos
  const normalized: Record<string, StepProgress> = {}

  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (!entry) return
      const id = entry.id ?? entry.stepId ?? entry.pasoId
      if (!id) return
      normalized[String(id)] = {
        notas: typeof entry.notas === "string" ? entry.notas : "",
        completado: Boolean(entry.completado),
        updatedAt: entry.updatedAt,
      }
    })
  } else if (raw && typeof raw === "object") {
    Object.entries(raw as Record<string, any>).forEach(([key, value]) => {
      if (!value || typeof value !== "object") return
      normalized[key] = {
        notas: typeof value.notas === "string" ? value.notas : "",
        completado: Boolean(value.completado),
        updatedAt: value.updatedAt,
      }
    })
  }

  // Ensure every current step has an entry
  steps.forEach((step) => {
    if (!normalized[step.id]) {
      normalized[step.id] = { notas: "", completado: false }
    }
  })

  return normalized
}

const parseChecklistState = (savedData: any): ChecklistState => {
  const raw = savedData?.checklistState ?? savedData?.checklists
  const state: ChecklistState = {}

  if (Array.isArray(raw)) {
    raw.forEach((checklist) => {
      if (!checklist || !Array.isArray(checklist.items)) return
      checklist.items.forEach((item: any) => {
        const key = item?.id || item?.key
        if (!key) return
        state[String(key)] = Boolean(item.completado)
      })
    })
  } else if (raw && typeof raw === "object") {
    Object.entries(raw as Record<string, any>).forEach(([key, value]) => {
      state[key] = Boolean(value)
    })
  }

  return state
}

const parseAssistantHistory = (savedData: any): AssistantMessage[] => {
  if (!savedData) return []
  const history = savedData.assistantMessages ?? savedData.historial ?? []
  if (!Array.isArray(history)) return []
  return history
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      if (entry.role !== "user" && entry.role !== "assistant") return null
      if (typeof entry.content !== "string") return null
      return { role: entry.role, content: entry.content } as AssistantMessage
    })
    .filter(Boolean) as AssistantMessage[]
}

export function InstruccionesPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  savedData,
  onSave,
  onComplete,
  onExit,
  readOnly = false,
}: InstruccionesPlayerProps) {
  const steps = Array.isArray(content.pasos_ejecucion) ? content.pasos_ejecucion : []
  const checklists = Array.isArray(content.checklists) ? content.checklists : []

  const [stepState, setStepState] = useState<Record<string, StepProgress>>(() =>
    parseStepState(savedData, steps),
  )
  const [checklistState, setChecklistState] = useState<ChecklistState>(() => parseChecklistState(savedData))
  const [focusedStepId, setFocusedStepId] = useState<string | null>(() => {
    if (typeof savedData?.focusedStepId === "string") return savedData.focusedStepId
    return steps[0]?.id ?? null
  })
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>(() =>
    parseAssistantHistory(savedData),
  )
  const [assistantInput, setAssistantInput] = useState("")
  const [assistantLoading, setAssistantLoading] = useState(false)

  const completedSteps = useMemo(
    () => steps.filter((step) => stepState[step.id]?.completado).length,
    [stepState, steps],
  )

  const totalChecklistItems = useMemo(
    () => checklists.reduce((total, list) => total + list.items.length, 0),
    [checklists],
  )

  const completedChecklistItems = useMemo(() => {
    return checklists.reduce((count, list, listIdx) => {
      const done = list.items.filter((item, itemIdx) =>
        checklistState[getChecklistItemKey(listIdx, itemIdx, item)],
      ).length
      return count + done
    }, 0)
  }, [checklists, checklistState])

  const progressPercentage = useMemo(() => {
    const totalUnits = steps.length + totalChecklistItems
    if (totalUnits === 0) return 0
    return Math.round(((completedSteps + completedChecklistItems) / totalUnits) * 100)
  }, [completedChecklistItems, completedSteps, steps.length, totalChecklistItems])

  const handleNotesChange = (stepId: string, value: string) => {
    if (readOnly) return
    setFocusedStepId(stepId)
    setStepState((prev) => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        notas: value,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const toggleStepCompletion = (stepId: string) => {
    if (readOnly) return
    setStepState((prev) => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        completado: !prev[stepId]?.completado,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const toggleChecklistItem = (listIdx: number, itemIdx: number, item: ChecklistItem, checked: boolean) => {
    if (readOnly) return
    const key = getChecklistItemKey(listIdx, itemIdx, item)
    setChecklistState((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const buildAssistantContext = useCallback(() => {
    const focusStep = focusedStepId ? steps.find((step) => step.id === focusedStepId) : null
    const pendingSteps = steps
      .filter((step) => !stepState[step.id]?.completado)
      .map((step) => step.nombre)
      .filter(Boolean)
    const lines = [
      `Objetivo de la actividad: ${content.resumen_mision}`,
      content.contexto_ia ? `Contexto adicional: ${content.contexto_ia}` : "",
      focusStep ? `Paso activo (${focusStep.nombre}): ${focusStep.descripcion}` : "",
      focusStep && stepState[focusStep.id]?.notas
        ? `Notas actuales del estudiante: ${stepState[focusStep.id]?.notas}`
        : "",
      `Pasos completados: ${completedSteps}/${steps.length}`,
      totalChecklistItems
        ? `Checklist completado: ${completedChecklistItems}/${totalChecklistItems}`
        : "",
      pendingSteps.length ? `Pasos pendientes: ${pendingSteps.join(", ")}` : "",
    ]
    return lines.filter(Boolean).join("\n\n")
  }, [
    completedChecklistItems,
    completedSteps,
    content.contexto_ia,
    content.resumen_mision,
    focusedStepId,
    stepState,
    steps,
    totalChecklistItems,
  ])

  const sendAssistantPrompt = useCallback(
    async (preset?: string) => {
      if (readOnly) return
      const prompt = (preset ?? assistantInput).trim()
      if (!prompt) return

      const userMessage: AssistantMessage = { role: "user", content: prompt }
      const history = [...assistantMessages.slice(-9), userMessage]
      setAssistantMessages(history)
      if (!preset) {
        setAssistantInput("")
      }
      setAssistantLoading(true)

      try {
        const focusStep = focusedStepId ? steps.find((step) => step.id === focusedStepId) : null
        const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
          pregunta: prompt,
          seccionId: focusStep?.id || "instrucciones_general",
          seccionTitulo: focusStep?.nombre || content.titulo,
          seccionContenido: buildAssistantContext(),
          historial: history,
          perfilComprension: {
            pasosCompletados: completedSteps,
            totalPasos: steps.length,
            checklistProgreso:
              totalChecklistItems === 0 ? 0 : completedChecklistItems / totalChecklistItems,
          },
        })

        setAssistantMessages((prev) => [...prev, { role: "assistant", content: response.respuesta }])
      } catch (error) {
        setAssistantMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "No pude responder en este momento. Intenta nuevamente en unos segundos.",
          },
        ])
      } finally {
        setAssistantLoading(false)
      }
    },
    [
      assistantInput,
      assistantMessages,
      buildAssistantContext,
      completedChecklistItems,
      completedSteps,
      content.titulo,
      exerciseId,
      focusedStepId,
      steps,
      totalChecklistItems,
      readOnly,
    ],
  )

  const progressPayload = useMemo(
    () => ({
      stepState,
      checklistState,
      assistantMessages,
      focusedStepId,
    }),
    [assistantMessages, checklistState, focusedStepId, stepState],
  )

  useAutoSave({
    exerciseId,
    data: progressPayload,
    enabled: !readOnly,
    interval: 12000,
  })

  const buildPersistedPayload = () => ({
    ...progressPayload,
    updatedAt: new Date().toISOString(),
  })

  const handleSaveWithData = async () => {
    if (readOnly) return
    await onSave(buildPersistedPayload())
  }

  const handleCompleteWithData = async () => {
    if (readOnly) return
    await onComplete(buildPersistedPayload())
  }

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={content.resumen_mision}
      proofPointName={proofPointName}
      totalSteps={1}
      currentStep={1}
      onSave={!readOnly ? handleSaveWithData : undefined}
      onComplete={!readOnly ? handleCompleteWithData : undefined}
      onExit={onExit}
      showAIAssistant={false}
      contentMaxWidthClassName="max-w-[1400px]"
      canComplete={!readOnly}
    >
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-orange-50 to-white">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">Guía paso a paso</Badge>
              <Badge variant="outline">{steps.length} pasos</Badge>
              {totalChecklistItems > 0 && (
                <Badge variant="outline">{totalChecklistItems} tareas de checklist</Badge>
              )}
            </div>
            <p className="text-base text-slate-700">{content.resumen_mision}</p>
            {content.contexto_ia && (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-white/90 p-3 text-sm text-slate-600">
                <Sparkles className="mr-2 inline h-4 w-4 text-orange-500" />
                Contexto IA: {content.contexto_ia}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Progreso general</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Pasos de ejecución
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Documenta plan, decisiones y aprendizajes por paso.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  El generador no devolvió pasos detallados para esta actividad.
                </p>
              ) : (
                steps.map((step, idx) => {
                  const progress = stepState[step.id]
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "rounded-2xl border p-4 transition",
                        focusedStepId === step.id && "border-primary bg-primary/5",
                      )}
                      onClick={() => setFocusedStepId(step.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Paso {idx + 1}
                          </p>
                          <h3 className="text-lg font-semibold text-slate-900">{step.nombre}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleStepCompletion(step.id)
                          }}
                          disabled={readOnly}
                        >
                          {progress?.completado ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{step.descripcion}</p>
                      <Textarea
                        value={progress?.notas || ""}
                        onChange={(event) => handleNotesChange(step.id, event.target.value)}
                        onFocus={() => setFocusedStepId(step.id)}
                        placeholder="Captura decisiones, hallazgos o dudas..."
                        disabled={readOnly}
                        className={cn(
                          "mt-4 min-h-[140px]",
                          readOnly && "bg-muted text-muted-foreground resize-none",
                        )}
                      />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Checklists de preparación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {checklists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay tareas predefinidas para esta actividad.
                  </p>
                ) : (
                  checklists.map((list, listIdx) => {
                    const total = list.items.length
                    const done = list.items.filter((item, itemIdx) =>
                      checklistState[getChecklistItemKey(listIdx, itemIdx, item)],
                    ).length
                    return (
                      <div key={`${list.titulo}-${listIdx}`} className="rounded-2xl border border-dashed p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-800">{list.titulo}</h4>
                          <Badge variant={done === total ? "default" : "secondary"}>
                            {done}/{total}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          {list.items.map((item, itemIdx) => {
                            const key = getChecklistItemKey(listIdx, itemIdx, item)
                            return (
                              <label
                                key={key}
                                className="flex items-start gap-3 text-sm text-slate-700"
                              >
                                <Checkbox
                                  checked={!!checklistState[key]}
                                  onCheckedChange={(checked) =>
                                    toggleChecklistItem(listIdx, itemIdx, item, checked === true)
                                  }
                                  disabled={readOnly}
                                />
                                <span>{item.texto}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Asistente IA de campo
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Usa el coaching asincrónico para preparar, ejecutar o reflexionar.
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-4">
                {content.preguntas_asistencia_sugeridas && content.preguntas_asistencia_sugeridas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {content.preguntas_asistencia_sugeridas.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        onClick={() => sendAssistantPrompt(prompt)}
                        disabled={readOnly}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl border bg-muted/30">
                  <ScrollArea className="h-64 px-4 py-3">
                    {assistantMessages.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        Formula una pregunta para comenzar tu hilo con la IA.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {assistantMessages.map((message, idx) => (
                          <div
                            key={`assistant-msg-${idx}`}
                            className={cn(
                              "flex",
                              message.role === "user" ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow",
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-white text-slate-800",
                              )}
                            >
                              {message.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <Textarea
                    value={assistantInput}
                    onChange={(event) => {
                      if (readOnly) return
                      setAssistantInput(event.target.value)
                    }}
                    placeholder="Ej: Necesito reformular mi guion de entrevistas..."
                    className={cn(
                      "min-h-[100px]",
                      readOnly && "bg-muted text-muted-foreground resize-none",
                    )}
                    disabled={readOnly}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => sendAssistantPrompt()}
                      disabled={readOnly || !assistantInput.trim() || assistantLoading}
                    >
                      {assistantLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ExercisePlayer>
  )
}
