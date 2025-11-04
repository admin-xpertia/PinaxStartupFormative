"use client"

import { useState } from "react"
import {
  Check,
  RefreshCw,
  X,
  Sparkles,
  BookOpen,
  Target,
  Eye,
  Code,
  FileJson,
  AlertCircle,
  Lightbulb,
  FileText,
  Layers,
  CheckCircle,
  Wand,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ContenidoGenerado } from "@/types/content"
import ReactMarkdown from "react-markdown"

interface ContentPreviewAnalysisProps {
  contenido: ContenidoGenerado
  onAccept: () => void
  onRegenerate: () => void
  onDiscard: () => void
}

export function ContentPreviewAnalysis({ contenido, onAccept, onRegenerate, onDiscard }: ContentPreviewAnalysisProps) {
  const [viewMode, setViewMode] = useState<"preview" | "markdown" | "json">("preview")

  const { analisis_calidad } = contenido
  const scoreColor =
    analisis_calidad.score_general >= 80
      ? "text-success"
      : analisis_calidad.score_general >= 60
        ? "text-warning"
        : "text-destructive"
  const scoreRing =
    analisis_calidad.score_general >= 80
      ? "stroke-success"
      : analisis_calidad.score_general >= 60
        ? "stroke-warning"
        : "stroke-destructive"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Generación &gt; {contenido.tipo.charAt(0).toUpperCase() + contenido.tipo.slice(1)} &gt; Vista Previa
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{contenido.nombre}</h1>
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generado con IA
                </Badge>
                <Badge variant="outline">Borrador</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onDiscard}>
                <X className="w-4 h-4 mr-2" />
                Descartar
              </Button>
              <Button variant="secondary" onClick={onRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerar
              </Button>
              <Button onClick={onAccept} className="bg-primary">
                <Check className="w-4 h-4 mr-2" />
                Aceptar y Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Preview Panel */}
          <div className="col-span-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <TabsList>
                    <TabsTrigger value="preview">
                      <Eye className="w-4 h-4 mr-2" />
                      Vista Estudiante
                    </TabsTrigger>
                    <TabsTrigger value="markdown">
                      <Code className="w-4 h-4 mr-2" />
                      Markdown
                    </TabsTrigger>
                    <TabsTrigger value="json">
                      <FileJson className="w-4 h-4 mr-2" />
                      JSON
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="prose prose-sm max-w-none">
                {viewMode === "preview" && contenido.tipo === "leccion" && (
                  <ReactMarkdown>{contenido.contenido.markdown}</ReactMarkdown>
                )}
                {viewMode === "markdown" && contenido.tipo === "leccion" && (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">{contenido.contenido.markdown}</pre>
                )}
                {viewMode === "json" && (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(contenido, null, 2)}
                  </pre>
                )}
              </div>
            </Card>
          </div>

          {/* Analysis Panel */}
          <div className="col-span-4">
            <div className="sticky top-24 space-y-4">
              {/* Score General */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Análisis de Calidad</h3>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className={scoreRing}
                        strokeDasharray={`${(analisis_calidad.score_general / 100) * 351.86} 351.86`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={`text-3xl font-bold ${scoreColor}`}>{analisis_calidad.score_general}</div>
                      <div className="text-xs text-muted-foreground">/ 100</div>
                    </div>
                  </div>
                  <p className={`text-sm font-medium mt-4 ${scoreColor}`}>
                    {analisis_calidad.score_general >= 80
                      ? "Excelente calidad. Listo para uso con ajustes menores."
                      : analisis_calidad.score_general >= 60
                        ? "Buena calidad. Considera algunas mejoras."
                        : "Necesita mejoras significativas."}
                  </p>
                </div>
              </Card>

              {/* Métricas Detalladas */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Métricas Detalladas</h3>
                <div className="space-y-4">
                  {Object.entries(analisis_calidad.metricas).map(([key, metrica]) => {
                    if (!metrica) return null
                    const badgeColor =
                      metrica.badge === "Excelente"
                        ? "bg-success/10 text-success border-success/20"
                        : metrica.badge === "Muy bien"
                          ? "bg-success/10 text-success border-success/20"
                          : metrica.badge === "Aceptable"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {key === "lecturabilidad" && <BookOpen className="w-4 h-4 text-muted-foreground" />}
                            {key === "cobertura_conceptos" && <Target className="w-4 h-4 text-muted-foreground" />}
                            {key === "longitud" && <FileText className="w-4 h-4 text-muted-foreground" />}
                            {key === "ejemplos_practicos" && <Lightbulb className="w-4 h-4 text-muted-foreground" />}
                            {key === "estructura_pedagogica" && <Layers className="w-4 h-4 text-muted-foreground" />}
                            <span className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</span>
                          </div>
                          <Badge variant="outline" className={badgeColor}>
                            {metrica.badge}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={metrica.score} className="flex-1" />
                          <span className="text-sm font-semibold w-12 text-right">{metrica.score}/100</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {metrica.detalles.map((detalle, i) => (
                            <div key={i}>• {detalle}</div>
                          ))}
                        </div>
                        {metrica.sugerencia && (
                          <div className="text-xs text-warning bg-warning/10 p-2 rounded">💡 {metrica.sugerencia}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Sugerencias */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Sugerencias de Mejora</h3>
                <div className="space-y-3">
                  {analisis_calidad.sugerencias.map((sugerencia) => {
                    const prioridadColor =
                      sugerencia.prioridad === "alta"
                        ? "border-warning bg-warning/5"
                        : sugerencia.prioridad === "media"
                          ? "border-primary bg-primary/5"
                          : "border-muted bg-muted/50"

                    return (
                      <Card key={sugerencia.id} className={`p-3 ${prioridadColor}`}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-medium">{sugerencia.titulo}</div>
                            <div className="text-xs text-muted-foreground">{sugerencia.descripcion}</div>
                            {sugerencia.accion_disponible && (
                              <Button size="sm" variant="outline" className="mt-2 h-7 text-xs bg-transparent">
                                Aplicar automáticamente
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </Card>

              {/* Comparación con Objetivos */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Comparación con Objetivos</h3>
                <div className="space-y-2">
                  {analisis_calidad.comparacion_objetivos.map((comp, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {comp.cumplido ? (
                        <CheckCircle className="w-4 h-4 mt-0.5 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mt-0.5 text-warning" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm">{comp.objetivo}</div>
                        {comp.nota && <div className="text-xs text-muted-foreground">{comp.nota}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Acciones Rápidas */}
              <Card className="p-4">
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start" size="sm">
                    <Wand className="w-4 h-4 mr-2 text-purple-600" />
                    Aplicar Todas las Sugerencias
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerar con Ajustes
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar como Template
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
