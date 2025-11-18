export interface SimulationScenario {
  titulo: string
  descripcion: string
  personaje_ia: {
    nombre: string
    rol: string
    personalidad: string
    tono: string
    contexto: string
  }
  objetivo_estudiante: string
  situacion_inicial: string
  criterios_exito: SimulationSuccessCriterion[]
  nivel_dificultad: "principiante" | "intermedio" | "avanzado"
  tiempo_sugerido?: number
}

export type SimulationMessageRole = "user" | "assistant" | "system"

export interface SimulationMessage {
  id: string
  role: SimulationMessageRole
  content: string
  timestamp: string
}

export type SimulationSuccessCriterion =
  | string
  | {
      id?: string
      descripcion?: string
      rubrica_evaluacion?: string
    }
