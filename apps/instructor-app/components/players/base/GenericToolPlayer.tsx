"use client"

import { Sparkles, CheckCircle2, Target } from "lucide-react"
import type { ExercisePlayerProps } from "./ExercisePlayer"
import { ExercisePlayer } from "./ExercisePlayer"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type StepDefinition = { title: string; description: string }

export interface GenericToolPlayerConfig {
  typeName: string
  icon: string
  description: string
  defaultFocusAreas: string[]
  defaultSteps: StepDefinition[]
  defaultDeliverables?: string[]
  defaultInsights?: string[]
  defaultMetrics?: string[]
}

export interface GenericToolPlayerProps
  extends Pick<
    ExercisePlayerProps,
    "exerciseId" | "exerciseName" | "proofPointName" | "onSave" | "onComplete" | "onExit"
  > {
  content: Record<string, any>
  estimatedMinutes?: number
  config: GenericToolPlayerConfig
}

export function GenericToolPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
  estimatedMinutes,
  config,
}: GenericToolPlayerProps) {
  const rawEstimatedMinutes =
    estimatedMinutes ?? content?.duracionMinutos ?? content?.duracion?.minutos ?? content?.estimatedMinutes
  const numericEstimatedMinutes =
    typeof rawEstimatedMinutes === "number" ? rawEstimatedMinutes : Number(rawEstimatedMinutes)
  const resolvedEstimatedMinutes =
    Number.isFinite(numericEstimatedMinutes) && numericEstimatedMinutes > 0 ? numericEstimatedMinutes : 45

  const focusAreas =
    resolveStringArray(content?.focusAreas, content?.enfoques, config.defaultFocusAreas) || ["Iteración guiada"]
  const steps =
    resolveSteps(content?.pasos, content?.steps, content?.fases, config.defaultSteps) ||
    config.defaultSteps
  const deliverables =
    resolveStringArray(content?.entregables, content?.deliverables, config.defaultDeliverables) ??
    []
  const insights =
    resolveStringArray(content?.insights, content?.recomendaciones, config.defaultInsights) ?? []
  const metrics =
    resolveStringArray(content?.metricas, content?.indicadores, config.defaultMetrics) ?? []

  const contextNote =
    typeof content?.contexto === "string"
      ? content.contexto
      : typeof content?.descripcion === "string"
        ? content.descripcion
        : content?.resumen

  const aiContext = [
    `Tipo: ${config.typeName}`,
    config.description,
    focusAreas.length ? `Enfoques clave: ${focusAreas.join(", ")}` : null,
    deliverables.length ? `Entregables esperados: ${deliverables.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(". ")

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      proofPointName={proofPointName}
      exerciseDescription={config.description}
      estimatedMinutes={resolvedEstimatedMinutes}
      onSave={onSave}
      onComplete={onComplete}
      onExit={onExit}
      showAIAssistant
      aiContext={aiContext}
      contentMaxWidthClassName="max-w-5xl"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span aria-hidden>{config.icon}</span>
              {config.typeName}
            </div>
            <CardTitle>{exerciseName}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Enfoques principales</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {focusAreas.map((focus) => (
                  <Badge key={focus} variant="secondary">
                    {focus}
                  </Badge>
                ))}
              </div>
            </div>
            {metrics.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Indicadores a monitorear</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {metrics.map((metric) => (
                    <li key={metric} className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {contextNote && (
          <Card>
            <CardHeader>
              <CardTitle>Contexto del ejercicio</CardTitle>
              <CardDescription>Resumen enviado por el instructor</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{contextNote}</p>
            </CardContent>
          </Card>
        )}

        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Secuencia sugerida</CardTitle>
              <CardDescription>Utiliza cada paso como checkpoint con el estudiante</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <li key={`${step.title}-${index}`} className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 text-sm font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {index + 1}
                      </span>
                      {step.title}
                    </div>
                    {step.description && <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {deliverables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Entregables esperados</CardTitle>
              <CardDescription>Lo que el estudiante debe documentar al finalizar</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones de la IA</CardTitle>
              <CardDescription>Notas accionables generadas automáticamente</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {insights.map((insight, index) => (
                  <li key={`${insight}-${index}`} className="flex gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ExercisePlayer>
  )
}

function resolveStringArray(...sources: Array<unknown>): string[] | undefined {
  for (const source of sources) {
    if (Array.isArray(source) && source.length > 0) {
      const normalized = source
        .map((item) => {
          if (typeof item === "string") {
            return item.trim()
          }

          if (item && typeof item === "object") {
            const raw =
              (item as any).titulo ??
              (item as any).title ??
              (item as any).nombre ??
              (item as any).label ??
              (item as any).descripcion ??
              (item as any).description

            return typeof raw === "string" ? raw.trim() : undefined
          }

          return undefined
        })
        .filter((value): value is string => Boolean(value && value.length > 0))

      if (normalized.length > 0) {
        return normalized
      }
    }
  }

  return undefined
}

function resolveSteps(...sources: Array<unknown>): StepDefinition[] | undefined {
  for (const source of sources) {
    if (Array.isArray(source) && source.length > 0) {
      const normalized = source
        .map((item, index) => {
          if (typeof item === "string") {
            return {
              title: `Paso ${index + 1}`,
              description: item,
            }
          }

          if (item && typeof item === "object") {
            const rawTitle =
              (item as any).titulo ??
              (item as any).title ??
              (item as any).nombre ??
              `Paso ${index + 1}`
            const rawDescription =
              (item as any).descripcion ??
              (item as any).description ??
              (item as any).detalle ??
              (item as any).contenido ??
              ""

            return {
              title: typeof rawTitle === "string" && rawTitle.trim().length > 0 ? rawTitle : `Paso ${index + 1}`,
              description: typeof rawDescription === "string" ? rawDescription : "",
            }
          }

          return undefined
        })
        .filter((value): value is StepDefinition => Boolean(value))

      if (normalized.length > 0) {
        return normalized
      }
    }
  }

  return undefined
}
