import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Phase } from "@shared-types/enrollment"
import { cn } from "@/lib/utils"
import { getPhaseProgress, getPhaseStatus, phaseStatusLabels, phaseStatusThemes } from "@/lib/dashboard"

interface PhaseRoadmapProps {
  phases: Phase[]
  selectedPhaseIdx: number
  onSelect: (idx: number) => void
}

export function PhaseRoadmap({ phases, selectedPhaseIdx, onSelect }: PhaseRoadmapProps) {
  return (
    <Card className="border-none bg-white shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle>Ruta del programa</CardTitle>
        <p className="text-sm text-muted-foreground">
          Explora las fases y selecciona dónde quieres enfocarte hoy.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {phases.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Esta cohorte aún no tiene estructura publicada.
          </p>
        )}
        {phases.map((phase, idx) => {
          const status = getPhaseStatus(phase)
          const progress = getPhaseProgress(phase)
          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => onSelect(idx)}
              className={cn(
                "w-full rounded-2xl border border-transparent bg-white/70 p-4 text-left transition-all hover:border-primary/40 hover:bg-white",
                selectedPhaseIdx === idx && "border-primary/40 bg-white shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Fase {phase.orden}</p>
                  <p className="text-base font-semibold text-foreground">{phase.nombre}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    phaseStatusThemes[status]
                  )}
                >
                  {phaseStatusLabels[status]}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {phase.descripcion || "Próximamente más detalles"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-semibold">{progress}%</span>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
