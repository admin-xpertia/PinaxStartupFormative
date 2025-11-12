"use client"

import type { GenericToolPlayerProps } from "../base/GenericToolPlayer"
import { GenericToolPlayer } from "../base/GenericToolPlayer"

type PlayerProps = Omit<GenericToolPlayerProps, "config">

export function HerramientaRevisionPlayer(props: PlayerProps) {
  return (
    <GenericToolPlayer
      {...props}
      config={{
        typeName: "Herramienta de Revisión",
        icon: "✅",
        description: "Guía procesos de revisión profunda con checklist, feedback puntual y plan de mejora.",
        defaultFocusAreas: ["Checklist de calidad", "Feedback detallado", "Plan iterativo"],
        defaultSteps: [
          {
            title: "Diagnóstico global",
            description: "Evalúa el entregable contra la rúbrica y detecta brechas críticas.",
          },
          {
            title: "Feedback puntual",
            description: "Entrega observaciones con ejemplos, preguntas socráticas o referencias visuales.",
          },
          {
            title: "Plan de mejora",
            description: "Define próximos pasos, responsables y materiales de apoyo sugeridos por IA.",
          },
        ],
        defaultDeliverables: [
          "Checklist resuelto con observaciones",
          "Notas de retroalimentación por criterio",
          "Plan de mejora con responsables y fechas",
        ],
        defaultInsights: [
          "Solicita a la IA ejemplos del estándar deseado.",
          "Pide reformular feedback en tono empático o directo según el contexto.",
        ],
        defaultMetrics: ["Criterios con hallazgos", "Iteraciones restantes", "Tiempo estimado de mejora"],
      }}
    />
  )
}
