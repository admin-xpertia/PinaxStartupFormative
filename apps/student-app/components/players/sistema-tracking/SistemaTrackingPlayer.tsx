"use client"

import { useMemo, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LineChart, TrendingUp } from "lucide-react"
import { useAutoSave } from "@/hooks/useAutoSave"

interface SistemaTrackingPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: any
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
  readOnly?: boolean
}

export function SistemaTrackingPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  savedData,
  onSave,
  onComplete,
  onExit,
  readOnly = false,
}: SistemaTrackingPlayerProps) {
  const [metrics, setMetrics] = useState<Record<string, number>>(
    () => (savedData?.metrics as Record<string, number>) || savedData || {}
  )

  const trackingPayload = useMemo(() => ({ metrics }), [metrics])

  useAutoSave({
    exerciseId,
    data: trackingPayload,
    enabled: !readOnly,
    interval: 8000,
  })

  const updateMetric = (key: string, value: number) => {
    if (readOnly) return
    setMetrics((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveWithData = async () => {
    if (readOnly) return
    await onSave(trackingPayload)
  }

  const handleCompleteWithData = async () => {
    if (readOnly) return
    await onComplete(trackingPayload)
  }

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      proofPointName={proofPointName}
      onSave={!readOnly ? handleSaveWithData : undefined}
      onComplete={!readOnly ? handleCompleteWithData : undefined}
      onExit={onExit}
      canComplete={!readOnly}
    >
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
              <Input
                type="number"
                value={metrics.m1 || ""}
                onChange={(e) => updateMetric("m1", Number(e.target.value))}
                disabled={readOnly}
                className={readOnly ? "bg-muted text-muted-foreground" : undefined}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Métrica 2</label>
              <Input
                type="number"
                value={metrics.m2 || ""}
                onChange={(e) => updateMetric("m2", Number(e.target.value))}
                disabled={readOnly}
                className={readOnly ? "bg-muted text-muted-foreground" : undefined}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Sistema de tracking de métricas con gráficas (implementación completa pendiente)</p>
        </CardContent>
      </Card>
    </ExercisePlayer>
  )
}
