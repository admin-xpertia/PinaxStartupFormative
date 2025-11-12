"use client"

import { useMemo, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Eye } from "lucide-react"

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
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
}

export function HerramientaCreacionPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
}: HerramientaCreacionPlayerProps) {
  const prompts = useMemo(() => normalizePrompts(content.promptsIniciales), [content.promptsIniciales])
  const variants = Array.isArray(content.variantes) ? content.variantes : []
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  const selectedVariant = variants[selectedVariantIndex]

  const handleSaveWithData = async () => {
    await onSave({
      respuestas: answers,
      varianteSeleccionada: selectedVariant,
    })
  }

  const handleCompleteWithData = async () => {
    await onComplete({
      respuestas: answers,
      varianteSeleccionada: selectedVariant,
    })
  }

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      proofPointName={proofPointName}
      exerciseDescription={content.descripcion || content.objetivo}
      onSave={handleSaveWithData}
      onComplete={handleCompleteWithData}
      onExit={onExit}
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
                  value={answers[prompt.id] || ""}
                  onChange={(event) => {
                    setAnswers((prev) => ({
                      ...prev,
                      [prompt.id]: event.target.value,
                    }))
                  }}
                  placeholder={prompt.placeholder || "Escribe aquí..."}
                />
              </div>
            ))}
            <Button variant="secondary" className="w-full" onClick={handleSaveWithData}>
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
                  onClick={() => setSelectedVariantIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedVariantIndex(index)
                    }
                  }}
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
                      <Button variant="outline" size="sm" className="w-full mt-2">
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
