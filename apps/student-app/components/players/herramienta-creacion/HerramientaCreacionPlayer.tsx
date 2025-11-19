"use client"

import { useEffect, useMemo, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Eye } from "lucide-react"
import { useAutoSave } from "@/hooks/useAutoSave"

interface CreationPrompt {
  id?: string
  titulo?: string
  descripcion?: string
  placeholder?: string
}

interface CreationVariant {
  id?: string
  titulo: string
  descripcion?: string
  contenido: string
  tono?: string
  enfoque?: string
}

interface CreationToolContent {
  titulo?: string
  descripcion?: string
  objetivo?: string
  promptsIniciales?: Array<string | CreationPrompt>
  variantes?: CreationVariant[]
  recomendaciones?: string[]
}

interface HerramientaCreacionPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: CreationToolContent
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
  readOnly?: boolean
}

export function HerramientaCreacionPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  savedData,
  onSave,
  onComplete,
  onExit,
  readOnly = false,
}: HerramientaCreacionPlayerProps) {
  const prompts = useMemo(() => normalizePrompts(content.promptsIniciales), [content.promptsIniciales])
  const variants = Array.isArray(content.variantes) ? content.variantes : []
  const [answers, setAnswers] = useState<Record<string, string>>(
    () =>
      (savedData?.respuestas as Record<string, string>) ||
      (savedData?.answers as Record<string, string>) ||
      {}
  )
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(() => {
    if (variants.length === 0) return 0
    const savedVariant = savedData?.varianteSeleccionada as any
    if (!savedVariant) return 0
    const matchedIndex = variants.findIndex(
      (variant: any) =>
        (savedVariant.id && variant.id && variant.id === savedVariant.id) ||
        (savedVariant.titulo && variant.titulo && variant.titulo === savedVariant.titulo)
    )
    return matchedIndex >= 0 ? matchedIndex : 0
  })

  const selectedVariant = variants[selectedVariantIndex]

  const creationPayload = useMemo(
    () => ({
      respuestas: answers,
      varianteSeleccionada: selectedVariant,
    }),
    [answers, selectedVariant],
  )

  useAutoSave({
    exerciseId,
    data: creationPayload,
    enabled: !readOnly,
    interval: 12000,
  })

  // Rehydrate saved answers/variant when data is available
  useEffect(() => {
    if (savedData && typeof savedData === "object") {
      setAnswers(
        (savedData.respuestas as Record<string, string>) ||
        (savedData.answers as Record<string, string>) ||
        {}
      )

      const savedVariant = savedData.varianteSeleccionada as any
      if (savedVariant && variants.length > 0) {
        const matchedIndex = variants.findIndex(
          (variant: any) =>
            (savedVariant.id && variant.id && variant.id === savedVariant.id) ||
            (savedVariant.titulo && variant.titulo && variant.titulo === savedVariant.titulo)
        )
        if (matchedIndex >= 0) {
          setSelectedVariantIndex(matchedIndex)
        }
      }
    }
  }, [savedData, variants])

  const handleSaveWithData = async () => {
    if (readOnly) return
    await onSave(creationPayload)
  }

  const handleCompleteWithData = async () => {
    if (readOnly) return
    await onComplete(creationPayload)
  }

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      proofPointName={proofPointName}
      exerciseDescription={content.descripcion || content.objetivo}
      onSave={!readOnly ? handleSaveWithData : undefined}
      onComplete={!readOnly ? handleCompleteWithData : undefined}
      onExit={onExit}
      canComplete={!readOnly}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información base</CardTitle>
            {content.objetivo && <CardDescription>{content.objetivo}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {prompts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Este ejercicio todavía no define prompts personalizados. Completa el brief con tus propias notas.
              </p>
            )}
            {prompts.map((prompt) => (
              <div key={prompt.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{prompt.titulo}</label>
                  {prompt.descripcion && (
                    <Badge variant="outline" className="text-xs">
                      Contexto
                    </Badge>
                  )}
                </div>
                {prompt.descripcion && (
                  <p className="text-xs text-muted-foreground">{prompt.descripcion}</p>
                )}
                <Textarea
                  value={prompt.id ? (answers[prompt.id] || "") : ""}
                  onChange={(event) => {
                    if (readOnly) return
                    const promptId = prompt.id
                    if (promptId) {
                      setAnswers((prev) => ({
                        ...prev,
                        [promptId]: event.target.value,
                      }))
                    }
                  }}
                  placeholder={prompt.placeholder || "Escribe aquí..."}
                  disabled={readOnly}
                  className={readOnly ? "bg-muted text-muted-foreground resize-none" : undefined}
                />
              </div>
            ))}
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleSaveWithData}
              disabled={readOnly}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Guardar brief personalizado
            </Button>
          </CardContent>
        </Card>

        {variants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Variantes sugeridas</CardTitle>
              <CardDescription>
                Selecciona una propuesta para continuar la edición con tu instructor.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {variants.map((variant, index) => (
                <Card
                  key={variant.id ?? index}
                  className={`h-full cursor-pointer transition-shadow ${selectedVariantIndex === index ? "ring-2 ring-primary" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (readOnly) return
                    setSelectedVariantIndex(index)
                  }}
                  onKeyDown={(event) => {
                    if (readOnly) return
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedVariantIndex(index)
                    }
                  }}
                  aria-disabled={readOnly}
                >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{variant.titulo}</CardTitle>
                        {variant.tono && <Badge variant="outline">{variant.tono}</Badge>}
                      </div>
                      {variant.descripcion && (
                        <CardDescription>{variant.descripcion}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{variant.contenido}</p>
                      {variant.enfoque && (
                        <p className="text-xs font-medium text-primary">
                          Enfoque: {variant.enfoque}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        disabled={readOnly}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                    </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {Array.isArray(content.recomendaciones) && content.recomendaciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones finales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {content.recomendaciones.map((tip, index) => (
                <div key={`tip-${index}`} className="rounded-lg border p-3">
                  {tip}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ExercisePlayer>
  )
}

function normalizePrompts(prompts?: Array<string | CreationPrompt>): CreationPrompt[] {
  if (!Array.isArray(prompts)) return []
  return prompts.map((prompt, index) => {
    if (typeof prompt === "string") {
      return {
        id: `prompt-${index}`,
        titulo: prompt,
      }
    }

    return {
      id: prompt.id || `prompt-${index}`,
      titulo: prompt.titulo || `Campo ${index + 1}`,
      descripcion: prompt.descripcion,
      placeholder: prompt.placeholder,
    }
  })
}
