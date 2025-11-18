import { useCallback, useMemo, useState } from "react"
import { exercisesApi } from "@/services/api"
import type { SimulationMessage, SimulationScenario } from "./types"

const createMessage = (role: SimulationMessage["role"], content: string): SimulationMessage => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${role}-${Date.now()}-${Math.random()}`,
  role,
  content,
  timestamp: new Date().toISOString(),
})

interface UseSimulationChatParams {
  content: SimulationScenario
  exerciseId: string
}

export function useSimulationChat({ content, exerciseId }: UseSimulationChatParams) {
  const [messages, setMessages] = useState<SimulationMessage[]>([
    createMessage("system", content.situacion_inicial),
  ])
  const [successCriteriaMet, setSuccessCriteriaMet] = useState<Set<number>>(new Set())
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalCriteria = content.criterios_exito.length

  const conversationComplete = useMemo(
    () => (totalCriteria === 0 ? true : successCriteriaMet.size === totalCriteria),
    [successCriteriaMet, totalCriteria]
  )

  const resetConversation = useCallback(() => {
    setMessages([createMessage("system", content.situacion_inicial)])
    setSuccessCriteriaMet(new Set())
    setError(null)
  }, [content.situacion_inicial])

  const toggleSuccessCriteria = useCallback((index: number) => {
    setSuccessCriteriaMet((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }, [])

  const buildScenarioContext = useCallback(() => {
    const persona = content.personaje_ia
    const criteriosLogrados = Array.from(successCriteriaMet)
      .map((idx) => content.criterios_exito[idx])
      .filter(Boolean)
      .join("; ")

    return `Simulación de interacción con acompañamiento IA.
Título: ${content.titulo}
Objetivo del estudiante: ${content.objetivo_estudiante}
Situación inicial: ${content.situacion_inicial}
Personaje IA: ${persona.nombre} (${persona.rol}) con tono ${persona.tono}. Personalidad: ${persona.personalidad}.
Contexto adicional: ${persona.contexto}
Criterios de éxito alcanzados: ${criteriosLogrados || "ninguno todavía"}.`
  }, [content, successCriteriaMet])

  const historyPayload = useCallback(
    (nextMessage?: SimulationMessage) => {
      const base = nextMessage ? [...messages, nextMessage] : messages
      return base
        .filter((msg) => msg.role !== "system")
        .slice(-10)
        .map((msg) => ({
          role: msg.role === "system" ? "assistant" : msg.role, // backend no admite role system
          content: msg.content,
        }))
    },
    [messages]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isThinking) return

      const userMessage = createMessage("user", trimmed)
      setMessages((prev) => [...prev, userMessage])
      setIsThinking(true)
      setError(null)

      try {
        // Transform criterios_exito to the format expected by Shadow Monitor
        const criteriosExito = content.criterios_exito?.map((criterio, idx) => {
          // Handle both old format (string) and new format (object with rubrica)
          if (typeof criterio === "string") {
            return {
              id: `criterio_${idx}`,
              descripcion: criterio,
              rubrica_evaluacion: undefined,
            }
          }
          return {
            id: criterio.id || `criterio_${idx}`,
            descripcion: criterio.descripcion || "",
            rubrica_evaluacion: criterio.rubrica_evaluacion,
          }
        }) || []

        // Build list of already met criteria IDs
        const criteriosCumplidos = Array.from(successCriteriaMet).map(idx =>
          criteriosExito[idx]?.id || `criterio_${idx}`
        )

        const response = await exercisesApi.sendLessonAssistantMessage(exerciseId, {
          pregunta: trimmed,
          seccionId: "simulacion_interaccion",
          seccionTitulo: content.titulo,
          seccionContenido: buildScenarioContext(),
          historial: historyPayload(userMessage),
          conceptoFocal: content.objetivo_estudiante,
          perfilComprension: {
            tipo: "simulacion_interaccion",
            criteriosMarcados: criteriosCumplidos,
            dificultad: content.nivel_dificultad,
          },
          // Shadow Monitor parameters
          criteriosExito,
          criteriosCumplidos,
          shadowMonitorConfig: {
            activado: true,
            frecuencia_turnos: 2,
          },
        })

        const assistantReply =
          response.respuesta?.trim() ||
          "No pude procesar tu mensaje en este momento. Intenta nuevamente."
        const assistantMessage = createMessage("assistant", assistantReply)
        setMessages((prev) => [...prev, assistantMessage])

        // Process Shadow Monitor results (auto-mark criteria as met)
        if (response.shadowMonitorResult?.metCriteriaIds) {
          const newlyMetCriteriaIds = response.shadowMonitorResult.metCriteriaIds

          // Convert criteria IDs back to indices
          newlyMetCriteriaIds.forEach((criterioId) => {
            const criterioIndex = criteriosExito.findIndex(c => c.id === criterioId)
            if (criterioIndex !== -1 && !successCriteriaMet.has(criterioIndex)) {
              console.log(`✅ Shadow Monitor: Criterio "${criteriosExito[criterioIndex].descripcion}" cumplido automáticamente`)
              setSuccessCriteriaMet((prev) => new Set([...prev, criterioIndex]))
            }
          })
        }
      } catch (err) {
        console.error("Simulation chat error:", err)
        setError("No pudimos obtener respuesta del asistente.")
        const fallback = createMessage(
          "assistant",
          "No pude responder ahora. Inténtalo de nuevo en un momento."
        )
        setMessages((prev) => [...prev, fallback])
      } finally {
        setIsThinking(false)
      }
    },
    [
      buildScenarioContext,
      content.criterios_exito,
      content.nivel_dificultad,
      content.objetivo_estudiante,
      content.titulo,
      exerciseId,
      historyPayload,
      isThinking,
      successCriteriaMet,
    ]
  )

  return {
    messages,
    successCriteriaMet,
    isThinking,
    error,
    conversationComplete,
    toggleSuccessCriteria,
    resetConversation,
    sendMessage,
  }
}
