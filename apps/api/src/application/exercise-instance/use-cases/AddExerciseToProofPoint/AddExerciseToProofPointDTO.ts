/**
 * AddExerciseToProofPointDTO
 * Data Transfer Object for adding an exercise to a proof point
 */
export interface AddExerciseToProofPointDTO {
  templateId: string;
  proofPointId: string;
  nombre?: string; // Optional, defaults to template name
  duracionMinutos?: number; // Optional, defaults to 20
  consideraciones?: string; // Instructor's context considerations
  configuracion?: Record<string, any>; // Custom configuration
}
