"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Salud del Cohorte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phases.map((phase) => (
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
        ))}
      </CardContent>
    </Card>
  )
}
