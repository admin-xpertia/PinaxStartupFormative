"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ContentGenerationWizard } from "@/components/generation/content-generation-wizard"
import { ContentPreviewAnalysis } from "@/components/generation/content-preview-analysis"
import { mockLeccionGenerada } from "@/lib/mock-generated-content"
import type { GenerationConfig } from "@/types/content"

export default function GenerationDemoPage() {
  const [showWizard, setShowWizard] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleGenerate = (config: GenerationConfig) => {
    console.log("[v0] Generando contenido con config:", config)
    setShowWizard(false)
    setShowPreview(true)
  }

  const handleAccept = () => {
    console.log("[v0] Contenido aceptado, abriendo editor...")
    setShowPreview(false)
  }

  const handleRegenerate = () => {
    console.log("[v0] Regenerando contenido...")
    setShowPreview(false)
    setShowWizard(true)
  }

  const handleDiscard = () => {
    console.log("[v0] Contenido descartado")
    setShowPreview(false)
  }

  if (showPreview) {
    return (
      <ContentPreviewAnalysis
        contenido={mockLeccionGenerada}
        onAccept={handleAccept}
        onRegenerate={handleRegenerate}
        onDiscard={handleDiscard}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-4">Demo: Generación de Contenido con IA</h1>
          <p className="text-muted-foreground mb-6">
            Esta es una demostración del sistema de generación de contenido de Xpertia Platform. Haz clic en el botón
            para iniciar el wizard de generación.
          </p>
          <Button onClick={() => setShowWizard(true)} size="lg" className="bg-primary">
            Iniciar Wizard de Generación
          </Button>
        </Card>
      </div>

      <ContentGenerationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        tipoComponente="leccion"
        nombreComponente="Introducción al Customer-Solution Fit"
        contexto={{
          programa: "Lean Startup Mastery",
          fase: "Validación de Problema",
          proofPoint: "Customer-Solution Fit Validation",
          preguntaCentral: "¿Existe un problema real que valga la pena resolver?",
          nivel: "Fundamentos de CSF",
          objetivoNivel: "Comprender qué es Customer-Solution Fit y por qué es crítico",
        }}
        onGenerate={handleGenerate}
      />
    </div>
  )
}
