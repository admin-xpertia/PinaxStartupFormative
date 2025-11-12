"use client"

import type { GenericToolPlayerProps } from "../base/GenericToolPlayer"
import { GenericToolPlayer } from "../base/GenericToolPlayer"

type PlayerProps = Omit<GenericToolPlayerProps, "config">

export function SimuladorEntornoPlayer(props: PlayerProps) {
  return (
    <GenericToolPlayer
      {...props}
      config={{
        typeName: "Simulador de Entorno",
        icon: "🌐",
        description: "Recrea escenarios complejos para practicar decisiones y anticipar consecuencias.",
        defaultFocusAreas: ["Contexto del escenario", "Variables dinámicas", "Evaluación de decisiones"],
        defaultSteps: [
          {
            title: "Configurar el escenario",
            description: "Define personajes, restricciones y eventos que la IA debe simular.",
          },
          {
            title: "Jugar rondas",
            description: "Explora decisiones, solicita reacciones alternativas y documenta aprendizajes.",
          },
          {
            title: "Cierre y transferencia",
            description: "Resume las estrategias ganadoras y transfiere aprendizajes a la situación real.",
          },
        ],
        defaultDeliverables: [
          "Bitácora de decisiones y consecuencias",
          "Mapa de riesgos identificados",
          "Plan de acción posterior a la simulación",
        ],
        defaultInsights: [
          "Pide a la IA aumentar o disminuir la dificultad del entorno.",
          "Solicita perspectivas de distintos actores para enriquecer la discusión.",
        ],
        defaultMetrics: ["Escenarios completados", "Decisiones evaluadas", "Riesgos mitigados"],
      }}
    />
  )
}
