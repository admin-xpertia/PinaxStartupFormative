"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export interface PhaseProgress {
  id: string
  nombre: string
  progreso: number
  promedioScore?: number
}

interface CohortProgressChartProps {
  phases: PhaseProgress[]
}

export function CohortProgressChart({ phases }: CohortProgressChartProps) {
  const avgProgress =
    phases.length > 0
      ? Math.round(phases.reduce((acc, phase) => acc + (phase.progreso || 0), 0) / phases.length)
      : 0
  const avgScorePhases = phases.filter((p) => typeof p.promedioScore === "number")
  const avgScore =
    avgScorePhases.length > 0
      ? Math.round(
          avgScorePhases.reduce((acc, phase) => acc + (phase.promedioScore || 0), 0) /
            avgScorePhases.length,
        )
      : null

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Progreso del cohorte</CardTitle>
            <CardDescription>Fases completadas y promedio por evaluación</CardDescription>
          </div>
          {phases.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{avgProgress}% avance global</Badge>
              {avgScore !== null && (
                <Badge variant="outline" className="text-emerald-600">
                  Score {avgScore}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {phases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin fases publicadas todavía.</p>
        ) : (
          phases.map((phase) => (
            <div key={phase.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="font-semibold">{phase.nombre}</div>
                <div className="flex items-center gap-2">
                  {typeof phase.promedioScore === "number" && (
                    <Badge variant="outline">Score {phase.promedioScore}%</Badge>
                  )}
                  <span className="text-muted-foreground">{phase.progreso}%</span>
                </div>
              </div>
              <Progress value={phase.progreso} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
