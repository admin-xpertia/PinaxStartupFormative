"use client"

import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card } from "@/components/ui/card"
import { Award } from "lucide-react"

export function SistemaProgresionPlayer({ exerciseId, exerciseName, proofPointName, content, onSave, onComplete, onExit }: any) {
  return (
    <ExercisePlayer exerciseId={exerciseId} exerciseName={exerciseName} proofPointName={proofPointName} onSave={onSave} onComplete={onComplete} onExit={onExit}>
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Sistema de Progresión</h3>
        </div>
        <p className="text-sm text-muted-foreground">Visualización de badges y logros (implementación completa pendiente)</p>
      </Card>
    </ExercisePlayer>
  )
}
