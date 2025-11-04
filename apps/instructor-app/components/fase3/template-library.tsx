"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Star,
  Copy,
  Edit,
  Share2,
  Trash2,
  MoreVertical,
  X,
  Code,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  MessageSquare,
  Wrench,
  CheckCircle,
  Sparkles,
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
import type { PromptTemplate, TipoComponente } from "@/types/content"

interface TemplateLibraryProps {
  onSelectTemplate?: (template: PromptTemplate) => void
  tipoComponenteFiltro?: TipoComponente
  isModal?: boolean
  onClose?: () => void
}

export function TemplateLibrary({
  onSelectTemplate,
  tipoComponenteFiltro,
  isModal = false,
  onClose,
}: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<string>(tipoComponenteFiltro || "todos")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos")
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data
  const mockTemplates: PromptTemplate[] = [
    {
      id: "tpl_001",
      nombre: "Lección Académica Profunda",
      tipo_componente: "leccion",
      descripcion:
        "Template para lecciones con enfoque académico riguroso, ideal para conceptos complejos que requieren fundamentación teórica sólida.",
      prompt_template: `# CONTEXTO
Eres un diseñador instruccional experto creando contenido académico riguroso.

## Programa: {{programa_nombre}}
## Fase: {{fase_nombre}}
## Proof Point: {{proof_point_nombre}}

# TAREA
Genera una lección académica con:
- Fundamentación teórica sólida
- Referencias a literatura relevante
- Ejemplos basados en investigación
- Actividades de análisis crítico

# FORMATO
Retorna en formato JSON con estructura de lección completa.`,
      config_default: {
        nivel_profundidad: 4,
        estilo_narrativo: "academico",
        duracion_target: 30,
        elementos_incluir: ["ejemplos", "reflexiones", "recursos"],
      },
      autor: "Equipo Xpertia",
      es_oficial: true,
      usos: 127,
      rating: 4.8,
      fecha_creacion: "2024-01-15",
    },
    {
      id: "tpl_002",
      nombre: "Lección Conversacional Práctica",
      tipo_componente: "leccion",
      descripcion:
        "Template para lecciones con tono cercano y enfoque práctico, ideal para conceptos aplicables que requieren ejemplos del mundo real.",
      prompt_template: `# CONTEXTO
Eres un mentor experimentado compartiendo conocimiento práctico.

## Programa: {{programa_nombre}}
## Fase: {{fase_nombre}}

# TAREA
Genera una lección conversacional con:
- Tono cercano y accesible
- Ejemplos del mundo real
- Analogías y metáforas
- Actividades prácticas inmediatas

# FORMATO
Retorna en formato JSON estructurado.`,
      config_default: {
        nivel_profundidad: 3,
        estilo_narrativo: "conversacional",
        duracion_target: 20,
        elementos_incluir: ["ejemplos", "actividades"],
      },
      autor: "María González",
      es_oficial: false,
      usos: 89,
      rating: 4.6,
      fecha_creacion: "2024-02-10",
    },
    {
      id: "tpl_003",
      nombre: "Cuaderno de Reflexión Estratégica",
      tipo_componente: "cuaderno",
      descripcion:
        "Template para cuadernos enfocados en reflexión profunda y planificación estratégica, ideal para proof points de validación de hipótesis.",
      prompt_template: `# CONTEXTO
Eres un coach estratégico guiando reflexión profunda.

## Proof Point: {{proof_point_nombre}}
## Pregunta Central: {{proof_point_pregunta}}

# TAREA
Genera un cuaderno con preguntas que:
- Promuevan reflexión estratégica
- Conecten teoría con proyecto personal
- Identifiquen supuestos y riesgos
- Generen insights accionables

# FORMATO
Retorna JSON con secciones y preguntas estructuradas.`,
      config_default: {
        numero_secciones: 4,
        tipos_pregunta: ["reflexion", "analisis", "sintesis"],
        incluir_ejemplos_respuesta: true,
      },
      autor: "Equipo Xpertia",
      es_oficial: true,
      usos: 64,
      rating: 4.9,
      fecha_creacion: "2024-01-20",
    },
    {
      id: "tpl_004",
      nombre: "Simulación de Pitch a Inversionista",
      tipo_componente: "simulacion",
      descripcion:
        "Template para simulaciones de pitch, con inversionista escéptico pero constructivo que evalúa modelo de negocio.",
      prompt_template: `# CONTEXTO
Crea un inversionista realista para práctica de pitch.

## Personaje Base
- Rol: Inversionista ángel con experiencia en {{sector}}
- Personalidad: Escéptico pero constructivo
- Objetivo: Evaluar viabilidad y tracción

# TAREA
Genera:
- Perfil completo del personaje
- 20-30 respuestas contextuales
- Criterios de evaluación del pitch

# FORMATO
Retorna JSON con personaje y banco de respuestas.`,
      config_default: {
        personaje: {
          nombre: "Patricia Rojas",
          rol: "Inversionista Ángel",
          background: "15 años invirtiendo en startups early-stage",
          personalidad: "esceptico",
          estilo_comunicacion: "Directo, hace preguntas difíciles",
        },
      },
      autor: "Carlos Mendoza",
      es_oficial: false,
      usos: 42,
      rating: 4.7,
      fecha_creacion: "2024-02-28",
    },
  ]

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch =
      template.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTipo = tipoFiltro === "todos" || template.tipo_componente === tipoFiltro
    const matchesCategoria =
      categoriaFiltro === "todos" ||
      (categoriaFiltro === "oficiales" && template.es_oficial) ||
      (categoriaFiltro === "mis-templates" && !template.es_oficial) ||
      (categoriaFiltro === "compartidos" && !template.es_oficial)

    return matchesSearch && matchesTipo && matchesCategoria
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

  const getIconForTipo = (tipo: TipoComponente) => {
    switch (tipo) {
      case "leccion":
        return BookOpen
      case "cuaderno":
        return FileText
      case "simulacion":
        return MessageSquare
      case "herramienta":
        return Wrench
    }
  }

  const getColorForTipo = (tipo: TipoComponente) => {
    switch (tipo) {
      case "leccion":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "cuaderno":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "simulacion":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "herramienta":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
    }
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Guarda y reutiliza configuraciones de generación exitosas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Template
          </Button>
          {isModal && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <Tabs value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="mis-templates">Mis Templates</TabsTrigger>
            <TabsTrigger value="compartidos">Compartidos</TabsTrigger>
            <TabsTrigger value="oficiales">
              <Sparkles className="w-3 h-3 mr-1" />
              Oficiales
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de Componente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="leccion">Lección</SelectItem>
              <SelectItem value="cuaderno">Cuaderno</SelectItem>
              <SelectItem value="simulacion">Simulación</SelectItem>
              <SelectItem value="herramienta">Herramienta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = getIconForTipo(template.tipo_componente)
          const isExpanded = expandedTemplates.has(template.id)

          return (
            <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{template.nombre}</h3>
                    {template.es_oficial && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Oficial
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className={`${getColorForTipo(template.tipo_componente)} text-xs`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {template.tipo_componente.charAt(0).toUpperCase() + template.tipo_componente.slice(1)}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    {!template.es_oficial && (
                      <>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartir
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.descripcion}</p>

              {/* Preview */}
              <div className="mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(template.id)}
                  className="w-full justify-between h-auto p-2"
                >
                  <div className="flex items-center gap-2">
                    <Code className="w-3 h-3" />
                    <span className="text-xs">Prompt Template</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
                {isExpanded && (
                  <div className="mt-2 bg-muted rounded-md p-3 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{template.prompt_template}</pre>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 pb-3 border-b">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{template.autor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{template.usos} usos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{template.rating}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onSelectTemplate?.(template)
                    if (isModal && onClose) {
                      onClose()
                    }
                  }}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Usar Template
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleExpanded(template.id)}>
                  Vista Previa
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">No se encontraron templates</h3>
              <p className="text-sm text-muted-foreground">Intenta ajustar los filtros o crear un nuevo template</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )

  if (isModal) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">{content}</div>
          </Card>
        </div>
        {showCreateModal && <CreateTemplateModal onClose={() => setShowCreateModal(false)} />}
      </>
    )
  }

  return (
    <>
      {content}
      {showCreateModal && <CreateTemplateModal onClose={() => setShowCreateModal(false)} />}
    </>
  )
}

function CreateTemplateModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo_componente: "leccion" as TipoComponente,
    prompt_template: "",
    config_default: "{}",
    compartir: false,
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Crear Nuevo Template</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Guarda esta configuración para reutilizarla en el futuro
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <Label htmlFor="nombre">Nombre del Template *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Lección Académica Profunda"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe cuándo usar este template..."
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Componente *</Label>
            <Select
              value={formData.tipo_componente}
              onValueChange={(value) => setFormData({ ...formData, tipo_componente: value as TipoComponente })}
            >
              <SelectTrigger className="mt-2">
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
            <Label htmlFor="prompt">Prompt Base *</Label>
            <Textarea
              id="prompt"
              placeholder="Escribe el prompt template..."
              rows={10}
              value={formData.prompt_template}
              onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
              className="mt-2 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usa variables como {`{{programa_nombre}}`}, {`{{fase_nombre}}`}, etc.
            </p>
          </div>

          <div>
            <Label htmlFor="config">Configuración por Defecto (JSON)</Label>
            <Textarea
              id="config"
              placeholder='{"nivel_profundidad": 3, "estilo_narrativo": "conversacional"}'
              rows={6}
              value={formData.config_default}
              onChange={(e) => setFormData({ ...formData, config_default: e.target.value })}
              className="mt-2 font-mono text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="compartir"
              checked={formData.compartir}
              onCheckedChange={(checked) => setFormData({ ...formData, compartir: checked as boolean })}
            />
            <div>
              <label htmlFor="compartir" className="text-sm font-medium cursor-pointer">
                Compartir con equipo
              </label>
              <p className="text-xs text-muted-foreground">Otros instructores podrán usar este template</p>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => console.log("Guardar template:", formData)}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Guardar Template
          </Button>
        </div>
      </Card>
    </div>
  )
}
