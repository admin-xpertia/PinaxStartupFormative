"use client"

import { useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LineChart, TrendingUp } from "lucide-react"

export function SistemaTrackingPlayer({ exerciseId, exerciseName, proofPointName, content, onSave, onComplete, onExit }: any) {
  const [metrics, setMetrics] = useState<Record<string, number>>({})

  return (
    <ExercisePlayer exerciseId={exerciseId} exerciseName={exerciseName} proofPointName={proofPointName} onSave={onSave} onComplete={onComplete} onExit={onExit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Registro de Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Métrica 1</label>
              <Input type="number" value={metrics.m1 || ""} onChange={(e) => setMetrics({ ...metrics, m1: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Métrica 2</label>
              <Input type="number" value={metrics.m2 || ""} onChange={(e) => setMetrics({ ...metrics, m2: Number(e.target.value) })} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Sistema de tracking de métricas con gráficas (implementación completa pendiente)</p>
        </CardContent>
      </Card>
    </ExercisePlayer>
  )
}
