"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WizardSidebar } from "./wizard-sidebar"
import { Step1BasicInfo } from "./steps/step-1-basic-info"
import { Step2Phases } from "./steps/step-2-phases"
import { Step3ProofPoints } from "./steps/step-3-proof-points"
import { Step4Review } from "./steps/step-4-review"
import type { ProgramFormData } from "@/types/wizard"

interface ProgramWizardProps {
  onClose: () => void
  onComplete: (data: ProgramFormData) => void
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

  const handleComplete = () => {
    console.log("[v0] Creating program:", formData)
    onComplete(formData)
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
            <Button onClick={handleComplete}>Crear Programa</Button>
          )}
        </div>
      </footer>
    </div>
  )
}
