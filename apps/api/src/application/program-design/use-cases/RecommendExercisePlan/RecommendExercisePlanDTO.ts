/**
 * DTO for RecommendExercisePlan use case
 */

export interface ProofPointContext {
  concepcionesErroneas: string;
  barrerasConceptuales: string;
}

export interface RecommendExercisePlanCommand {
  programId: string;
  proofPointContexts: Record<string, ProofPointContext>;
}

export interface ExerciseRecommendation {
  proofPointId: string;
  templateId: string;
  nombre: string;
  descripcionBreve?: string;
  consideracionesContexto: string;
  configuracionPersonalizada: Record<string, any>;
  duracionEstimadaMinutos: number;
  esObligatorio: boolean;
  // UI metadata
  _templateNombre: string;
  _fasePatron: string;
  _proposito: string;
}

export interface RecommendExercisePlanResponse {
  recommendations: ExerciseRecommendation[];
}
