"use client"

import { useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Download, Eye } from "lucide-react"

interface CreationToolContent {
  titulo: string
  tipoCreacion: "business_model" | "value_proposition" | "pitch_deck"
  promptsIniciales: string[]
}

export function HerramientaCreacionPlayer({ exerciseId, exerciseName, proofPointName, content, onSave, onComplete, onExit }: any) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [variants, setVariants] = useState<any[]>([])
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setTimeout(() => {
      setVariants([
        { id: 1, title: "Variante A", content: "Contenido generado A" },
        { id: 2, title: "Variante B", content: "Contenido generado B" },
        { id: 3, title: "Variante C", content: "Contenido generado C" },
      ])
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <ExercisePlayer exerciseId={exerciseId} exerciseName={exerciseName} proofPointName={proofPointName} onSave={onSave} onComplete={onComplete} onExit={onExit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.promptsIniciales.map((prompt: string, idx: number) => (
              <div key={idx}>
                <label className="text-sm font-medium">{prompt}</label>
                <Textarea
                  value={inputs[`p${idx}`] || ""}
                  onChange={(e) => setInputs({ ...inputs, [`p${idx}`]: e.target.value })}
                  placeholder="Escribe aquí..."
                />
              </div>
            ))}
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? "Generando..." : "Generar Variantes con IA"}
            </Button>
          </CardContent>
        </Card>

        {variants.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {variants.map((v, idx) => (
              <Card key={v.id} className={selectedVariant === idx ? "border-primary" : ""} onClick={() => setSelectedVariant(idx)}>
                <CardHeader>
                  <CardTitle className="text-lg">{v.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{v.content}</p>
                  <Button size="sm" variant="outline" className="mt-4 w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Seleccionar y Editar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ExercisePlayer>
  )
}
