/**
 * CreateProgramDTO
 * Data Transfer Object for creating a new program
 */
export interface CreateProgramDTO {
  nombre: string;
  descripcion: string;
  duracionSemanas: number;
  creadorId: string;
  categoria?: string;
  nivelDificultad?: 'principiante' | 'intermedio' | 'avanzado';
  imagenPortadaUrl?: string;
  objetivosAprendizaje?: string[];
  prerequisitos?: string[];
  audienciaObjetivo?: string;
  tags?: string[];
}
