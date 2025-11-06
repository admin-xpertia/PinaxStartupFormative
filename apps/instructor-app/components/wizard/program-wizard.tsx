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
import { apiClient } from "@/lib/api-client"

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
      // Asegurar que todos los campos numéricos sean enteros válidos
      const sanitizedData = {
        ...formData,
        duracion_semanas: Number.parseInt(String(formData.duracion_semanas)) || 0,
        numero_fases: Number.parseInt(String(formData.numero_fases)) || 0,
        fases: formData.fases.map(fase => ({
          ...fase,
          duracion_semanas_fase: Number.parseInt(String(fase.duracion_semanas_fase)) || 0,
          numero_proof_points: Number.parseInt(String(fase.numero_proof_points)) || 0,
          proof_points: fase.proof_points.map(pp => ({
            ...pp,
            numero_niveles: Number.parseInt(String(pp.numero_niveles)) || 3,
            duracion_estimada_horas: Number.parseInt(String(pp.duracion_estimada_horas)) || 0,
          }))
        }))
      }

      console.log("Datos a enviar:", JSON.stringify(sanitizedData, null, 2))

      const response = await apiClient.post("/programas", sanitizedData)
      const nuevoPrograma = response.data

      onComplete(nuevoPrograma)
      if (nuevoPrograma?.id) {
        router.push(`/programas/${nuevoPrograma.id}/arquitectura`)
      }
    } catch (err: any) {
      console.error("Error al crear programa:", err)
      console.error("Error response:", err.response?.data)

      // Manejar errores de autenticación
      if (err.response?.status === 401) {
        setError(
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar."
        )
        // El interceptor de api-client ya redirigirá al login
        return
      }

      // Manejar errores de validación del backend
      if (err.response?.status === 400 && err.response?.data?.message) {
        const errorMessage = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(", ")
          : err.response.data.message
        setError(`Error de validación: ${errorMessage}`)
        return
      }

      // Manejar otros errores
      const message =
        err.response?.data?.message ||
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
