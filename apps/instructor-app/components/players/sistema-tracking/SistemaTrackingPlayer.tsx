"use client"

import type { GenericToolPlayerProps } from "../base/GenericToolPlayer"
import { GenericToolPlayer } from "../base/GenericToolPlayer"

type PlayerProps = Omit<GenericToolPlayerProps, "config">

export function SistemaTrackingPlayer(props: PlayerProps) {
  return (
    <GenericToolPlayer
      {...props}
      config={{
        typeName: "Sistema de Tracking",
        icon: "📊",
        description: "Monitorea hábitos, evidencias y señales de riesgo para acompañar el avance del estudiante.",
        defaultFocusAreas: ["Métricas leading", "Evidencias de progreso", "Alertas tempranas"],
        defaultSteps: [
          {
            title: "Configurar métricas",
            description: "Define indicadores cuantitativos y cualitativos junto con sus umbrales de alerta.",
          },
          {
            title: "Registrar avances",
            description: "Documenta hitos, hábitos y bloqueos con soporte de IA para detectar patrones.",
          },
          {
            title: "Retroalimentación y next steps",
            description: "Genera recomendaciones automáticas cuando se detecte riesgo o una oportunidad de intervención.",
          },
        ],
        defaultDeliverables: [
          "Registro semanal de avances",
          "Alertas generadas por la IA",
          "Recomendaciones accionables para el instructor",
        ],
        defaultInsights: [
          "Pide a la IA que agrupe hallazgos por nivel de riesgo.",
          "Solicita correlaciones entre hábitos y resultados.",
        ],
        defaultMetrics: ["Hábitos completados", "Alertas disparadas", "Recomendaciones aplicadas"],
      }}
    />
  )
}
