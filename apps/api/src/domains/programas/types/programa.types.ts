/**
 * Tipos relacionados con el dominio de Programas
 */

export interface ProgramaCreado {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  duracion_semanas: number;
  numero_fases: number;
  creador: string;
  created_at: string;
}

export interface Programa extends ProgramaCreado {
  fases?: Fase[];
}

export interface Fase {
  id: string;
  nombre: string;
  descripcion: string;
  objetivos_aprendizaje: string;
  duracion_semanas: number;
  numero_proof_points: number;
  programa: string;
  created_at: string;
  proof_points?: ProofPoint[];
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
  fase: string;
  created_at: string;
  niveles?: Nivel[];
}

export interface Nivel {
  id: string;
  numero: number;
  nombre: string;
  objetivo_especifico: string;
  proof_point: string;
  created_at: string;
  componentes?: Componente[];
}

export interface Componente {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
  nivel: string;
  created_at: string;
}
