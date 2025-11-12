"use client"

import type { GenericToolPlayerProps } from "../base/GenericToolPlayer"
import { GenericToolPlayer } from "../base/GenericToolPlayer"

type PlayerProps = Omit<GenericToolPlayerProps, "config">

export function HerramientaAnalisisPlayer(props: PlayerProps) {
  return (
    <GenericToolPlayer
      {...props}
      config={{
        typeName: "Herramienta de Análisis",
        icon: "🔍",
        description: "Profundiza en entregables complejos para detectar riesgos, brechas y oportunidades accionables.",
        defaultFocusAreas: ["Contexto", "Criterios de evaluación", "Hallazgos críticos"],
        defaultSteps: [
          {
            title: "Diagnóstico inicial",
            description: "Explora el entregable y resume el problema o hipótesis principal antes de aplicar criterios.",
          },
          {
            title: "Aplicar criterios de calidad",
            description: "Evalúa cada criterio usando evidencias concretas y clasifica el nivel de cumplimiento.",
          },
          {
            title: "Mapa de hallazgos",
            description: "Sintetiza patrones, riesgos y recomendaciones ordenadas por impacto e inversión requerida.",
          },
        ],
        defaultDeliverables: [
          "Resumen ejecutivo con los hallazgos principales",
          "Tabla de riesgos priorizados por impacto",
          "Recomendaciones accionables para el instructor",
        ],
        defaultInsights: [
          "Pide a la IA que contraste con estándares o rúbricas institucionales.",
          "Solicita ejemplos de buenas prácticas para cada criterio observado como débil.",
        ],
        defaultMetrics: ["Criterios evaluados", "Nivel de riesgo por criterio", "Número de recomendaciones"],
      }}
    />
  )
}
