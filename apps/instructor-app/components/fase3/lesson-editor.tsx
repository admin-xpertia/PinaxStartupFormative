"use client"

import { useState, useEffect, useCallback } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  LinkIcon,
  Sparkles,
  Save,
  Eye,
  EyeOff,
  HelpCircle,
  Lightbulb,
  PlayCircle,
  TrendingUp,
  Plus,
  Minimize,
  AlertCircle,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LessonEditorProps {
  programaId: string
  componenteId: string
  componenteNombre: string
  contenidoInicial: LeccionContenido
  onSave: (contenido: LeccionContenido) => Promise<void>
  onClose?: () => void
}

interface LeccionContenido {
  markdown: string
  metadata: {
    duracion_lectura_minutos: number
    palabras: number
    secciones: number
    nivel_lecturabilidad: number
  }
}

interface AISuggestion {
  id: string
  tipo: "mejora" | "expansion" | "simplificacion" | "error"
  ubicacion: string
  texto: string
}

export function LessonEditor({
  programaId,
  componenteId,
  componenteNombre: initialNombre,
  contenidoInicial,
  onSave,
  onClose,
}: LessonEditorProps) {
  const [componenteNombre, setComponenteNombre] = useState(initialNombre)
  const [showPreview, setShowPreview] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [lastSaved, setLastSaved] = useState<Date>(new Date())

  // Mock AI suggestions
  const [aiSuggestions] = useState<AISuggestion[]>([
    {
      id: "1",
      tipo: "mejora",
      ubicacion: "Párrafo 3, línea 2",
      texto: "Considera agregar un ejemplo concreto aquí para ilustrar el concepto",
    },
    {
      id: "2",
      tipo: "expansion",
      ubicacion: 'Sección "¿Qué es el CSF?"',
      texto: "Esta sección podría beneficiarse de más detalle sobre los criterios de validación",
    },
    {
      id: "3",
      tipo: "error",
      ubicacion: "Párrafo 5",
      texto: 'Posible inconsistencia: se menciona "3 pasos" pero solo se describen 2',
    },
  ])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Underline,
      Placeholder.configure({
        placeholder: "Comienza a escribir tu lección...",
      }),
    ],
    content: contenidoInicial.markdown,
    onUpdate: () => {
      setHasChanges(true)
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none",
      },
    },
  })

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasChanges || !editor) return

    const timer = setTimeout(() => {
      handleSave()
    }, 30000)

    return () => clearTimeout(timer)
  }, [hasChanges, editor])

  // Calculate metadata
  const metadata = useCallback(() => {
    if (!editor) return contenidoInicial.metadata

    const text = editor.getText()
    const palabras = text.split(/\s+/).filter(Boolean).length
    const duracion_lectura_minutos = Math.ceil(palabras / 250)

    return {
      palabras,
      duracion_lectura_minutos,
      secciones: contenidoInicial.metadata.secciones,
      nivel_lecturabilidad: contenidoInicial.metadata.nivel_lecturabilidad,
    }
  }, [editor, contenidoInicial.metadata])

  const handleSave = async () => {
    if (!editor) return

    setSaveStatus("saving")
    try {
      await onSave({
        markdown: editor.getHTML(),
        metadata: metadata(),
      })
      setHasChanges(false)
      setSaveStatus("saved")
      setLastSaved(new Date())
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

  if (!editor) {
    return <div>Cargando editor...</div>
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
          <div className="text-sm text-muted-foreground">Programa &gt; Fase &gt; Proof Point &gt; Componente</div>
        </div>

        <Input
          value={componenteNombre}
          onChange={(e) => setComponenteNombre(e.target.value)}
          className="max-w-md text-center font-medium"
          placeholder="Nombre de la lección..."
        />

        <div className="flex items-center gap-2">
          <Button variant={showPreview ? "default" : "ghost"} size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          <Button
            variant={showAIPanel ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="relative"
          >
            <Sparkles className="h-4 w-4" />
            {aiSuggestions.length > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                {aiSuggestions.length}
              </Badge>
            )}
          </Button>

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

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Pane */}
        <div className={cn("flex-1 overflow-auto", showPreview && "w-1/2")}>
          <div className="mx-auto max-w-4xl px-16 py-8">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="w-1/2 overflow-auto border-l bg-slate-50">
            <div className="mx-auto max-w-3xl px-8 py-8">
              <div
                className="prose prose-sm sm:prose lg:prose-lg"
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            </div>
          </div>
        )}

        {/* AI Panel */}
        {showAIPanel && <AIPanel suggestions={aiSuggestions} editor={editor} />}
      </div>

      {/* Footer */}
      <footer className="flex h-12 items-center justify-between border-t bg-white px-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-6">
          <span>Palabras: {metadata().palabras}</span>
          <span>Tiempo de lectura: {metadata().duracion_lectura_minutos} min</span>
          <span>Última modificación: hace {Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s</span>
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

function EditorToolbar({ editor }: { editor: Editor }) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)

  return (
    <div className="sticky top-16 z-40 flex items-center gap-1 border-b bg-white px-4 py-2">
      {/* Text formatting */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(editor.isActive("bold") && "bg-accent")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(editor.isActive("italic") && "bg-accent")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(editor.isActive("underline") && "bg-accent")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Headings */}
      <div className="relative flex items-center gap-1 border-r pr-2">
        <Button variant="ghost" size="sm" onClick={() => setShowHeadingMenu(!showHeadingMenu)}>
          {editor.isActive("heading", { level: 1 })
            ? "Título 1"
            : editor.isActive("heading", { level: 2 })
              ? "Título 2"
              : editor.isActive("heading", { level: 3 })
                ? "Título 3"
                : "Normal"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
        {showHeadingMenu && (
          <div className="absolute left-0 top-full z-50 mt-1 w-32 rounded-md border bg-white shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                editor.chain().focus().setParagraph().run()
                setShowHeadingMenu(false)
              }}
            >
              Normal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run()
                setShowHeadingMenu(false)
              }}
            >
              Título 1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run()
                setShowHeadingMenu(false)
              }}
            >
              Título 2
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run()
                setShowHeadingMenu(false)
              }}
            >
              Título 3
            </Button>
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive("bulletList") && "bg-accent")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive("orderedList") && "bg-accent")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Insert */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert("Insertar imagen")}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert("Insertar enlace")}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert("Insertar quiz")}>
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert("Insertar callout")}>
          <Lightbulb className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function AIPanel({ suggestions, editor }: { suggestions: AISuggestion[]; editor: Editor }) {
  const getSuggestionIcon = (tipo: AISuggestion["tipo"]) => {
    switch (tipo) {
      case "mejora":
        return <TrendingUp className="h-4 w-4 text-emerald-600" />
      case "expansion":
        return <Plus className="h-4 w-4 text-blue-600" />
      case "simplificacion":
        return <Minimize className="h-4 w-4 text-amber-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-rose-600" />
    }
  }

  return (
    <div className="w-[350px] border-l bg-purple-50">
      <Tabs defaultValue="sugerencias" className="h-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="sugerencias" className="relative rounded-none">
            Sugerencias
            {suggestions.length > 0 && (
              <Badge className="ml-2 h-5 rounded-full px-1.5 text-xs">{suggestions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="acciones" className="rounded-none">
            Acciones
          </TabsTrigger>
          <TabsTrigger value="estructura" className="rounded-none">
            Estructura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sugerencias" className="m-0 h-[calc(100%-40px)]">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              <div>
                <h3 className="font-semibold">Mejoras Sugeridas por IA</h3>
                <p className="text-sm text-muted-foreground">Actualizadas cada 5 segundos de inactividad</p>
              </div>

              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="rounded-lg border bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-start gap-2">
                    {getSuggestionIcon(suggestion.tipo)}
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{suggestion.ubicacion}</div>
                      <p className="mt-1 text-sm">{suggestion.texto}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      Aplicar
                    </Button>
                    <Button size="sm" variant="ghost">
                      Ignorar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="acciones" className="m-0 h-[calc(100%-40px)]">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-4">
              <div>
                <h3 className="font-semibold">Acciones Rápidas de IA</h3>
              </div>

              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Expandir Sección</div>
                  <div className="text-xs text-muted-foreground">Agrega más detalle y ejemplos</div>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <Minimize className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Simplificar Lenguaje</div>
                  <div className="text-xs text-muted-foreground">Reduce complejidad</div>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <Lightbulb className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Agregar Ejemplo</div>
                  <div className="text-xs text-muted-foreground">IA sugiere ejemplo relevante</div>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <PlayCircle className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Generar Actividad</div>
                  <div className="text-xs text-muted-foreground">Crea actividad práctica</div>
                </div>
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="estructura" className="m-0 h-[calc(100%-40px)]">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4">
              <div>
                <h3 className="font-semibold">Estructura del Documento</h3>
              </div>

              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start font-bold">
                  Introducción al CSF
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start pl-6">
                  ¿Qué es el CSF?
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start pl-6">
                  Ejemplo: Airbnb
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start pl-6">
                  Cómo validar tu CSF
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
