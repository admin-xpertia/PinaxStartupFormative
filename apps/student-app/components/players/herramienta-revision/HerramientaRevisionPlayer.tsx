"use client"

import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface HerramientaRevisionPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
  readOnly?: boolean
}

export function HerramientaRevisionPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  onSave,
  onComplete,
  onExit,
  readOnly = false,
}: HerramientaRevisionPlayerProps) {
  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      proofPointName={proofPointName}
      onSave={!readOnly ? onSave : undefined}
      onComplete={!readOnly ? onComplete : undefined}
      onExit={onExit}
      showAIAssistant={true}
      canComplete={!readOnly}
    >
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Herramienta de Revisión</h3>
        </div>
        <p className="text-sm text-muted-foreground">Player de revisión con feedback IA (implementación completa pendiente)</p>
      </Card>
    </ExercisePlayer>
  )
}
