"use client"

import { FileText, Layers, Target, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface WizardSidebarProps {
  currentStep: number
}

const steps = [
  { numero: 1, label: "Información Básica", icono: FileText },
  { numero: 2, label: "Estructura de Fases", icono: Layers },
  { numero: 3, label: "Proof Points", icono: Target },
  { numero: 4, label: "Revisión Final", icono: CheckCircle },
]

export function WizardSidebar({ currentStep }: WizardSidebarProps) {
  return (
    <aside className="w-[280px] border-r bg-muted/30 p-8">
      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icono
          const isActive = currentStep === step.numero
          const isCompleted = currentStep > step.numero
          const isPending = currentStep < step.numero

          return (
            <div key={step.numero} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={cn("absolute left-5 top-12 h-12 w-0.5", isCompleted ? "bg-primary" : "bg-border")} />
              )}

              {/* Step Item */}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isPending && "border-border bg-background text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 pt-1">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isActive && "text-foreground",
                      isCompleted && "text-foreground",
                      isPending && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
