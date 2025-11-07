"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"

// Import all player components
import {
  LeccionInteractivaPlayer,
  CuadernoTrabajoPlayer,
  SimulacionInteraccionPlayer,
  MentorIAPlayer,
} from "@/components/players"

// Mock exercise data structure
// TODO: Replace with real API call
const mockExercises: Record<string, any> = {
  ex_123: {
    id: "ex_123",
    nombre: "Análisis de Estilos de Liderazgo",
    tipo: "cuaderno_trabajo",
    proofPointNombre: "Adaptación Contextual",
    contenido: {
      titulo: "Análisis de Estilos de Liderazgo",
      objetivo: "Identificar y analizar diferentes estilos de liderazgo y su aplicabilidad contextual",
      contexto: "Como líder, es fundamental comprender que no existe un único estilo de liderazgo que funcione en todas las situaciones. Este ejercicio te ayudará a reflexionar sobre diferentes enfoques y cuándo aplicarlos.",
      secciones: [
        {
          titulo: "Autoconocimiento",
          descripcion: "Reflexiona sobre tu estilo natural de liderazgo",
          instrucciones: "Responde con honestidad y profundidad las siguientes preguntas. No hay respuestas correctas o incorrectas.",
          prompts: [
            {
              tipo: "texto_largo",
              pregunta: "¿Cómo describirías tu estilo natural de liderazgo?",
              guia: "Considera situaciones recientes donde hayas liderado un equipo o proyecto",
              min_palabras: 100,
              placeholder: "Reflexiona sobre tus fortalezas, áreas de oportunidad, y cómo te perciben tus colaboradores..."
            },
            {
              tipo: "lista",
              pregunta: "Enumera 5 características que definen tu liderazgo",
              guia: "Piensa en adjetivos que te describan como líder"
            }
          ]
        },
        {
          titulo: "Análisis Situacional",
          descripcion: "Analiza diferentes contextos de liderazgo",
          instrucciones: "Completa la siguiente tabla con ejemplos de tu experiencia",
          prompts: [
            {
              tipo: "tabla",
              pregunta: "Situaciones de liderazgo y tu enfoque",
              guia: "Columna 1: Describe la situación | Columna 2: Estilo de liderazgo aplicado"
            }
          ]
        }
      ],
      criterios_evaluacion: [
        "Profundidad de la reflexión personal",
        "Claridad en la identificación de estilos",
        "Análisis contextual fundamentado",
        "Aplicación práctica a situaciones reales"
      ],
      tiempo_sugerido: 45
    }
  },
  ex_456: {
    id: "ex_456",
    nombre: "Simulación: Conversación Difícil",
    tipo: "simulacion_interaccion",
    proofPointNombre: "Comunicación Efectiva",
    contenido: {
      titulo: "Simulación: Conversación Difícil con un Colaborador",
      descripcion: "Practica cómo manejar una conversación difícil con un colaborador de bajo rendimiento",
      personaje_ia: {
        nombre: "Alex Rivera",
        rol: "Colaborador Senior con bajo rendimiento reciente",
        personalidad: "Defensivo pero profesional, lleva 3 años en la empresa",
        tono: "Inicialmente a la defensiva, pero abierto si se aborda correctamente",
        contexto: "Ha tenido bajo rendimiento en los últimos 2 meses. Antes era uno de los mejores del equipo."
      },
      objetivo_estudiante: "Conducir una conversación productiva que identifique las causas del bajo rendimiento y establezca un plan de acción",
      situacion_inicial: "Alex entra a la reunión que agendaste. Se sienta y te mira expectante. Parece un poco tenso.",
      criterios_exito: [
        "Demostrar empatía y escucha activa",
        "Hacer preguntas abiertas para entender la situación",
        "Llegar a un acuerdo sobre próximos pasos concretos",
        "Mantener un tono profesional y constructivo"
      ],
      nivel_dificultad: "intermedio",
      tiempo_sugerido: 20
    }
  },
  ex_789: {
    id: "ex_789",
    nombre: "Fundamentos del Emprendimiento",
    tipo: "leccion_interactiva",
    proofPointNombre: "Mindset Emprendedor",
    contenido: {
      titulo: "Fundamentos del Mindset Emprendedor",
      objetivos: [
        "Comprender las características del pensamiento emprendedor",
        "Identificar oportunidades en problemas cotidianos",
        "Desarrollar una mentalidad de crecimiento"
      ],
      secciones: [
        {
          tipo: "texto",
          titulo: "¿Qué es el Mindset Emprendedor?",
          contenido: "El mindset emprendedor es una forma de pensar que te permite ver oportunidades donde otros ven problemas. No se trata solo de crear empresas, sino de desarrollar una mentalidad que te permita innovar, tomar riesgos calculados y crear valor en cualquier contexto."
        },
        {
          tipo: "lista",
          titulo: "Características Clave",
          items: [
            "Visión de oportunidades en lugar de obstáculos",
            "Tolerancia al fracaso y capacidad de aprendizaje",
            "Orientación a la acción y experimentación",
            "Pensamiento creativo y resolución de problemas",
            "Resiliencia y adaptabilidad"
          ]
        },
        {
          tipo: "concepto_clave",
          contenido: "El fracaso no es lo opuesto al éxito, es parte del camino hacia él. Los emprendedores exitosos ven cada fracaso como una oportunidad de aprendizaje."
        }
      ],
      conceptos_clave: [
        "Mindset de crecimiento",
        "Oportunidades vs Problemas",
        "Experimentación rápida",
        "Aprendizaje del fracaso"
      ],
      quiz: [
        {
          pregunta: "¿Cuál de las siguientes NO es una característica del mindset emprendedor?",
          tipo: "multiple_choice",
          opciones: [
            "Evitar el riesgo a toda costa",
            "Ver oportunidades en problemas",
            "Aprender del fracaso",
            "Tomar acción rápidamente"
          ],
          respuesta_correcta: "Evitar el riesgo a toda costa",
          explicacion: "El mindset emprendedor implica tomar riesgos calculados, no evitarlos completamente."
        },
        {
          pregunta: "El fracaso debe verse como:",
          tipo: "multiple_choice",
          opciones: [
            "Un indicador de que debes rendirte",
            "Una oportunidad de aprendizaje",
            "Algo que debe evitarse siempre",
            "Una señal de falta de talento"
          ],
          respuesta_correcta: "Una oportunidad de aprendizaje",
          explicacion: "Los emprendedores exitosos ven el fracaso como parte del proceso de aprendizaje y mejora continua."
        }
      ]
    }
  }
}

interface ExercisePageProps {
  params: Promise<{ exerciseId: string }>
}

export default function ExercisePage({ params }: ExercisePageProps) {
  const { exerciseId } = use(params)
  const router = useRouter()

  // TODO: Replace with real API call
  // const { data: exercise, error, isLoading } = useSWR(
  //   `/api/v1/exercise-instances/${exerciseId}`,
  //   fetcher
  // )

  // Mock data for now
  const exercise = mockExercises[exerciseId]
  const isLoading = false
  const error = !exercise ? new Error("Exercise not found") : null

  const handleSave = async (data: any) => {
    console.log("[Exercise] Saving progress:", data)
    // TODO: Call API to save progress
    return Promise.resolve()
  }

  const handleComplete = async (data: any) => {
    console.log("[Exercise] Completing exercise:", data)
    // TODO: Call API to mark as complete and save final data
    // Then navigate back to courses
    router.push("/student/courses")
  }

  const handleExit = () => {
    if (confirm("¿Estás seguro de que quieres salir? Tu progreso se guardará.")) {
      router.push("/student/courses")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState text="Cargando ejercicio..." />
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="Ejercicio no encontrado"
          message="No pudimos encontrar el ejercicio solicitado"
        />
      </div>
    )
  }

  // Render the appropriate player based on exercise type
  switch (exercise.tipo) {
    case "leccion_interactiva":
      return (
        <LeccionInteractivaPlayer
          exerciseId={exercise.id}
          exerciseName={exercise.nombre}
          proofPointName={exercise.proofPointNombre}
          content={exercise.contenido}
          onSave={handleSave}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      )

    case "cuaderno_trabajo":
      return (
        <CuadernoTrabajoPlayer
          exerciseId={exercise.id}
          exerciseName={exercise.nombre}
          proofPointName={exercise.proofPointNombre}
          content={exercise.contenido}
          onSave={handleSave}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      )

    case "simulacion_interaccion":
      return (
        <SimulacionInteraccionPlayer
          exerciseId={exercise.id}
          exerciseName={exercise.nombre}
          proofPointName={exercise.proofPointNombre}
          content={exercise.contenido}
          onSave={handleSave}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      )

    case "mentor_ia":
      return (
        <MentorIAPlayer
          exerciseId={exercise.id}
          exerciseName={exercise.nombre}
          proofPointName={exercise.proofPointNombre}
          content={exercise.contenido}
          onSave={handleSave}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      )

    // TODO: Add cases for remaining 6 player types
    case "herramienta_analisis":
    case "herramienta_creacion":
    case "sistema_tracking":
    case "herramienta_revision":
    case "simulador_entorno":
    case "sistema_progresion":
      return (
        <div className="flex h-screen items-center justify-center">
          <ErrorState
            title="Player no implementado"
            message={`El player para ${exercise.tipo} está en desarrollo`}
          />
        </div>
      )

    default:
      return (
        <div className="flex h-screen items-center justify-center">
          <ErrorState
            title="Tipo de ejercicio desconocido"
            message={`No se reconoce el tipo: ${exercise.tipo}`}
          />
        </div>
      )
  }
}
