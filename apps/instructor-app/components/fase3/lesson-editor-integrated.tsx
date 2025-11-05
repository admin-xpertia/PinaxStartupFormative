"use client"

import { useState, useEffect, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Loader2,
  FileText,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useContenido, useGuardarContenido, usePublicarContenido } from "@/lib/hooks/use-contenido"
import { RubricaEditor } from "./rubrica-editor"
import { toast } from "@/components/ui/use-toast"

interface LessonEditorIntegratedProps {
  componenteId: string
  componenteNombre: string
  onClose?: () => void
}

export function LessonEditorIntegrated({
  componenteId,
  componenteNombre: initialNombre,
  onClose,
}: LessonEditorIntegratedProps) {
  const [componenteNombre, setComponenteNombre] = useState(initialNombre)
  const [showPreview, setShowPreview] = useState(false)
  const [showRubricaEditor, setShowRubricaEditor] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())

  // Cargar contenido desde la API
  const { contenido, isLoading, error } = useContenido(componenteId)
  const { guardarContenido, isGuardando } = useGuardarContenido(componenteId)
  const { publicarContenido, isPublicando } = usePublicarContenido()

  // Inicializar editor con contenido de la API
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
    content: contenido?.contenido?.markdown || "",
    onUpdate: () => {
      setHasChanges(true)
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none",
      },
    },
  })

  // Actualizar editor cuando carga el contenido
  useEffect(() => {
    if (editor && contenido?.contenido?.markdown) {
      editor.commands.setContent(contenido.contenido.markdown)
      setHasChanges(false)
    }
  }, [contenido, editor])

  // Auto-save cada 30 segundos
  useEffect(() => {
    if (!hasChanges || !editor) return

    const timer = setTimeout(() => {
      handleSave()
    }, 30000)

    return () => clearTimeout(timer)
  }, [hasChanges, editor])

  // Calcular metadata
  const metadata = useCallback(() => {
    if (!editor) return {
      palabras_estimadas: 0,
      tiempo_lectura_minutos: 0,
      secciones: 0,
    }

    const text = editor.getText()
    const palabras = text.split(/\s+/).filter(Boolean).length
    const duracion_lectura_minutos = Math.ceil(palabras / 250)

    return {
      palabras_estimadas: palabras,
      tiempo_lectura_minutos: duracion_lectura_minutos,
      secciones: 1, // TODO: calcular secciones reales
    }
  }, [editor])

  const handleSave = async () => {
    if (!editor) return

    try {
      await guardarContenido({
        markdown: editor.getHTML(),
        ...metadata(),
      })
      setHasChanges(false)
      setLastSaved(new Date())
    } catch (error) {
      // El error ya se muestra en el hook
    }
  }

  const handlePublicar = async () => {
    if (!contenido?.id) return

    if (!confirm("¿Estás seguro de que quieres publicar este contenido? Futuras ediciones crearán versiones automáticamente.")) {
      return
    }

    try {
      await publicarContenido(contenido.id)
      // Recargar contenido
    } catch (error) {
      // El error ya se muestra en el hook
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error al cargar el contenido</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => onClose?.()}>Volver</Button>
        </div>
      </div>
    )
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
          placeholder="Nombre del componente"
        />

        <div className="flex items-center gap-2">
          {/* Estado */}
          <Badge variant={contenido?.estado === "publicado" ? "default" : "secondary"}>
            {contenido?.estado === "publicado" ? "Publicado" : "Borrador"}
          </Badge>

          {/* Indicador de guardado */}
          {isGuardando ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </div>
          ) : hasChanges ? (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Sin guardar
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Guardado
            </div>
          )}

          {/* Botones de acción */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRubricaEditor(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Gestionar Rúbrica
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || isGuardando}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>

          {contenido?.estado === "draft" && (
            <Button
              onClick={handlePublicar}
              disabled={isPublicando || hasChanges}
              variant="default"
              size="sm"
            >
              {isPublicando ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Publicar
            </Button>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-16 z-40 flex items-center gap-1 border-b bg-white px-6 py-2">
        <MenuBar editor={editor} />
      </div>

      {/* Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <ScrollArea className={cn("flex-1 p-8", showPreview && "w-1/2")}>
          <div className="mx-auto max-w-4xl">
            <EditorContent editor={editor} />
          </div>
        </ScrollArea>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 border-l">
            <ScrollArea className="h-full p-8">
              <div className="mx-auto max-w-4xl">
                <div
                  className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl"
                  dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Footer con metadata */}
      <footer className="border-t bg-muted/50 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{metadata().palabras_estimadas} palabras</span>
            <span>~{metadata().tiempo_lectura_minutos} min lectura</span>
          </div>
          <div>
            Última modificación: {lastSaved.toLocaleString()}
          </div>
        </div>
      </footer>

      {/* Rubrica Editor Modal */}
      <RubricaEditor
        componenteId={componenteId}
        open={showRubricaEditor}
        onOpenChange={setShowRubricaEditor}
      />
    </div>
  )
}

// ============================================================================
// MENU BAR
// ============================================================================

function MenuBar({ editor }: { editor: any }) {
  if (!editor) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(editor.isActive("bold") && "bg-muted")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(editor.isActive("italic") && "bg-muted")}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(editor.isActive("underline") && "bg-muted")}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-border" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive("bulletList") && "bg-muted")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(editor.isActive("orderedList") && "bg-muted")}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-border" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(editor.isActive("blockquote") && "bg-muted")}
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(editor.isActive("codeBlock") && "bg-muted")}
      >
        <Code className="h-4 w-4" />
      </Button>
      <div className="mx-2 h-6 w-px bg-border" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = window.prompt("URL")
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          }
        }}
        className={cn(editor.isActive("link") && "bg-muted")}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = window.prompt("URL de la imagen")
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
          }
        }}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </>
  )
}
