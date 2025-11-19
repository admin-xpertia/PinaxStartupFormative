import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getPhaseProgress } from "@/lib/dashboard"
import { cn } from "@/lib/utils"
import type { Phase } from "@shared-types/enrollment"
import { CheckCircle2, Lock, PlayCircle } from "lucide-react"

interface PhaseRoadmapAccordionProps {
  phases: Phase[]
  onOpenProofPoint: (proofPointId: string) => void
  activePhaseId?: string
  onPhaseChange?: (phaseId: string) => void
  pendingReviewMap?: Record<string, { exerciseName: string; status: string }>
  onViewPendingFeedback?: (proofPointId: string) => void
}

export function PhaseRoadmapAccordion({
  phases,
  onOpenProofPoint,
  activePhaseId,
  onPhaseChange,
  pendingReviewMap,
  onViewPendingFeedback,
}: PhaseRoadmapAccordionProps) {
  const openValue = activePhaseId ?? phases[0]?.id

  const handleChange = (value: string) => {
    if (!value && phases[0]) {
      onPhaseChange?.(phases[0].id)
      return
    }
    if (value) {
      onPhaseChange?.(value)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-4">
      <h2 className="text-2xl font-bold mb-4">Tu Mapa de Ruta</h2>
      {phases.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay fases publicadas para este programa.
        </p>
      ) : (
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4"
          value={openValue}
          onValueChange={handleChange}
        >
          {phases.map((phase) => (
            <AccordionItem
              key={phase.id}
              value={phase.id}
              className="border border-slate-200 rounded-xl bg-white px-4 shadow-sm data-[state=open]:ring-2 data-[state=open]:ring-primary/10"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex flex-1 items-center justify-between mr-4">
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fase {phase.orden}
                    </span>
                    <span className="text-lg font-semibold">{phase.nombre}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end gap-1 w-32">
                      <span className="text-xs font-medium">{getPhaseProgress(phase)}%</span>
                      <Progress value={getPhaseProgress(phase)} className="h-2 w-full" />
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-2 pb-6">
                <div className="grid gap-3 md:grid-cols-2">
                  {phase.proofPoints.map((pp) => (
                    <div
                      key={pp.id}
                      onClick={() => pp.status !== "locked" && onOpenProofPoint(pp.id)}
                      className={cn(
                        "flex items-center p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                        pp.status === "completed"
                          ? "bg-emerald-50 border-emerald-200 hover:border-emerald-300"
                          : pp.status === "locked"
                            ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                            : "bg-white border-slate-200 hover:border-primary/50"
                      )}
                    >
                      <div className="mr-4">
                        {pp.status === "completed" ? (
                          <CheckCircle2 className="text-green-500 h-6 w-6" />
                        ) : pp.status === "locked" ? (
                          <Lock className="text-slate-400 h-6 w-6" />
                        ) : (
                          <PlayCircle className="text-primary h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm">{pp.nombre}</h4>
                          <Badge variant="outline" className="text-[11px]">
                            {pp.exercises.length} ejercicios
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {pp.preguntaCentral || "Acceder al contenido"}
                        </p>
                        {pendingReviewMap?.[pp.id] ? (
                          <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              Revisión pendiente
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-amber-700 hover:text-amber-800"
                              onClick={(event) => {
                                event.stopPropagation()
                                onViewPendingFeedback?.(pp.id)
                              }}
                            >
                              Ver feedback IA
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
