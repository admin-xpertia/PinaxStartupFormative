"use client"

import { use } from "react"
import { NotebookEditor } from "@/components/fase3/notebook-editor"
import type { CuadernoContent } from "@/types/content"

// Mock data
const mockCuadernoContent: CuadernoContent & {
  instrucciones: string
  dimensiones_evaluar: string[]
  peso_criticas: number
  umbral_aprobacion: number
} = {
  instrucciones:
    "Este cuaderno te guiará en el proceso de validar tu idea de negocio mediante el Customer Success Factor (CSF). Responde cada pregunta con honestidad y profundidad, usando ejemplos concretos de tu proyecto.",
  secciones: [
    {
      id: "seccion-1",
      numero: 1,
      titulo: "Identificación del CSF",
      instrucciones: "En esta sección identificarás el factor crítico de éxito de tu cliente ideal.",
      preguntas: [
        {
          id: "p1",
          pregunta: "¿Cuál es el objetivo principal que tu cliente ideal está tratando de lograr?",
          tipo: "reflexion",
          es_critica: true,
          prompt_respuesta: "Piensa en términos de resultados medibles y específicos",
          ejemplo_respuesta_fuerte:
            "Mi cliente ideal (gerentes de marketing en startups B2B) busca generar leads calificados de forma predecible y escalable, con un objetivo de 50+ leads mensuales con tasa de conversión >15%.",
        },
        {
          id: "p2",
          pregunta: "¿Qué obstáculos actuales le impiden lograr ese objetivo?",
          tipo: "analisis",
          es_critica: true,
        },
      ],
    },
    {
      id: "seccion-2",
      numero: 2,
      titulo: "Validación del CSF",
      instrucciones: "Ahora validaremos si tu CSF es realmente crítico para tu cliente.",
      preguntas: [
        {
          id: "p3",
          pregunta: "¿Cómo sabes que este factor es realmente crítico para tu cliente?",
          tipo: "aplicacion",
          es_critica: false,
        },
      ],
    },
  ],
  dimensiones_evaluar: ["Profundidad de reflexión", "Uso de evidencia", "Claridad de expresión"],
  peso_criticas: 1.5,
  umbral_aprobacion: 7,
}

export default function EditarCuadernoPage({
  params,
}: {
  params: Promise<{ id: string; componenteId: string }>
}) {
  const { id: programaId, componenteId } = use(params)

  const handleSave = async (contenido: any) => {
    console.log("[v0] Guardando cuaderno:", contenido)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleClose = () => {
    window.history.back()
  }

  return (
    <NotebookEditor
      programaId={programaId}
      componenteId={componenteId}
      componenteNombre="Cuaderno de Validación CSF"
      contenidoInicial={mockCuadernoContent}
      onSave={handleSave}
      onClose={handleClose}
    />
  )
}
