"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WizardSidebar } from "./wizard-sidebar"
import { Step1BasicInfo } from "./steps/step-1-basic-info"
import { Step2Phases } from "./steps/step-2-phases"
import { Step3ProofPoints } from "./steps/step-3-proof-points"
import { Step4Review } from "./steps/step-4-review"
import type { ProgramFormData } from "@/types/wizard"
import { programsApi, fasesApi, proofPointsApi } from "@/services/api"
import type { CreateProgramRequest } from "@/types/api"

interface ProgramWizardProps {
  onClose: () => void
  onComplete: (data: unknown) => void
}

export function ProgramWizard({ onClose, onComplete }: ProgramWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProgramFormData>({
    nombre_programa: "",
    descripcion: "",
    categoria: "",
    duracion_semanas: 12,
    numero_fases: 4,
    fases: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateFormData = (): boolean => {
    // Validar campos básicos
    if (!formData.nombre_programa?.trim()) {
      setError("El nombre del programa es requerido")
      return false
    }

    // Validar fases
    for (let i = 0; i < formData.fases.length; i++) {
      const fase = formData.fases[i]
      if (!fase.nombre_fase?.trim()) {
        setError(`La fase ${i + 1} necesita un nombre`)
        return false
      }

      // Validar proof points
      for (let j = 0; j < fase.proof_points.length; j++) {
        const pp = fase.proof_points[j]
        if (!pp.nombre_pp?.trim()) {
          setError(`El proof point ${j + 1} de la fase ${i + 1} necesita un nombre`)
          return false
        }
        if (!pp.pregunta_central?.trim()) {
          setError(`El proof point ${j + 1} de la fase ${i + 1} necesita una pregunta central`)
          return false
        }
      }
    }

    return true
  }

  const handleComplete = async () => {
    setError(null)

    // Validar antes de enviar
    if (!validateFormData()) {
      return
    }

    setIsLoading(true)

    try {
      // TODO: Get real creator ID from auth context
      const creadorId = "user:admin" // Temporary - should come from auth

      // Step 1: Create program with basic info
      const programRequest: CreateProgramRequest = {
        nombre: formData.nombre_programa,
        descripcion: formData.descripcion || "",
        duracionSemanas: Number.parseInt(String(formData.duracion_semanas)) || 12,
        creadorId,
        categoria: formData.categoria || undefined,
      }

      console.log("Creating program:", programRequest)
      const nuevoPrograma = await programsApi.create(programRequest)
      console.log("Program created:", nuevoPrograma)

      // Step 2: Add fases to the program
      for (let i = 0; i < formData.fases.length; i++) {
        const faseData = formData.fases[i]

        console.log(`Adding fase ${i + 1}:`, faseData)
        const faseResponse = await fasesApi.create(nuevoPrograma.id, {
          nombre: faseData.nombre_fase,
          descripcion: faseData.descripcion_fase || "",
          objetivosAprendizaje: faseData.objetivos_aprendizaje
            ? faseData.objetivos_aprendizaje.split('\n').filter(o => o.trim())
            : [],
          duracionSemanasEstimada: Number.parseInt(String(faseData.duracion_semanas_fase)) || 1,
        })
        console.log(`Fase ${i + 1} created:`, faseResponse)

        // Step 3: Add proof points to each fase
        for (let j = 0; j < faseData.proof_points.length; j++) {
          const ppData = faseData.proof_points[j]

          console.log(`Adding proof point ${j + 1} to fase ${i + 1}:`, ppData)
          await proofPointsApi.create(faseResponse.id, {
            nombre: ppData.nombre_pp,
            slug: ppData.slug_pp || proofPointsApi.generateSlug(ppData.nombre_pp),
            descripcion: ppData.descripcion_pp || "",
            preguntaCentral: ppData.pregunta_central,
            duracionEstimadaHoras: Number.parseInt(String(ppData.duracion_estimada_horas)) || 1,
            tipoEntregableFinal: ppData.tipo_entregable || undefined,
            prerequisitos: ppData.prerequisitos || [],
          })
        }
      }

      console.log("Program, fases, and proof points created successfully!")

      onComplete(nuevoPrograma)

      // Redirect to program detail page
      if (nuevoPrograma?.id) {
        router.push(`/programas/${nuevoPrograma.id}`)
      }
    } catch (err: any) {
      console.error("Error creating program:", err)

      // Handle API client errors
      if (err.statusCode === 401) {
        setError(
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar."
        )
        return
      }

      if (err.statusCode === 400) {
        setError(`Error de validación: ${err.message}`)
        return
      }

      // Handle other errors
      const message =
        err.message ||
        "Ocurrió un error al crear el programa. Por favor, intenta nuevamente."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (data: Partial<ProgramFormData>) => {
    setFormData({ ...formData, ...data })
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
        <h1 className="text-xl font-semibold">Crear Nuevo Programa</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Progress */}
        <WizardSidebar currentStep={currentStep} />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-16 py-12">
            {error && (
              <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {currentStep === 1 && <Step1BasicInfo data={formData} onUpdate={updateFormData} />}
            {currentStep === 2 && <Step2Phases data={formData} onUpdate={updateFormData} />}
            {currentStep === 3 && <Step3ProofPoints data={formData} onUpdate={updateFormData} />}
            {currentStep === 4 && <Step4Review data={formData} onGoToStep={setCurrentStep} />}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t bg-background px-16 py-4 shadow-lg">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>

        <div className="text-sm text-muted-foreground">Paso {currentStep} de 4</div>

        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="secondary" onClick={handlePrevious}>
              ← Anterior
            </Button>
          )}
          {currentStep < 4 ? (
            <Button onClick={handleNext}>Siguiente →</Button>
          ) : (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Programa"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
