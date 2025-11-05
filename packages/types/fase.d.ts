export interface Fase {
    id: string;
    numero: number;
    nombre: string;
    descripcion: string;
    objetivos_aprendizaje: string[];
    duracion_semanas: number;
    numero_proof_points: number;
    documentacion_completa: boolean;
    proof_points: ProofPoint[];
}
export interface FaseDocumentation {
    fase_id: string;
    contexto: string;
    conceptos_clave: ConceptoClave[];
    casos_estudio: CasoEstudio[];
    errores_comunes: ErrorComun[];
    recursos_referencia: RecursoReferencia[];
    criterios_evaluacion: CriterioEvaluacion[];
    completitud: number;
}
export interface ConceptoClave {
    id: string;
    nombre: string;
    definicion: string;
    ejemplo: string;
    terminos_relacionados: string[];
}
export interface CasoEstudio {
    id: string;
    titulo: string;
    tipo: "exito" | "fracaso" | "comparacion";
    descripcion: string;
    fuente: string;
    conceptos_ilustrados: string[];
}
export interface ErrorComun {
    id: string;
    titulo: string;
    explicacion: string;
    como_evitar: string;
}
export interface RecursoReferencia {
    id: string;
    titulo: string;
    tipo: "paper" | "libro" | "video" | "herramienta" | "podcast" | "otro";
    url: string;
    notas: string;
}
export interface CriterioEvaluacion {
    id: string;
    nombre: string;
    descriptor: string;
    nivel_importancia: "critico" | "importante" | "deseable";
}
export interface ProofPoint {
    id: string;
    nombre: string;
    slug: string;
    descripcion: string;
    pregunta_central: string;
    tipo_entregable: string;
    numero_niveles: number;
    prerequisitos: string[];
    duracion_estimada_horas: number;
    niveles: Nivel[];
}
export interface Nivel {
    id: string;
    numero: number;
    nombre: string;
    objetivo_especifico: string;
    componentes: ComponenteAprendizaje[];
    criterio_completacion: CriterioCompletacion;
}
export interface ComponenteAprendizaje {
    id: string;
    tipo: "leccion" | "cuaderno" | "simulacion" | "herramienta";
    nombre: string;
    descripcion: string;
    duracion_minutos: number;
    es_evaluable: boolean;
    contenido_listo: boolean;
}
export interface CriterioCompletacion {
    tipo: "simple" | "custom";
    condiciones?: string[];
}
export type TipoComponente = ComponenteAprendizaje["tipo"];
