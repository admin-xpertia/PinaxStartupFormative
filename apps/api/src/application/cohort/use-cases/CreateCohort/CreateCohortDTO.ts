export interface CreateCohortDTO {
  programaId: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFinEstimada?: string;
  configuracion?: Record<string, any>;
  instructorId?: string;
  capacidadMaxima?: number;
  autoActivate?: boolean;
}
