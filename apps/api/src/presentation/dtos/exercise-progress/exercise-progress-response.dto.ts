import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type ExerciseProgressStatus =
  | "not_started"
  | "in_progress"
  | "submitted_for_review"
  | "pending_review"
  | "requires_iteration"
  | "approved"
  | "graded";

export class ExerciseProgressResponseDto {
  @ApiProperty({
    description: "ID del progreso",
    example: "exercise_progress:abc123",
  })
  id: string;

  @ApiProperty({
    description: "ID de la instancia de ejercicio",
    example: "exercise_instance:xyz789",
  })
  exerciseInstance: string;

  @ApiProperty({
    description: "ID del estudiante",
    example: "estudiante:abc123",
  })
  estudiante: string;

  @ApiProperty({
    description: "ID de la cohorte",
    example: "cohorte:xyz789",
  })
  cohorte: string;

  @ApiProperty({
    description: "Estado del ejercicio",
    enum: ["no_iniciado", "en_progreso", "completado", "pendiente_revision"],
    example: "en_progreso",
  })
  estado: string;

  @ApiProperty({
    description: "Nuevo estado extendido del ejercicio",
    enum: [
      "not_started",
      "in_progress",
      "submitted_for_review",
      "pending_review",
      "requires_iteration",
      "approved",
      "graded",
    ],
    example: "in_progress",
  })
  status: ExerciseProgressStatus;

  @ApiProperty({
    description: "Porcentaje de completitud",
    example: 45,
  })
  porcentajeCompletitud: number;

  @ApiPropertyOptional({
    description: "Fecha de inicio",
  })
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: "Fecha de completado",
  })
  fechaCompletado?: string;

  @ApiProperty({
    description: "Tiempo invertido en minutos",
    example: 15,
  })
  tiempoInvertidoMinutos: number;

  @ApiProperty({
    description: "Número de intentos",
    example: 1,
  })
  numeroIntentos: number;

  @ApiPropertyOptional({
    description: "Score final obtenido",
    example: 8.5,
  })
  scoreFinal?: number;

  @ApiPropertyOptional({
    description:
      "Feedback del instructor por pregunta (clave de pregunta -> feedback)",
    example: { q1: "Profundiza en la hipótesis y agrega evidencia" },
  })
  instructorFeedback?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Fecha de la última entrega para revisión",
    example: "2025-01-15T10:30:00Z",
  })
  submittedAt?: string;

  @ApiPropertyOptional({
    description: "Fecha de calificación definitiva",
    example: "2025-01-16T12:00:00Z",
  })
  gradedAt?: string;

  @ApiPropertyOptional({
    description: "Datos guardados del estudiante",
  })
  datosGuardados?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Puntaje generado por IA (0-100)",
    example: 82,
  })
  aiScore?: number | null;

  @ApiPropertyOptional({
    description: "Puntaje asignado por instructor",
    example: 90,
  })
  instructorScore?: number | null;

  @ApiPropertyOptional({
    description: "Resumen de feedback estructurado (IA u otros)",
  })
  feedbackJson?: Record<string, any> | null;

  @ApiPropertyOptional({
    description: "Comentarios manuales del instructor",
  })
  manualFeedback?: string | null;

  @ApiProperty({
    description: "Fecha de creación",
  })
  createdAt: string;

  @ApiProperty({
    description: "Fecha de última actualización",
  })
  updatedAt: string;
}
