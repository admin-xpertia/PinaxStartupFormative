"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FileText, CheckCircle2, AlertCircle, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import { apiClient } from "@/services/api/client"

interface ExerciseContent {
  id: string
  exercise_instance: string
  contenido_generado: Record<string, any>
  prompt_usado: string
  modelo: string
  created_at: string
  updated_at: string
}

interface ExerciseInstance {
  id: string
  nombre: string
  descripcion_breve?: string
  duracion_estimada_minutos: number
  es_obligatorio: boolean
  estado_contenido: "pendiente" | "generando" | "generado" | "error"
  template: {
    id: string
    nombre: string
    categoria: string
    icono: string
    color: string
    descripcion: string
  }
}

interface ExercisePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instanceId: string | null
}

export function ExercisePreviewDialog({
  open,
  onOpenChange,
  instanceId,
}: ExercisePreviewDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [instance, setInstance] = useState<ExerciseInstance | null>(null)
  const [content, setContent] = useState<ExerciseContent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && instanceId) {
      fetchInstanceAndContent()
    }
  }, [open, instanceId])

  const fetchInstanceAndContent = async () => {
    if (!instanceId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch instance details
      const instanceData = await apiClient.get<ExerciseInstance>(
        `/exercises/${encodeURIComponent(instanceId)}`
      )
      setInstance(instanceData)

      // Fetch generated content
      try {
        const contentData = await apiClient.get<ExerciseContent>(
          `/exercises/${encodeURIComponent(instanceId)}/content`
        )
        setContent(contentData)
      } catch (contentErr: any) {
        if (contentErr.statusCode === 404) {
          setContent(null)
        } else {
          throw contentErr
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el ejercicio")
      toast({
        title: "Error",
        description: err.message || "Error al cargar el ejercicio",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderContentField = (key: string, value: any) => {
    if (typeof value === "string") {
      // Check if it looks like markdown (has # or ** or bullet points)
      if (value.includes("#") || value.includes("**") || value.includes("- ") || value.includes("\n")) {
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{value}</ReactMarkdown>
          </div>
        )
      }
      return <p className="text-sm">{value}</p>
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, idx) => (
            <li key={idx} className="text-sm">
              {typeof item === "object" ? JSON.stringify(item, null, 2) : item}
            </li>
          ))}
        </ul>
      )
    }

    if (typeof value === "object" && value !== null) {
      return (
        <pre className="bg-muted p-3 rounded text-xs overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }

    return <span className="text-sm">{String(value)}</span>
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchInstanceAndContent}>
            Reintentar
          </Button>
        </div>
      )
    }

    if (!instance) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-3">No se encontró el ejercicio</p>
        </div>
      )
    }

    if (!content || instance.estado_contenido !== "generado") {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Este ejercicio aún no tiene contenido generado
          </p>
          <p className="text-xs text-muted-foreground">
            Estado: <Badge variant="outline">{instance.estado_contenido}</Badge>
          </p>
        </div>
      )
    }

    return (
      <Tabs defaultValue="estudiante" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estudiante">Vista Estudiante</TabsTrigger>
          <TabsTrigger value="contenido">Contenido</TabsTrigger>
          <TabsTrigger value="metadatos">Metadatos</TabsTrigger>
        </TabsList>

        <TabsContent value="estudiante" className="space-y-4 mt-4">
          {/* Simulated Student View */}
          <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 bg-primary/5">
            <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-3 w-3" />
              Vista del Estudiante (Simulación)
            </div>

            {/* Exercise Header */}
            <div className="bg-background rounded-lg shadow-sm border p-6 mb-4">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <span style={{ fontSize: "2rem" }}>{instance.template.icono}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{instance.nombre}</h2>
                  {instance.descripcion_breve && (
                    <p className="text-muted-foreground mb-3">{instance.descripcion_breve}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <span>⏱️</span>
                      {instance.duracion_estimada_minutos} minutos
                    </Badge>
                    {instance.es_obligatorio && (
                      <Badge variant="secondary">Obligatorio</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Exercise Content Rendered for Student */}
            <div className="bg-background rounded-lg shadow-sm border p-6 space-y-6">
              {Object.entries(content.contenido_generado).map(([key, value]) => {
                // Skip internal/technical fields
                if (key === 'criterios_evaluacion' || key === 'validaciones') {
                  return null;
                }

                return (
                  <div key={key} className="space-y-3">
                    <h3 className="text-lg font-semibold border-b pb-2 capitalize">
                      {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>

                    {typeof value === "string" && (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{value}</ReactMarkdown>
                      </div>
                    )}

                    {Array.isArray(value) && (
                      <div className="space-y-3">
                        {value.map((item, idx) => (
                          <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                            {typeof item === "string" ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{item}</ReactMarkdown>
                              </div>
                            ) : typeof item === "object" && item !== null ? (
                              <div className="space-y-2">
                                {Object.entries(item).map(([itemKey, itemValue]) => (
                                  <div key={itemKey}>
                                    <span className="font-medium text-sm">{itemKey}: </span>
                                    <span className="text-sm">{String(itemValue)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p>{String(item)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {typeof value === "object" && value !== null && !Array.isArray(value) && (
                      <div className="space-y-2">
                        {Object.entries(value).map(([subKey, subValue]) => (
                          <div key={subKey} className="bg-muted/50 p-3 rounded">
                            <div className="font-medium text-sm mb-1 capitalize">
                              {subKey.replace(/_/g, " ")}
                            </div>
                            <div className="text-sm">
                              {typeof subValue === "string" ? (
                                <ReactMarkdown>{subValue}</ReactMarkdown>
                              ) : (
                                String(subValue)
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Simulated Student Action Buttons */}
              <div className="pt-6 border-t flex gap-3">
                <Button className="flex-1" disabled>
                  <span>💾</span>
                  <span className="ml-2">Guardar Progreso</span>
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <span>✅</span>
                  <span className="ml-2">Completar Ejercicio</span>
                </Button>
              </div>
            </div>

            <div className="mt-4 text-xs text-center text-muted-foreground">
              Esta es una simulación de cómo el estudiante verá el ejercicio.
              Los botones están deshabilitados en el preview.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contenido" className="space-y-4 mt-4">
          <div className="flex items-start gap-3 pb-4 border-b">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${instance.template.color}20` }}
            >
              <span style={{ fontSize: "2rem" }}>{instance.template.icono}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{instance.nombre}</h3>
              {instance.descripcion_breve && (
                <p className="text-sm text-muted-foreground mb-2">
                  {instance.descripcion_breve}
                </p>
              )}
              <div className="flex gap-2">
                <Badge variant="outline">{instance.duracion_estimada_minutos} minutos</Badge>
                <Badge variant="outline">{instance.template.categoria}</Badge>
                {instance.es_obligatorio && <Badge variant="secondary">Obligatorio</Badge>}
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Generado
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(content.contenido_generado).map(([key, value]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium capitalize">
                    {key.replace(/_/g, " ")}
                  </CardTitle>
                </CardHeader>
                <CardContent>{renderContentField(key, value)}</CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metadatos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de Generación</CardTitle>
              <CardDescription>Detalles técnicos del contenido generado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">ID de Contenido:</div>
                <div className="text-muted-foreground font-mono text-xs">{content.id}</div>

                <div className="font-medium">Modelo usado:</div>
                <div className="text-muted-foreground">{content.modelo}</div>

                <div className="font-medium">Fecha de creación:</div>
                <div className="text-muted-foreground">
                  {new Date(content.created_at).toLocaleString("es-ES")}
                </div>

                <div className="font-medium">Última actualización:</div>
                <div className="text-muted-foreground">
                  {new Date(content.updated_at).toLocaleString("es-ES")}
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="font-medium mb-2">Prompt usado:</div>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                  {content.prompt_usado}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview del Ejercicio</DialogTitle>
          <DialogDescription>
            Vista previa del contenido generado y sus metadatos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">{renderContent()}</div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {/* TODO: Agregar botones de editar y publicar en el futuro */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
