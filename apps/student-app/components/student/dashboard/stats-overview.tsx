import { BookOpen, Shield, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Phase } from "@/types/enrollment"
import {
  phaseStatusLabels,
  phaseStatusThemes,
  type PhaseStatus,
} from "@/lib/dashboard"
import { cn } from "@/lib/utils"

interface StatsOverviewProps {
  stats: {
    progress: number
    proofPointsLabel: string
    completed: number
    total: number
    instructor?: string
    cohort?: string
  }
  selectedPhase?: Phase | null
  selectedPhaseProgress: number
  selectedPhaseStatus: PhaseStatus
}

export function StatsOverview({
  stats,
  selectedPhase,
  selectedPhaseProgress,
  selectedPhaseStatus,
}: StatsOverviewProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border-none bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <p className="text-sm text-muted-foreground">Progreso general</p>
            <p className="text-3xl font-semibold text-primary">{stats.progress}%</p>
          </div>
          <TrendingUp className="h-9 w-9 text-primary/80" />
        </CardHeader>
        <CardContent>
          <Progress value={stats.progress} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.proofPointsLabel} proof points completados
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <p className="text-sm text-muted-foreground">Tu instructor</p>
            <p className="text-xl font-semibold">{stats.instructor || "Por asignar"}</p>
            {stats.cohort && <p className="text-xs text-muted-foreground">Cohorte {stats.cohort}</p>}
          </div>
          <Shield className="h-8 w-8 text-sky-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Agenda mentorías o resuelve dudas desde tu panel.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <p className="text-sm text-muted-foreground">Proof points</p>
            <p className="text-3xl font-semibold">
              {stats.completed}/{stats.total}
            </p>
            <p className="text-xs text-muted-foreground">Finalizados vs totales</p>
          </div>
          <BookOpen className="h-9 w-9 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sigue desbloqueando niveles para avanzar en tu ruta.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <p className="text-sm text-muted-foreground">Fase destacada</p>
            <CardTitle className="text-xl">
              {selectedPhase ? selectedPhase.nombre : "Sin fase asignada"}
            </CardTitle>
          </div>
          {selectedPhase && (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                phaseStatusThemes[selectedPhaseStatus]
              )}
            >
              {phaseStatusLabels[selectedPhaseStatus]}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Progress value={selectedPhaseProgress} className="h-2 flex-1" />
            <span className="text-sm font-semibold">{selectedPhaseProgress}%</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {selectedPhase?.duracionSemanas
              ? `${selectedPhase.duracionSemanas} semanas estimadas`
              : "Duración estimada por definir"}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
