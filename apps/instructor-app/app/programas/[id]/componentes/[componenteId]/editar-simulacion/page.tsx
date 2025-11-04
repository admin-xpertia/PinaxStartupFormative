"use client"

import { SimulationEditor } from "@/components/fase3/simulation-editor"
import type { PersonalidadPersonaje } from "@/types/content"

// Mock data
const mockContenido = {
  personaje: {
    nombre: "María González",
    rol: "Directora de Innovación",
    background:
      "15 años de experiencia en transformación digital. Ha liderado proyectos de innovación en empresas Fortune 500.",
    personalidad: "esceptico" as PersonalidadPersonaje,
    estilo_comunicacion: "Directa y orientada a resultados. Hace preguntas difíciles y espera respuestas concretas.",
    avatar_url: "/avatar-woman-1.png",
  },
  escenario_contexto: "Reunión inicial para presentar una propuesta de innovación",
  objetivo_conversacion: "Convencer a María de aprobar el presupuesto para el proyecto",
  banco_respuestas: [
    {
      id: "resp_1",
      contexto_trigger: "Cuando el estudiante presenta la idea inicial",
      respuesta: "Interesante. ¿Pero cómo esto se traduce en ROI concreto para la empresa?",
      tags: ["escepticismo", "roi", "resultados"],
      uso_stats: 12,
    },
    {
      id: "resp_2",
      contexto_trigger: "Cuando menciona innovación sin datos",
      respuesta: "Todos hablan de innovación, pero necesito ver números. ¿Tienes algún caso de éxito similar?",
      tags: ["datos", "validacion", "casos"],
      uso_stats: 8,
    },
    {
      id: "resp_3",
      contexto_trigger: "Cuando el estudiante muestra preparación",
      respuesta: "Veo que has hecho tu tarea. Cuéntame más sobre cómo implementarías esto en nuestro contexto.",
      tags: ["aprobacion", "profundizacion"],
      uso_stats: 15,
    },
  ],
  criterios_evaluacion: [
    {
      id: "crit_1",
      nombre: "Claridad en la Propuesta",
      peso: 8,
      indicadores_positivos: [
        "Explica el problema claramente",
        "Presenta solución concreta",
        "Usa ejemplos relevantes",
      ],
      indicadores_negativos: ["Lenguaje vago o abstracto", "No conecta con el negocio", "Falta de estructura"],
    },
    {
      id: "crit_2",
      nombre: "Manejo de Objeciones",
      peso: 9,
      indicadores_positivos: ["Responde con datos", "Mantiene la calma", "Reformula objeciones positivamente"],
      indicadores_negativos: ["Se pone defensivo", "Evade preguntas difíciles", "No tiene respaldo de datos"],
    },
  ],
}

export default function EditarSimulacionPage({
  params,
}: {
  params: { id: string; componenteId: string }
}) {
  const handleSave = async (contenido: any) => {
    console.log("Guardando simulación:", contenido)
    // Aquí iría la lógica para guardar en el backend
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <SimulationEditor
      programaId={params.id}
      componenteId={params.componenteId}
      componenteNombre="Pitch a Directora de Innovación"
      contenidoInicial={mockContenido}
      onSave={handleSave}
      onClose={() => window.history.back()}
    />
  )
}
