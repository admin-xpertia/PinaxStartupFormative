export interface WizardStep {
  numero: number
  label: string
  estado: "activo" | "completado" | "pendiente"
  icono: string
}

export interface ProgramFormData {
  // Paso 1
  nombre_programa: string
  descripcion: string
  categoria: string
  duracion_semanas: number
  numero_fases: number

  // Paso 2
  fases: FaseFormData[]

  // Paso 3
  // proof points están dentro de fases
}

export interface FaseFormData {
  id: string
  nombre_fase: string
  descripcion_fase: string
  objetivos_aprendizaje: string
  duracion_semanas_fase: number
  numero_proof_points: number
  proof_points: ProofPointFormData[]
}

export interface ProofPointFormData {
  id: string
  nombre_pp: string
  slug_pp: string
  descripcion_pp: string
  pregunta_central: string
  tipo_entregable: string
  numero_niveles: number
  prerequisitos: string[]
  duracion_estimada_horas: number
}
