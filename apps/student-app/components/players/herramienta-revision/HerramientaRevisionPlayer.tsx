"use client"

import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export function HerramientaRevisionPlayer({ exerciseId, exerciseName, proofPointName, content, onSave, onComplete, onExit }: any) {
  return (
    <ExercisePlayer exerciseId={exerciseId} exerciseName={exerciseName} proofPointName={proofPointName} onSave={onSave} onComplete={onComplete} onExit={onExit} showAIAssistant={true}>
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
