"use client"

import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ThemeResult {
  nombre: string
  menciones?: number
  citas?: string[]
  resumen?: string
}

interface MatrixRow {
  categoria?: string
  valores?: Array<{ titulo: string; valor: string | number | boolean }>
  descripcion?: string
}

interface AnalysisToolContent {
  titulo?: string
  descripcion?: string
  objetivo?: string
  rolIA?: string
  instrucciones?: string[]
  pasos?: Array<{ titulo?: string; descripcion?: string }>
  datasets?: Array<{ nombre: string; descripcion?: string; formato?: string }>
  indicadores?: string[]
  entregables?: string[]
  insights?: string[]
  resultados?: {
    temas?: ThemeResult[]
    matrices?: MatrixRow[]
    citasDestacadas?: string[]
  }
}

interface HerramientaAnalisisPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: AnalysisToolContent
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
}

export function HerramientaAnalisisPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
}: HerramientaAnalisisPlayerProps) {
  const instructions = normalizeStringArray(content.instrucciones)
  const datasets = Array.isArray(content.datasets) ? content.datasets : []
  const steps = Array.isArray(content.pasos) ? content.pasos : []
  const indicadores = normalizeStringArray(content.indicadores)
  const entregables = normalizeStringArray(content.entregables)
  const insights = normalizeStringArray(content.insights)
  const themes = normalizeThemes(content.resultados?.temas)
  const matrices = Array.isArray(content.resultados?.matrices) ? content.resultados?.matrices! : []
  const citasDestacadas = normalizeStringArray(content.resultados?.citasDestacadas)

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={content.descripcion || content.objetivo}
      proofPointName={proofPointName}
      totalSteps={1}
      currentStep={1}
      onSave={onSave}
      onComplete={onComplete}
      onExit={onExit}
      showAIAssistant={false}
      contentMaxWidthClassName="max-w-5xl"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contexto del análisis</CardTitle>
            {content.objetivo && (
              <CardDescription>
                {content.objetivo}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {instructions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Instrucciones clave</p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                  {instructions.map((instruction, index) => (
                    <li key={`instruction-${index}`}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}

            {datasets.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Fuentes de datos</p>
                <div className="space-y-2">
                  {datasets.map((dataset, index) => (
                    <div key={`dataset-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{dataset.nombre}</p>
                        {dataset.formato && (
                          <Badge variant="outline">{dataset.formato}</Badge>
                        )}
                      </div>
                      {dataset.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {dataset.descripcion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Secuencia sugerida</CardTitle>
              <CardDescription>Avanza paso a paso validando hallazgos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={`step-${index}`} className="flex gap-4 rounded-lg border p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{step.titulo || `Paso ${index + 1}`}</p>
                    {step.descripcion && (
                      <p className="text-sm text-muted-foreground mt-1">{step.descripcion}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(themes.length > 0 || matrices.length > 0 || citasDestacadas.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados del análisis</CardTitle>
              <CardDescription>Hallazgos listos para revisión con el instructor</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={themes.length ? "temas" : matrices.length ? "matrices" : "citas"}>
                <TabsList>
                  {themes.length > 0 && <TabsTrigger value="temas">Temas</TabsTrigger>}
                  {matrices.length > 0 && <TabsTrigger value="matrices">Matrices</TabsTrigger>}
                  {citasDestacadas.length > 0 && <TabsTrigger value="citas">Citas</TabsTrigger>}
                </TabsList>

                {themes.length > 0 && (
                  <TabsContent value="temas" className="space-y-4">
                    {themes.map((theme, index) => (
                      <Card key={`theme-${index}`}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                          <div>
                            <CardTitle className="text-lg">{theme.nombre}</CardTitle>
                            {theme.resumen && (
                              <CardDescription>{theme.resumen}</CardDescription>
                            )}
                          </div>
                          {typeof theme.menciones === "number" && (
                            <Badge variant="outline">{theme.menciones} menciones</Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          {theme.citas && theme.citas.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Citas representativas</p>
                              {theme.citas.map((quote, qIndex) => (
                                <p
                                  key={`quote-${index}-${qIndex}`}
                                  className="text-sm text-muted-foreground italic border-l-2 pl-3"
                                >
                                  “{quote}”
                                </p>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                )}

                {matrices.length > 0 && (
                  <TabsContent value="matrices" className="space-y-4">
                    {matrices.map((row, index) => (
                      <Card key={`matrix-${index}`}>
                        <CardHeader>
                          <CardTitle className="text-base font-semibold">
                            {row.categoria || `Matriz ${index + 1}`}
                          </CardTitle>
                          {row.descripcion && (
                            <CardDescription>{row.descripcion}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {(row.valores || []).map((value, valueIndex) => (
                            <div
                              key={`matrix-value-${index}-${valueIndex}`}
                              className="flex items-start justify-between rounded-md bg-muted/40 p-3 text-sm"
                            >
                              <span className="font-medium">{value.titulo}</span>
                              <span className="text-muted-foreground">
                                {formatMatrixValue(value.valor)}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                )}

                {citasDestacadas.length > 0 && (
                  <TabsContent value="citas">
                    <div className="space-y-3">
                      {citasDestacadas.map((quote, index) => (
                        <p
                          key={`highlight-${index}`}
                          className="rounded-lg border bg-muted/40 p-4 text-sm italic text-muted-foreground"
                        >
                          “{quote}”
                        </p>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {(indicadores.length > 0 || entregables.length > 0 || insights.length > 0) && (
          <div className="grid gap-4 md:grid-cols-3">
            {indicadores.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Indicadores a monitorear</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {indicadores.map((indicator, index) => (
                    <div key={`indicator-${index}`} className="rounded-md bg-muted/40 p-3 text-sm">
                      {indicator}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {entregables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Entregables esperados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entregables.map((deliverable, index) => (
                    <div key={`deliverable-${index}`} className="rounded-md bg-muted/40 p-3 text-sm">
                      {deliverable}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {insights.length > 0 && (
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Recomendaciones de IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {insights.map((insight, index) => (
                    <p key={`insight-${index}`} className="rounded-md border p-3">
                      {insight}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ExercisePlayer>
  )
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : null))
    .filter((item): item is string => Boolean(item && item.length > 0))
}

function normalizeThemes(value: unknown): ThemeResult[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): ThemeResult | null => {
      if (typeof item === "string") {
        return { nombre: item }
      }
      if (item && typeof item === "object") {
        return {
          nombre:
            typeof (item as any).nombre === "string"
              ? (item as any).nombre
              : typeof (item as any).name === "string"
                ? (item as any).name
                : "Tema",
          menciones: (item as any).menciones ?? (item as any).frequency,
          citas: normalizeStringArray((item as any).citas ?? (item as any).quotes),
          resumen: typeof (item as any).resumen === "string" ? (item as any).resumen : undefined,
        }
      }
      return null
    })
    .filter((item): item is ThemeResult => item !== null)
}

function formatMatrixValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "✓" : "✕"
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }
  return value ? String(value) : "—"
}
