"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  Copy,
  Search,
  Filter,
  Sparkles,
  RotateCcw,
  Send,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  AlertCircle,
  User,
  MessageSquare,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PersonalidadPersonaje } from "@/types/content"

interface SimulationEditorProps {
  programaId: string
  componenteId: string
  componenteNombre: string
  contenidoInicial: SimulacionContenido
  onSave: (contenido: SimulacionContenido) => Promise<void>
  onClose?: () => void
}

interface SimulacionContenido {
  personaje: PersonajeSimulado
  escenario_contexto: string
  objetivo_conversacion: string
  banco_respuestas: RespuestaIA[]
  criterios_evaluacion: CriterioSimulacion[]
}

interface PersonajeSimulado {
  nombre: string
  rol: string
  background: string
  personalidad: PersonalidadPersonaje
  estilo_comunicacion: string
  avatar_url?: string
}

interface RespuestaIA {
  id: string
  contexto_trigger: string
  respuesta: string
  tags: string[]
  uso_stats: number
}

interface CriterioSimulacion {
  id: string
  nombre: string
  peso: number
  indicadores_positivos: string[]
  indicadores_negativos: string[]
}

interface ChatMessage {
  id: string
  remitente: "personaje" | "instructor"
  texto: string
  timestamp: Date
  respuesta_seleccionada?: string
  contexto_usado?: string
  tags_aplicados?: string[]
}

type RespuestaFieldValue = RespuestaIA[keyof RespuestaIA]
type CriterioFieldValue = CriterioSimulacion[keyof CriterioSimulacion]

interface ConfigurationPanelProps {
  contenido: SimulacionContenido
  updatePersonaje: (field: keyof PersonajeSimulado, value: string) => void
  addRespuesta: () => void
  updateRespuesta: (id: string, field: keyof RespuestaIA, value: RespuestaFieldValue) => void
  deleteRespuesta: (id: string) => void
  addCriterio: () => void
  updateCriterio: (id: string, field: keyof CriterioSimulacion, value: CriterioFieldValue) => void
  deleteCriterio: (id: string) => void
}

interface RespuestaCardProps {
  respuesta: RespuestaIA
  updateRespuesta: (id: string, field: keyof RespuestaIA, value: RespuestaFieldValue) => void
  deleteRespuesta: (id: string) => void
}

interface CriterioCardProps {
  criterio: CriterioSimulacion
  updateCriterio: (id: string, field: keyof CriterioSimulacion, value: CriterioFieldValue) => void
  deleteCriterio: (id: string) => void
}

export function SimulationEditor({
  programaId,
  componenteId,
  componenteNombre: initialNombre,
  contenidoInicial,
  onSave,
  onClose,
}: SimulationEditorProps) {
  const [componenteNombre, setComponenteNombre] = useState(initialNombre)
  const [contenido, setContenido] = useState<SimulacionContenido>(contenidoInicial)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(() => {
      handleSave()
    }, 30000)

    return () => clearTimeout(timer)
  }, [hasChanges, contenido])

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleSave = async () => {
    setSaveStatus("saving")
    try {
      await onSave(contenido)
      setHasChanges(false)
      setSaveStatus("saved")
    } catch (error) {
      setSaveStatus("error")
    }
  }

  const handleBack = () => {
    if (hasChanges) {
      if (confirm("Tienes cambios sin guardar. ¿Deseas salir sin guardar?")) {
        onClose?.()
      }
    } else {
      onClose?.()
    }
  }

  const updatePersonaje = (field: keyof PersonajeSimulado, value: string) => {
    setContenido((prev) => ({
      ...prev,
      personaje: { ...prev.personaje, [field]: value },
    }))
    setHasChanges(true)
  }

  const addRespuesta = () => {
    const newRespuesta: RespuestaIA = {
      id: `resp_${Date.now()}`,
      contexto_trigger: "",
      respuesta: "",
      tags: [],
      uso_stats: 0,
    }
    setContenido((prev) => ({
      ...prev,
      banco_respuestas: [...prev.banco_respuestas, newRespuesta],
    }))
    setHasChanges(true)
  }

  const updateRespuesta = (id: string, field: keyof RespuestaIA, value: RespuestaFieldValue) => {
    setContenido((prev) => ({
      ...prev,
      banco_respuestas: prev.banco_respuestas.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }))
    setHasChanges(true)
  }

  const deleteRespuesta = (id: string) => {
    setContenido((prev) => ({
      ...prev,
      banco_respuestas: prev.banco_respuestas.filter((r) => r.id !== id),
    }))
    setHasChanges(true)
  }

  const addCriterio = () => {
    const newCriterio: CriterioSimulacion = {
      id: `crit_${Date.now()}`,
      nombre: "",
      peso: 5,
      indicadores_positivos: [],
      indicadores_negativos: [],
    }
    setContenido((prev) => ({
      ...prev,
      criterios_evaluacion: [...prev.criterios_evaluacion, newCriterio],
    }))
    setHasChanges(true)
  }

  const updateCriterio = (id: string, field: keyof CriterioSimulacion, value: CriterioFieldValue) => {
    setContenido((prev) => ({
      ...prev,
      criterios_evaluacion: prev.criterios_evaluacion.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }))
    setHasChanges(true)
  }

  const deleteCriterio = (id: string) => {
    setContenido((prev) => ({
      ...prev,
      criterios_evaluacion: prev.criterios_evaluacion.filter((c) => c.id !== id),
    }))
    setHasChanges(true)
  }

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      remitente: "instructor",
      texto: currentMessage,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, userMessage])

    // Simulate AI response
    setTimeout(() => {
      const randomResponse = contenido.banco_respuestas[Math.floor(Math.random() * contenido.banco_respuestas.length)]

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        remitente: "personaje",
        texto: randomResponse?.respuesta || "Entiendo. ¿Podrías darme más detalles?",
        timestamp: new Date(),
        respuesta_seleccionada: randomResponse?.id,
        contexto_usado: randomResponse?.contexto_trigger,
        tags_aplicados: randomResponse?.tags,
      }
      setChatMessages((prev) => [...prev, aiMessage])
    }, 1000)

    setCurrentMessage("")
  }

  const resetChat = () => {
    setChatMessages([])
    setCurrentMessage("")
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="text-sm text-muted-foreground">Programa &gt; Fase &gt; Proof Point &gt; Simulación</div>
        </div>

        <Input
          value={componenteNombre}
          onChange={(e) => setComponenteNombre(e.target.value)}
          className="max-w-md text-center font-medium"
          placeholder="Nombre de la simulación..."
        />

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={!hasChanges || saveStatus === "saving"}>
            {saveStatus === "saving" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Configuration (40%) */}
        <div className="w-[40%] border-r">
          <ConfigurationPanel
            contenido={contenido}
            updatePersonaje={updatePersonaje}
            addRespuesta={addRespuesta}
            updateRespuesta={updateRespuesta}
            deleteRespuesta={deleteRespuesta}
            addCriterio={addCriterio}
            updateCriterio={updateCriterio}
            deleteCriterio={deleteCriterio}
          />
        </div>

        {/* Right Panel - Preview (60%) */}
        <div className="flex-1">
          <PreviewPanel
            personaje={contenido.personaje}
            chatMessages={chatMessages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            handleSendMessage={handleSendMessage}
            resetChat={resetChat}
            showDebugPanel={showDebugPanel}
            setShowDebugPanel={setShowDebugPanel}
            chatEndRef={chatEndRef}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="flex h-12 items-center justify-between border-t bg-white px-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-6">
          <span>Respuestas: {contenido.banco_respuestas.length}</span>
          <span>Criterios: {contenido.criterios_evaluacion.length}</span>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Guardado</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Error al guardar</span>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}

function ConfigurationPanel({
  contenido,
  updatePersonaje,
  addRespuesta,
  updateRespuesta,
  deleteRespuesta,
  addCriterio,
  updateCriterio,
  deleteCriterio,
}: ConfigurationPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filteredRespuestas = contenido.banco_respuestas.filter((r: RespuestaIA) => {
    const matchesSearch =
      r.respuesta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contexto_trigger.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || r.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const allTags: string[] = Array.from(
    new Set(contenido.banco_respuestas.flatMap((r: RespuestaIA) => r.tags)),
  )

  return (
    <Tabs defaultValue="personaje" className="h-full">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="personaje" className="rounded-none">
          Personaje
        </TabsTrigger>
        <TabsTrigger value="respuestas" className="rounded-none">
          Banco de Respuestas
          <Badge className="ml-2" variant="secondary">
            {contenido.banco_respuestas.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="evaluacion" className="rounded-none">
          Evaluación
        </TabsTrigger>
      </TabsList>

      {/* Personaje Tab */}
      <TabsContent value="personaje" className="m-0 h-[calc(100%-40px)]">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-6">
            {/* Avatar Upload */}
            <div>
              <Label>Avatar del Personaje</Label>
              <div className="mt-2 flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={contenido.personaje.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{contenido.personaje.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Imagen
                </Button>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={contenido.personaje.nombre}
                onChange={(e) => updatePersonaje("nombre", e.target.value)}
                placeholder="Ej: María González"
              />
            </div>

            {/* Rol */}
            <div>
              <Label htmlFor="rol">Rol / Profesión</Label>
              <Input
                id="rol"
                value={contenido.personaje.rol}
                onChange={(e) => updatePersonaje("rol", e.target.value)}
                placeholder="Ej: Directora de Innovación"
              />
            </div>

            {/* Background */}
            <div>
              <Label htmlFor="background">Background</Label>
              <Textarea
                id="background"
                value={contenido.personaje.background}
                onChange={(e) => updatePersonaje("background", e.target.value)}
                rows={4}
                placeholder="Describe la experiencia y contexto del personaje..."
              />
            </div>

            {/* Personalidad */}
            <div>
              <Label htmlFor="personalidad">Personalidad</Label>
              <Select
                value={contenido.personaje.personalidad}
                onValueChange={(value) => updatePersonaje("personalidad", value)}
              >
                <SelectTrigger id="personalidad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cooperativo">Cooperativo</SelectItem>
                  <SelectItem value="esceptico">Escéptico</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="detallista">Detallista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estilo Comunicación */}
            <div>
              <Label htmlFor="estilo">Estilo de Comunicación</Label>
              <Textarea
                id="estilo"
                value={contenido.personaje.estilo_comunicacion}
                onChange={(e) => updatePersonaje("estilo_comunicacion", e.target.value)}
                rows={3}
                placeholder="Describe cómo se comunica el personaje..."
              />
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      {/* Banco de Respuestas Tab */}
      <TabsContent value="respuestas" className="m-0 h-[calc(100%-40px)]">
        <div className="flex h-full flex-col">
          {/* Toolbar */}
          <div className="space-y-3 border-b p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar respuestas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={addRespuesta} size="sm" className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Respuesta
              </Button>
              <Button variant="outline" size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Generar con IA
              </Button>
            </div>
          </div>

          {/* Lista de Respuestas */}
          <ScrollArea className="flex-1">
            <div className="space-y-3 p-4">
              {filteredRespuestas.map((respuesta: RespuestaIA) => (
                <RespuestaCard
                  key={respuesta.id}
                  respuesta={respuesta}
                  updateRespuesta={updateRespuesta}
                  deleteRespuesta={deleteRespuesta}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      {/* Evaluación Tab */}
      <TabsContent value="evaluacion" className="m-0 h-[calc(100%-40px)]">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Criterios de Evaluación</h3>
                <p className="text-sm text-muted-foreground">Define cómo se evaluará la conversación</p>
              </div>
              <Button onClick={addCriterio} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>

            {contenido.criterios_evaluacion.map((criterio: CriterioSimulacion) => (
              <CriterioCard
                key={criterio.id}
                criterio={criterio}
                updateCriterio={updateCriterio}
                deleteCriterio={deleteCriterio}
              />
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}

function RespuestaCard({ respuesta, updateRespuesta, deleteRespuesta }: RespuestaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Contexto / Trigger</Label>
            <Input
              value={respuesta.contexto_trigger}
              onChange={(e) => updateRespuesta(respuesta.id, "contexto_trigger", e.target.value)}
              placeholder="Cuándo usar esta respuesta..."
              className="mt-1"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="ml-2">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {isExpanded && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">Respuesta</Label>
              <Textarea
                value={respuesta.respuesta}
                onChange={(e) => updateRespuesta(respuesta.id, "respuesta", e.target.value)}
                placeholder="Texto de la respuesta..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Tags</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {respuesta.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                <Button variant="outline" size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Usada {respuesta.uso_stats} veces</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteRespuesta(respuesta.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CriterioCard({ criterio, updateCriterio, deleteCriterio }: CriterioCardProps) {
  const [newIndicadorPos, setNewIndicadorPos] = useState("")
  const [newIndicadorNeg, setNewIndicadorNeg] = useState("")

  const addIndicador = (tipo: "positivos" | "negativos") => {
    const value = tipo === "positivos" ? newIndicadorPos : newIndicadorNeg
    if (!value.trim()) return

    const field = tipo === "positivos" ? "indicadores_positivos" : "indicadores_negativos"
    updateCriterio(criterio.id, field, [...criterio[field], value])

    if (tipo === "positivos") setNewIndicadorPos("")
    else setNewIndicadorNeg("")
  }

  const removeIndicador = (tipo: "positivos" | "negativos", index: number) => {
    const field = tipo === "positivos" ? "indicadores_positivos" : "indicadores_negativos"
    const newArray = [...criterio[field]]
    newArray.splice(index, 1)
    updateCriterio(criterio.id, field, newArray)
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Input
              value={criterio.nombre}
              onChange={(e) => updateCriterio(criterio.id, "nombre", e.target.value)}
              placeholder="Nombre del criterio..."
              className="font-medium"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => deleteCriterio(criterio.id)} className="ml-2">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <Label>Peso: {criterio.peso}</Label>
          <Slider
            value={[criterio.peso]}
            onValueChange={([value]) => updateCriterio(criterio.id, "peso", value)}
            min={1}
            max={10}
            step={1}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-emerald-600">Indicadores Positivos</Label>
          <div className="mt-2 space-y-2">
            {criterio.indicadores_positivos.map((ind: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 rounded border bg-emerald-50 px-3 py-2 text-sm">{ind}</div>
                <Button variant="ghost" size="sm" onClick={() => removeIndicador("positivos", idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newIndicadorPos}
                onChange={(e) => setNewIndicadorPos(e.target.value)}
                placeholder="Agregar indicador positivo..."
                onKeyDown={(e) => e.key === "Enter" && addIndicador("positivos")}
              />
              <Button onClick={() => addIndicador("positivos")} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-rose-600">Indicadores Negativos</Label>
          <div className="mt-2 space-y-2">
            {criterio.indicadores_negativos.map((ind: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 rounded border bg-rose-50 px-3 py-2 text-sm">{ind}</div>
                <Button variant="ghost" size="sm" onClick={() => removeIndicador("negativos", idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newIndicadorNeg}
                onChange={(e) => setNewIndicadorNeg(e.target.value)}
                placeholder="Agregar indicador negativo..."
                onKeyDown={(e) => e.key === "Enter" && addIndicador("negativos")}
              />
              <Button onClick={() => addIndicador("negativos")} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewPanel({
  personaje,
  chatMessages,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  resetChat,
  showDebugPanel,
  setShowDebugPanel,
  chatEndRef,
}: any) {
  return (
    <Tabs defaultValue="chat" className="h-full">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="chat" className="rounded-none">
          Chat Interactivo
        </TabsTrigger>
        <TabsTrigger value="analisis" className="rounded-none">
          Análisis
        </TabsTrigger>
      </TabsList>

      {/* Chat Tab */}
      <TabsContent value="chat" className="m-0 h-[calc(100%-40px)]">
        <div className="flex h-full flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={personaje.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{personaje.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{personaje.nombre}</div>
                <div className="text-sm text-muted-foreground">{personaje.rol}</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={resetChat}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <div>
                    <MessageSquare className="mx-auto mb-2 h-12 w-12 opacity-20" />
                    <p>Comienza la conversación para probar la simulación</p>
                  </div>
                </div>
              )}

              {chatMessages.map((msg: ChatMessage) => (
                <div key={msg.id} className={cn("flex gap-3", msg.remitente === "instructor" && "flex-row-reverse")}>
                  <Avatar className="h-8 w-8">
                    {msg.remitente === "personaje" ? (
                      <>
                        <AvatarImage src={personaje.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{personaje.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-4 py-2",
                      msg.remitente === "instructor" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <p className="text-sm">{msg.texto}</p>
                    <p className="mt-1 text-xs opacity-70">{msg.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {/* Debug Panel */}
          {showDebugPanel && chatMessages.length > 0 && (
            <div className="border-t bg-slate-50 p-4">
              <div className="text-sm">
                <div className="mb-2 font-medium">Debug Info (último mensaje):</div>
                {chatMessages[chatMessages.length - 1]?.respuesta_seleccionada && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Respuesta ID: {chatMessages[chatMessages.length - 1].respuesta_seleccionada}</div>
                    <div>Contexto: {chatMessages[chatMessages.length - 1].contexto_usado}</div>
                    <div>Tags: {chatMessages[chatMessages.length - 1].tags_aplicados?.join(", ")}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="mb-2 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setShowDebugPanel(!showDebugPanel)}>
                {showDebugPanel ? "Ocultar" : "Mostrar"} Debug
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Escribe tu mensaje..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Análisis Tab */}
      <TabsContent value="analisis" className="m-0 h-[calc(100%-40px)]">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-6">
            {chatMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <div>
                  <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-20" />
                  <p>Completa una conversación para ver el análisis</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="mb-3 font-semibold">Transcript de la Conversación</h3>
                  <div className="space-y-2 rounded-lg border bg-slate-50 p-4">
                    {chatMessages.map((msg: ChatMessage, idx: number) => (
                      <div key={msg.id} className="text-sm">
                        <span className="font-medium">{msg.remitente === "instructor" ? "Tú" : personaje.nombre}:</span>{" "}
                        {msg.texto}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">Evaluación por Criterio</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">Claridad en la Comunicación</span>
                        <Badge variant="default">8/10</Badge>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div className="h-full w-[80%] rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">Insights</h3>
                  <div className="space-y-2 rounded-lg border bg-blue-50 p-4 text-sm">
                    <p>✓ Buena estructura de preguntas abiertas</p>
                    <p>✓ Escucha activa demostrada</p>
                    <p>⚠ Podría profundizar más en las necesidades del cliente</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
