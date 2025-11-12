"use client"

import type { GenericToolPlayerProps } from "../base/GenericToolPlayer"
import { GenericToolPlayer } from "../base/GenericToolPlayer"

type PlayerProps = Omit<GenericToolPlayerProps, "config">

export function SistemaProgresionPlayer(props: PlayerProps) {
  return (
    <GenericToolPlayer
      {...props}
      config={{
        typeName: "Sistema de Progresión",
        icon: "🎯",
        description: "Orquesta hitos, desbloqueables y reconocimientos para sostener el avance del estudiante.",
        defaultFocusAreas: ["Competencias clave", "Hitos de validación", "Recompensas"],
        defaultSteps: [
          {
            title: "Diseñar niveles",
            description: "Define criterios de avance, evidencias mínimas y beneficios por cada hito.",
          },
          {
            title: "Evaluar evidencia",
            description: "Valida entregables con ayuda de la IA y documenta observaciones por competencia.",
          },
          {
            title: "Desbloquear siguiente reto",
            description: "Entrega feedback, reconocimientos y nuevos desafíos personalizados.",
          },
        ],
        defaultDeliverables: [
          "Mapa de progreso actualizado",
          "Reporte de competencias dominadas",
          "Plan de próximos retos asignados",
        ],
        defaultInsights: [
          "Pide a la IA detectar patrones de avance y riesgos de abandono.",
          "Solicita mensajes de reconocimiento con el tono del programa.",
        ],
        defaultMetrics: ["Hitos completados", "Competencias dominadas", "Recompensas entregadas"],
      }}
    />
  )
}
