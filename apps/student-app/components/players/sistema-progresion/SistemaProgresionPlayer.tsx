"use client"

import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card } from "@/components/ui/card"
import { Award } from "lucide-react"

interface SistemaProgresionPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
  readOnly?: boolean
}

export function SistemaProgresionPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
  readOnly = false,
}: SistemaProgresionPlayerProps) {
  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      proofPointName={proofPointName}
      onSave={!readOnly ? onSave : undefined}
      onComplete={!readOnly ? onComplete : undefined}
      onExit={onExit}
      canComplete={!readOnly}
    >
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Sistema de Progresión</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Visualización de badges y logros (implementación completa pendiente)
        </p>
      </Card>
    </ExercisePlayer>
  )
}
