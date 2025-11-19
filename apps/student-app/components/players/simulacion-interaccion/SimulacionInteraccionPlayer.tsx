"use client"

import { useMemo, useState } from "react"
import { ExercisePlayer } from "../base/ExercisePlayer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { ScenarioSummary } from "./components/ScenarioSummary"
import { SuccessCriteriaCard } from "./components/SuccessCriteriaCard"
import { ConversationPanel } from "./components/ConversationPanel"
import { useSimulationChat } from "./useSimulationChat"
import type { SimulationScenario } from "./types"

interface SimulacionInteraccionPlayerProps {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  content: SimulationScenario
  savedData?: any
  onSave: (data: any) => Promise<void>
  onComplete: (data: any) => Promise<void>
  onExit: () => void
}

export function SimulacionInteraccionPlayer({
  exerciseId,
  exerciseName,
  proofPointName,
  content,
  savedData,
  onSave,
  onComplete,
  onExit,
}: SimulacionInteraccionPlayerProps) {
  const [showObjectives, setShowObjectives] = useState(true)
  const initialState = useMemo(() => {
    if (!savedData || typeof savedData !== "object") return undefined
    const savedMessages = Array.isArray(savedData.messages) ? savedData.messages : undefined
    const savedCriteria = Array.isArray(savedData.successCriteriaMet)
      ? (savedData.successCriteriaMet as Array<number | string>).map((value) => Number(value)).filter((value) => !Number.isNaN(value))
      : undefined

    return {
      messages: savedMessages,
      successCriteriaMet: savedCriteria,
    }
  }, [savedData])
  const {
    messages,
    successCriteriaMet,
    isThinking,
    error,
    conversationComplete,
    toggleSuccessCriteria,
    resetConversation,
    sendMessage,
  } = useSimulationChat({ content, exerciseId, initialState })

  const handleSaveWithData = async () => {
    await onSave({
      messages,
      successCriteriaMet: Array.from(successCriteriaMet),
      conversationComplete,
    })
  }

  const handleCompleteWithData = async () => {
    await onComplete({
      messages,
      successCriteriaMet: Array.from(successCriteriaMet),
      conversationComplete,
    })
  }

  return (
    <ExercisePlayer
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      exerciseDescription={content.descripcion}
      proofPointName={proofPointName}
      totalSteps={1}
      currentStep={1}
      estimatedMinutes={content.tiempo_sugerido}
      onSave={handleSaveWithData}
      onComplete={conversationComplete ? handleCompleteWithData : undefined}
      onExit={onExit}
      showAIAssistant={false} // Simulation IS the AI interaction
    >
      <div className="space-y-6">
        <ScenarioSummary content={content} />

        {showObjectives ? (
          <SuccessCriteriaCard
            criterios={content.criterios_exito}
            met={successCriteriaMet}
            onToggle={toggleSuccessCriteria}
            onHide={() => setShowObjectives(false)}
          />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowObjectives(true)}>
            Mostrar criterios de éxito
          </Button>
        )}

        <ConversationPanel
          messages={messages}
          personaName={content.personaje_ia.nombre}
          isThinking={isThinking}
          disabled={conversationComplete}
          error={error}
          onSend={sendMessage}
          onReset={resetConversation}
        />

        {conversationComplete && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600" />
                <div>
                  <h4 className="mb-1 font-semibold text-green-900">
                    ¡Simulación Completada!
                  </h4>
                  <p className="text-sm text-green-800">
                    Has cumplido todos los criterios de éxito. Puedes continuar la conversación
                    o completar el ejercicio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ExercisePlayer>
  )
}
