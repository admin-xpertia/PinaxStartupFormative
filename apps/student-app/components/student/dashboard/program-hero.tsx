import { ArrowRight, Calendar, Clock, Layers } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface ProgramHeroProps {
  programName: string
  programDescription?: string
  selectedPhaseOrder?: number
  selectedPhaseDurationWeeks?: number
  estimatedCompletionLabel: string
  stats: {
    progress: number
    proofPointsLabel: string
  }
  onPrimaryAction: () => void
  primaryActionLabel: string
}

export function ProgramHero({
  programName,
  programDescription,
  selectedPhaseDurationWeeks,
  selectedPhaseOrder,
  estimatedCompletionLabel,
  stats,
  onPrimaryAction,
  primaryActionLabel,
}: ProgramHeroProps) {
  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-r from-primary/10 via-primary/5 to-white shadow-xl">
      <CardContent className="relative z-10 flex flex-col gap-6 p-6 text-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="border-white/60 bg-white/70 text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Programa activo
          </Badge>
          <h1 className="text-3xl font-semibold leading-tight">{programName}</h1>
          {programDescription && <p className="text-base text-slate-600">{programDescription}</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              {selectedPhaseOrder ? `Fase ${selectedPhaseOrder}` : "Sin fase asignada"}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {estimatedCompletionLabel}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {selectedPhaseDurationWeeks
                ? `${selectedPhaseDurationWeeks} semanas`
                : "Duración estimada"}
            </span>
          </div>
        </div>
        <div className="w-full max-w-sm rounded-2xl bg-white/80 p-5 shadow-lg backdrop-blur">
          <p className="text-sm font-medium text-muted-foreground">Avance general</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-primary">{stats.progress}%</span>
            <span className="text-sm text-muted-foreground">{stats.proofPointsLabel} proof points</span>
          </div>
          <Progress value={stats.progress} className="mt-3 h-2" />
          <Button className="mt-4 w-full" onClick={onPrimaryAction}>
            {primaryActionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),transparent_55%)]" />
    </Card>
  )
}
