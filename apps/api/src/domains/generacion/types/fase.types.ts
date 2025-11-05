export interface FaseDocumentation {
  fase_id: string
  contexto: string
  conceptos_clave: ConceptoClave[]
  casos_estudio: CasoEstudio[]
  errores_comunes: ErrorComun[]
  recursos_referencia: RecursoReferencia[]
  criterios_evaluacion: CriterioEvaluacion[]
  completitud: number
}

export interface ConceptoClave {
  id: string
  nombre: string
  definicion: string
  ejemplo: string
  terminos_relacionados: string[]
}

export interface CasoEstudio {
  id: string
  titulo: string
  tipo: "exito" | "fracaso" | "comparacion"
  descripcion: string
  fuente: string
  conceptos_ilustrados: string[]
}

export interface ErrorComun {
  id: string
  titulo: string
  explicacion: string
  como_evitar: string
}

export interface RecursoReferencia {
  id: string
  titulo: string
  tipo: "paper" | "libro" | "video" | "herramienta" | "podcast" | "otro"
  url: string
  notas: string
}

export interface CriterioEvaluacion {
  id: string
  nombre: string
  descriptor: string
  nivel_importancia: "critico" | "importante" | "deseable"
}
