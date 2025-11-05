"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Star,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  MessageSquare,
  Wrench,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  usePromptTemplates,
  useCrearPlantilla,
  useActualizarPlantilla,
  useEliminarPlantilla,
  useClonarPlantilla,
  type PromptTemplate,
  type CrearPlantillaDto,
} from "@/lib/hooks/use-prompt-templates"
import { toast } from "@/components/ui/use-toast"

interface TemplateLibraryIntegratedProps {
  onSelectTemplate?: (template: PromptTemplate) => void
  tipoComponenteFiltro?: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta'
  isModal?: boolean
  onClose?: () => void
}

export function TemplateLibraryIntegrated({
  onSelectTemplate,
  tipoComponenteFiltro,
  isModal = false,
  onClose,
}: TemplateLibraryIntegratedProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<string>(tipoComponenteFiltro || "todos")
  const [soloOficiales, setSoloOficiales] = useState(false)
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)

  // Cargar plantillas desde la API con filtros
  const { plantillas, isLoading, error } = usePromptTemplates({
    tipoComponente: tipoFiltro !== "todos" ? tipoFiltro as any : undefined,
    esOficial: soloOficiales || undefined,
  })

  // Hooks de mutación
  const { crearPlantilla, isCreando } = useCrearPlantilla()
  const { actualizarPlantilla, isActualizando } = useActualizarPlantilla()
  const { eliminarPlantilla, isEliminando } = useEliminarPlantilla()
  const { clonarPlantilla, isClonando } = useClonarPlantilla()

  // Filtrar por búsqueda
  const plantillasFiltradas = plantillas.filter((template) => {
    const matchesSearch =
      template.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedTemplates)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedTemplates(newExpanded)
  }

  const handleCrearPlantilla = () => {
    setSelectedTemplate(null)
    setShowCreateModal(true)
  }

  const handleEditarPlantilla = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    setShowEditModal(true)
  }

  const handleEliminarPlantilla = async (templateId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
      return
    }

    try {
      await eliminarPlantilla(templateId)
    } catch (error) {
      // El error ya se maneja en el hook
    }
  }

  const handleClonarPlantilla = async (template: PromptTemplate) => {
    const nuevoNombre = window.prompt(
      "Nombre de la copia:",
      `Copia de ${template.nombre}`
    )

    if (!nuevoNombre) return

    try {
      await clonarPlantilla(template.id, nuevoNombre)
    } catch (error) {
      // El error ya se maneja en el hook
    }
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case "leccion":
        return <BookOpen className="h-5 w-5" />
      case "cuaderno":
        return <FileText className="h-5 w-5" />
      case "simulacion":
        return <MessageSquare className="h-5 w-5" />
      case "herramienta":
        return <Wrench className="h-5 w-5" />
      default:
        return <Sparkles className="h-5 w-5" />
    }
  }

  const getBadgeTipo = (tipo: string) => {
    const labels = {
      leccion: "Lección",
      cuaderno: "Cuaderno",
      simulacion: "Simulación",
      herramienta: "Herramienta",
    }
    return labels[tipo as keyof typeof labels] || tipo
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive mb-4">Error al cargar plantillas: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Biblioteca de Plantillas</h2>
            <p className="text-sm text-muted-foreground">
              Explora y reutiliza plantillas de prompts para generar contenido
            </p>
          </div>
          {isModal && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar plantillas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={tipoFiltro} onValueChange={setTipoFiltro} className="w-auto">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="leccion">Lecciones</TabsTrigger>
                <TabsTrigger value="cuaderno">Cuadernos</TabsTrigger>
                <TabsTrigger value="simulacion">Simulaciones</TabsTrigger>
                <TabsTrigger value="herramienta">Herramientas</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="oficiales"
                checked={soloOficiales}
                onCheckedChange={(checked) => setSoloOficiales(checked as boolean)}
              />
              <label
                htmlFor="oficiales"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Solo oficiales
              </label>
            </div>

            <Button onClick={handleCrearPlantilla}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Plantillas */}
      <div className="flex-1 overflow-y-auto p-6">
        {plantillasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron plantillas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Intenta ajustar los filtros o crear una nueva plantilla
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plantillasFiltradas.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isExpanded={expandedTemplates.has(template.id)}
                onToggleExpand={() => toggleExpanded(template.id)}
                onSelect={() => onSelectTemplate?.(template)}
                onEdit={() => handleEditarPlantilla(template)}
                onDelete={() => handleEliminarPlantilla(template.id)}
                onClone={() => handleClonarPlantilla(template)}
                getIconoTipo={getIconoTipo}
                getBadgeTipo={getBadgeTipo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <CreateEditTemplateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={crearPlantilla}
        isSubmitting={isCreando}
      />

      <CreateEditTemplateModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        template={selectedTemplate}
        onSubmit={(dto) => actualizarPlantilla(selectedTemplate!.id, dto)}
        isSubmitting={isActualizando}
        isEdit
      />
    </div>
  )
}

// ============================================================================
// TEMPLATE CARD
// ============================================================================

interface TemplateCardProps {
  template: PromptTemplate
  isExpanded: boolean
  onToggleExpand: () => void
  onSelect?: () => void
  onEdit: () => void
  onDelete: () => void
  onClone: () => void
  getIconoTipo: (tipo: string) => React.ReactNode
  getBadgeTipo: (tipo: string) => string
}

function TemplateCard({
  template,
  isExpanded,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
  onClone,
  getIconoTipo,
  getBadgeTipo,
}: TemplateCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getIconoTipo(template.tipo_componente)}
            <h3 className="font-semibold">{template.nombre}</h3>
          </div>
          <div className="flex items-center gap-2">
            {template.es_oficial && (
              <Badge variant="default" className="gap-1">
                <Star className="h-3 w-3" />
                Oficial
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onSelect && (
                  <DropdownMenuItem onClick={onSelect}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Usar Plantilla
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClone}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clonar
                </DropdownMenuItem>
                {!template.es_oficial && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Badge variant="secondary" className="mb-2">
          {getBadgeTipo(template.tipo_componente)}
        </Badge>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {template.descripcion}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Por {template.autor}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-auto p-0 hover:bg-transparent"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Ver más
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div>
              <Label className="text-xs font-medium">Prompt Template:</Label>
              <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                {template.prompt_template}
              </pre>
            </div>
            {template.config_default && (
              <div>
                <Label className="text-xs font-medium">Configuración por Defecto:</Label>
                <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(template.config_default, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// CREATE/EDIT MODAL
// ============================================================================

interface CreateEditTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: PromptTemplate | null
  onSubmit: (dto: CrearPlantillaDto) => Promise<any>
  isSubmitting: boolean
  isEdit?: boolean
}

function CreateEditTemplateModal({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting,
  isEdit = false,
}: CreateEditTemplateModalProps) {
  const [formData, setFormData] = useState<CrearPlantillaDto>({
    nombre: template?.nombre || "",
    descripcion: template?.descripcion || "",
    tipoComponente: template?.tipo_componente || "leccion",
    promptTemplate: template?.prompt_template || "",
    autor: template?.autor || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await onSubmit(formData)
      onOpenChange(false)
      // Reset form
      setFormData({
        nombre: "",
        descripcion: "",
        tipoComponente: "leccion",
        promptTemplate: "",
        autor: "",
      })
    } catch (error) {
      // El error ya se maneja en el hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Plantilla" : "Crear Nueva Plantilla"}
          </DialogTitle>
          <DialogDescription>
            Define los parámetros de la plantilla de prompt
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="ej. Lección Académica Profunda"
              required
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe para qué sirve esta plantilla..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="tipoComponente">Tipo de Componente *</Label>
            <Select
              value={formData.tipoComponente}
              onValueChange={(value: any) =>
                setFormData({ ...formData, tipoComponente: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leccion">Lección</SelectItem>
                <SelectItem value="cuaderno">Cuaderno</SelectItem>
                <SelectItem value="simulacion">Simulación</SelectItem>
                <SelectItem value="herramienta">Herramienta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="promptTemplate">Prompt Template *</Label>
            <Textarea
              id="promptTemplate"
              value={formData.promptTemplate}
              onChange={(e) =>
                setFormData({ ...formData, promptTemplate: e.target.value })
              }
              placeholder="Usa variables con {{ variable }} para hacerlo dinámico..."
              rows={10}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usa variables como {`{{ programa_nombre }}`}, {`{{ fase_nombre }}`}, etc.
            </p>
          </div>

          <div>
            <Label htmlFor="autor">Autor</Label>
            <Input
              id="autor"
              value={formData.autor}
              onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
              placeholder="Tu nombre"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEdit ? "Actualizar" : "Crear Plantilla"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
