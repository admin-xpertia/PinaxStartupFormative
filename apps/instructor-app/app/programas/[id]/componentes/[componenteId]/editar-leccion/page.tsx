"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { LessonEditor } from "@/components/fase3/lesson-editor"

export default function EditarLeccionPage({
  params,
}: {
  params: Promise<{ id: string; componenteId: string }>
}) {
  const { id, componenteId } = use(params)
  const router = useRouter()

  // Mock data
  const contenidoInicial = {
    markdown: `# Introducción al Customer-Solution Fit

El **Customer-Solution Fit (CSF)** es el primer hito crítico en el proceso de validación de una startup. Representa el momento en que has identificado un problema real que afecta a un segmento específico de clientes y has diseñado una solución que estos clientes consideran valiosa.

## ¿Qué es el CSF?

El CSF representa el momento en que logras tres cosas fundamentales:

1. **Identificación clara del problema**: Entiendes profundamente el dolor o necesidad de tus clientes potenciales
2. **Segmento definido**: Sabes exactamente quién experimenta este problema
3. **Solución validada**: Has confirmado que tu propuesta de solución resuena con este segmento

> **Tip**: No confundas el CSF con el Product-Market Fit. El CSF es anterior y se enfoca en validar el problema y la solución conceptual, no el producto completo.

## Ejemplo: Airbnb

En 2008, Airbnb validó su CSF cuando descubrieron que:

- **Problema**: Viajeros buscaban opciones de alojamiento más auténticas y económicas que los hoteles
- **Segmento**: Viajeros jóvenes, aventureros, con presupuesto limitado
- **Solución**: Plataforma para rentar habitaciones en casas de locales

Este CSF les permitió iterar hacia el producto que conocemos hoy.

## Cómo validar tu CSF

Para validar tu CSF necesitas:

1. Realizar entrevistas de descubrimiento con clientes potenciales
2. Presentar tu solución conceptual (puede ser un mockup, prototipo o incluso una descripción)
3. Medir el nivel de interés genuino (no solo cortesía)
4. Iterar basándote en el feedback recibido`,
    metadata: {
      duracion_lectura_minutos: 5,
      palabras: 250,
      secciones: 4,
      nivel_lecturabilidad: 68,
    },
  }

  const handleSave = async (contenido: any) => {
    console.log("[v0] Guardando contenido:", contenido)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <LessonEditor
      programaId={id}
      componenteId={componenteId}
      componenteNombre="Introducción al Customer-Solution Fit"
      contenidoInicial={contenidoInicial}
      onSave={handleSave}
      onClose={handleClose}
    />
  )
}
