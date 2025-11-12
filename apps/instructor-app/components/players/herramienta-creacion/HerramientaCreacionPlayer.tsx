"use client"

import type { GenericToolPlayerProps } from "../base/GenericToolPlayer"
import { GenericToolPlayer } from "../base/GenericToolPlayer"

type PlayerProps = Omit<GenericToolPlayerProps, "config">

export function HerramientaCreacionPlayer(props: PlayerProps) {
  return (
    <GenericToolPlayer
      {...props}
      config={{
        typeName: "Herramienta de Creación",
        icon: "🎨",
        description: "Co-crea artefactos junto a la IA manteniendo el estilo narrativo y la voz del programa.",
        defaultFocusAreas: ["Brief creativo", "Iteraciones guiadas", "Entrega final"],
        defaultSteps: [
          {
            title: "Definir el brief",
            description: "Aclara audiencia, tono, restricciones y ejemplos de referencia antes de abrir la generación.",
          },
          {
            title: "Co-crear con IA",
            description: "Genera múltiples borradores e integra feedback inmediato del estudiante o instructor.",
          },
          {
            title: "Pulir y publicar",
            description: "Consolida el entregable final y documenta los criterios de calidad alcanzados.",
          },
        ],
        defaultDeliverables: [
          "Brief creativo validado",
          "Borrador iterativo con anotaciones",
          "Versión final lista para publicar",
        ],
        defaultInsights: [
          "Solicita a la IA múltiples voces o estilos para comparar.",
          "Pide una lista de verificación automática antes de publicar.",
        ],
        defaultMetrics: ["Iteraciones realizadas", "Feedback recibido", "Grado de alineación con el brief"],
      }}
    />
  )
}
