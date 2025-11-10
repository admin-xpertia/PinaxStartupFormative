"use client"

import { use, useState } from "react"
import useSWR from "swr"
import { AppHeader } from "@/components/app-header"
import { Sidebar } from "@/components/sidebar"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  PenTool,
  MessageSquare,
  UserCog,
  Search,
  Sparkles,
  BarChart2,
  Edit3,
  Globe,
  Lock,
  Plus,
  Eye,
  Trash2,
  GripVertical,
  Zap,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { ExerciseWizardDialog } from "@/components/exercise-wizard-dialog"
import { ExercisePreviewDialog } from "@/components/exercise-preview-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Types
interface ExerciseTemplate {
  id: string
  nombre: string
  categoria: string
  descripcion: string
  objetivo_pedagogico: string
  rol_ia: string
  icono: string
  color: string
  configuracion_schema: Record<string, any>
  configuracion_default: Record<string, any>
  es_oficial: boolean
  activo: boolean
}

interface ExerciseInstance {
  id: string
  template: string
  proof_point: string
  nombre: string
  descripcion_breve?: string
  consideraciones_contexto: string
  orden: number
  duracion_estimada_minutos: number
  estado_contenido: "sin_generar" | "generando" | "draft" | "publicado"
  es_obligatorio: boolean
}

interface ProofPoint {
  id: string
  nombre: string
  fase: string
  pregunta_central?: string
  documentacion_contexto?: string
}

const CATEGORY_ICONS: Record<string, any> = {
  leccion_interactiva: BookOpen,
  cuaderno_trabajo: PenTool,
  simulacion_interaccion: MessageSquare,
  mentor_asesor_ia: UserCog,
  herramienta_analisis: Search,
  herramienta_creacion: Sparkles,
  sistema_tracking: BarChart2,
  herramienta_revision: Edit3,
  simulador_entorno: Globe,
  sistema_progresion: Lock,
}

const CATEGORY_NAMES: Record<string, string> = {
  leccion_interactiva: "Lección Interactiva",
  cuaderno_trabajo: "Cuaderno de Trabajo",
  simulacion_interaccion: "Simulación de Interacción",
  mentor_asesor_ia: "Mentor y Asesor IA",
  herramienta_analisis: "Herramienta de Análisis",
  herramienta_creacion: "Herramienta de Creación",
  sistema_tracking: "Sistema de Tracking",
  herramienta_revision: "Herramienta de Revisión",
  simulador_entorno: "Simulador de Entorno",
  sistema_progresion: "Sistema de Progresión",
}

export default function ExerciseLibraryPage({
  params,
}: {
  params: Promise<{ id: string; ppId: string }>
}) {
  const { id: rawProgramId, ppId: rawPpId } = use(params)
  // Decode URL parameters to get actual IDs
  const programId = decodeURIComponent(rawProgramId)
  const ppId = decodeURIComponent(rawPpId)
  const { toast } = useToast()

  const [selectedTemplate, setSelectedTemplate] = useState<ExerciseTemplate | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("agregados")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [instanceToDelete, setInstanceToDelete] = useState<string | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [instanceToPreview, setInstanceToPreview] = useState<string | null>(null)
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [editWizardOpen, setEditWizardOpen] = useState(false)
  const [instanceToEdit, setInstanceToEdit] = useState<ExerciseInstance | null>(null)

  // Fetch proof point data
  const { data: proofPoint, isLoading: ppLoading } = useSWR<ProofPoint>(
    `/api/v1/proof-points/${ppId}`,
    fetcher
  )

  // Fetch exercise instances for this proof point
  const {
    data: instances,
    mutate: mutateInstances,
    isLoading: instancesLoading,
  } = useSWR<ExerciseInstance[]>(
    `/api/v1/proof-points/${ppId}/exercises`,
    fetcher
  )

  // Fetch all templates grouped by category
  const { data: templatesResponse, isLoading: templatesLoading } = useSWR<{
    data: Record<string, ExerciseTemplate[]>
  }>(`/api/v1/exercise-templates/grouped`, fetcher)

  const exerciseInstances = instances || []
  const templatesGrouped = templatesResponse?.data || {}

  // Handle generate single exercise
  const handleGenerate = async (instanceId: string) => {
    setGeneratingIds((prev) => new Set(prev).add(instanceId))

    try {
      const response = await fetch(`/api/v1/exercises/${instanceId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forceRegenerate: false,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al generar el ejercicio")
      }

      toast({
        title: "Ejercicio generado",
        description: "El contenido se generó exitosamente con IA",
      })

      mutateInstances()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el ejercicio",
        variant: "destructive",
      })
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev)
        next.delete(instanceId)
        return next
      })
    }
  }

  // Handle batch generation
  const handleBatchGenerate = async () => {
    setBatchGenerating(true)

    try {
      const response = await fetch(
        `/api/v1/exercise-generation/proof-point/${ppId}/batch`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        throw new Error("Error al generar los ejercicios")
      }

      const result = await response.json()

      toast({
        title: "Ejercicios generados",
        description: `Se generaron ${result.count} ejercicio(s) exitosamente`,
      })

      mutateInstances()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar los ejercicios",
        variant: "destructive",
      })
    } finally {
      setBatchGenerating(false)
    }
  }

  // Handle delete
  const handleDelete = async (instanceId: string) => {
    setInstanceToDelete(instanceId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!instanceToDelete) return

    try {
      const response = await fetch(`/api/v1/exercises/${encodeURIComponent(instanceToDelete)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el ejercicio")
      }

      toast({
        title: "Ejercicio eliminado",
        description: "El ejercicio se eliminó exitosamente",
      })

      mutateInstances()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el ejercicio",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setInstanceToDelete(null)
    }
  }

  // Handle add template
  const handleAddTemplate = (template: ExerciseTemplate) => {
    setSelectedTemplate(template)
    setWizardOpen(true)
  }

  // Handle edit
  const handleEdit = (instance: ExerciseInstance) => {
    // Find the template for this instance
    const templateId = instance.template
    let foundTemplate: ExerciseTemplate | null = null

    // Search through all grouped templates
    for (const templates of Object.values(templatesGrouped)) {
      const template = templates.find((t) => t.id === templateId)
      if (template) {
        foundTemplate = template
        break
      }
    }

    setSelectedTemplate(foundTemplate)
    setInstanceToEdit(instance)
    setEditWizardOpen(true)
  }

  // Handle preview
  const handlePreview = (instanceId: string) => {
    setInstanceToPreview(instanceId)
    setPreviewDialogOpen(true)
  }

  // Handle publish
  const handlePublish = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/v1/exercises/${instanceId}/publish`, {
        method: "PUT",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Error al publicar el ejercicio")
      }

      toast({
        title: "Ejercicio publicado",
        description: "El ejercicio está ahora disponible para los estudiantes",
      })

      mutateInstances()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo publicar el ejercicio",
        variant: "destructive",
      })
      throw error
    }
  }

  if (ppLoading || templatesLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <LoadingState text="Cargando biblioteca de ejercicios..." />
          </main>
        </div>
      </div>
    )
  }

  if (!proofPoint) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            <ErrorState
              title="Proof Point no encontrado"
              message="No pudimos encontrar el proof point solicitado."
            />
          </main>
        </div>
      </div>
    )
  }

  const pendingGeneration = exerciseInstances.filter((i) => i.estado_contenido === "sin_generar")

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 max-w-7xl">
              {/* Breadcrumbs */}
              <Breadcrumbs />

              {/* Header */}
              <PageHeader
                title={`Ejercicios: ${proofPoint.nombre}`}
                description={
                  proofPoint.pregunta_central ||
                  "Gestiona los ejercicios de aprendizaje para este proof point"
                }
                actions={
                  <Button variant="outline" asChild>
                    <Link href={`/programas/${programId}`}>Volver</Link>
                  </Button>
                }
              />

              {/* Context Documentation Card */}
              {proofPoint.documentacion_contexto && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Contexto del Proof Point</CardTitle>
                    <CardDescription>
                      Este contexto se usará para generar los ejercicios con IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {proofPoint.documentacion_contexto}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="agregados">
                    Ejercicios Agregados ({exerciseInstances.length})
                  </TabsTrigger>
                  <TabsTrigger value="biblioteca">Biblioteca de Ejercicios</TabsTrigger>
                </TabsList>

                {/* Tab: Ejercicios Agregados */}
                <TabsContent value="agregados" className="space-y-4">
                  {exerciseInstances.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-muted p-4 mb-4">
                          <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          No hay ejercicios agregados
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                          Agrega ejercicios desde la biblioteca para que los estudiantes puedan
                          completar este proof point
                        </p>
                        <Button onClick={() => setActiveTab("biblioteca")}>
                          <Plus className="mr-2 h-4 w-4" />
                          Explorar Biblioteca
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {exerciseInstances
                        .sort((a, b) => a.orden - b.orden)
                        .map((instance, index) => (
                          <ExerciseInstanceCard
                            key={instance.id}
                            instance={instance}
                            index={index}
                            onDelete={() => handleDelete(instance.id)}
                            onEdit={() => handleEdit(instance)}
                            onGenerate={() => handleGenerate(instance.id)}
                            onPreview={() => handlePreview(instance.id)}
                            onPublish={() => handlePublish(instance.id)}
                            isGenerating={generatingIds.has(instance.id)}
                          />
                        ))}
                    </div>
                  )}

                  {exerciseInstances.length > 0 && (
                    <div className="flex justify-between items-center pt-4">
                      <Button variant="outline" onClick={() => setActiveTab("biblioteca")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar más ejercicios
                      </Button>

                      {pendingGeneration.length > 0 && (
                        <Button onClick={handleBatchGenerate} disabled={batchGenerating}>
                          {batchGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Generar Todos con IA ({pendingGeneration.length})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Biblioteca */}
                <TabsContent value="biblioteca" className="space-y-6">
                  <div className="grid gap-6">
                    {Object.entries(templatesGrouped).map(([categoria, templates]) => (
                      <Card key={categoria}>
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            {CATEGORY_NAMES[categoria] || categoria}
                          </CardTitle>
                          <CardDescription>{templates[0]?.objetivo_pedagogico}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => (
                              <ExerciseTemplateCard
                                key={template.id}
                                template={template}
                                onSelect={setSelectedTemplate}
                                onAdd={() => handleAddTemplate(template)}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Wizard Dialog */}
      <ExerciseWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        template={selectedTemplate}
        proofPointId={ppId}
        onSuccess={() => {
          mutateInstances()
          setActiveTab("agregados")
        }}
      />

      {/* Edit Wizard Dialog */}
      <ExerciseWizardDialog
        open={editWizardOpen}
        onOpenChange={setEditWizardOpen}
        template={selectedTemplate}
        proofPointId={ppId}
        existingInstance={instanceToEdit}
        onSuccess={() => {
          mutateInstances()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ejercicio y su contenido generado serán
              eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exercise Preview Dialog */}
      <ExercisePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        instanceId={instanceToPreview}
        onPublish={handlePublish}
      />
    </>
  )
}

// Exercise Instance Card Component
function ExerciseInstanceCard({
  instance,
  index,
  onDelete,
  onEdit,
  onGenerate,
  onPreview,
  onPublish,
  isGenerating,
}: {
  instance: ExerciseInstance
  index: number
  onDelete: () => void
  onEdit: () => void
  onGenerate: () => void
  onPreview: () => void
  onPublish?: () => void
  isGenerating: boolean
}) {
  const getStatusBadge = () => {
    if (isGenerating) {
      return (
        <Badge variant="default">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Generando...
        </Badge>
      )
    }

    switch (instance.estado_contenido) {
      case "sin_generar":
        return <Badge variant="secondary">Sin generar</Badge>
      case "generando":
        return (
          <Badge variant="default">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Generando...
          </Badge>
        )
      case "draft":
        return <Badge variant="outline">Borrador</Badge>
      case "publicado":
        return (
          <Badge variant="default" className="bg-green-500">
            Publicado
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Order Number */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {index + 1}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h4 className="font-semibold text-base mb-1">{instance.nombre}</h4>
                {instance.descripcion_breve && (
                  <p className="text-sm text-muted-foreground">{instance.descripcion_breve}</p>
                )}
              </div>
              {getStatusBadge()}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {instance.duracion_estimada_minutos} min
              </span>
              {!instance.es_obligatorio && (
                <Badge variant="outline" className="text-xs">
                  Opcional
                </Badge>
              )}
            </div>

            {instance.consideraciones_contexto && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground">
                  <strong>Consideraciones:</strong> {instance.consideraciones_contexto}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex gap-2">
            {/* Editar: siempre disponible */}
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              disabled={isGenerating}
              title="Editar configuración"
            >
              <Edit3 className="h-4 w-4" />
            </Button>

            {/* Generar: solo cuando no tiene contenido */}
            {instance.estado_contenido === "sin_generar" && !isGenerating && (
              <Button size="sm" onClick={onGenerate} title="Generar contenido con IA">
                <Zap className="h-4 w-4" />
              </Button>
            )}

            {/* Previsualizar: cuando tiene contenido generado */}
            {(instance.estado_contenido === "draft" || instance.estado_contenido === "publicado") && (
              <Button size="sm" variant="outline" onClick={onPreview} title="Previsualizar ejercicio">
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {/* Publicar: solo en estado draft */}
            {instance.estado_contenido === "draft" && onPublish && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={onPublish}
                title="Publicar para estudiantes"
              >
                Publicar
              </Button>
            )}

            {/* Eliminar */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              disabled={isGenerating}
              title="Eliminar ejercicio"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Exercise Template Card Component
function ExerciseTemplateCard({
  template,
  onSelect,
  onAdd,
}: {
  template: ExerciseTemplate
  onSelect: (template: ExerciseTemplate) => void
  onAdd: () => void
}) {
  const Icon = CATEGORY_ICONS[template.categoria] || BookOpen

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
      style={{ borderTopColor: template.color, borderTopWidth: "3px" }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex-shrink-0 p-2 rounded-lg"
            style={{ backgroundColor: `${template.color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color: template.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 line-clamp-1">{template.nombre}</h4>
            {template.es_oficial && (
              <Badge variant="secondary" className="text-xs">
                Oficial
              </Badge>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{template.descripcion}</p>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(template)
            }}
          >
            <Eye className="mr-1 h-3 w-3" />
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
          >
            <Plus className="mr-1 h-3 w-3" />
            Agregar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
