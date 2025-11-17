import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type ExerciseProgressStatus =
  | "not_started"
  | "in_progress"
  | "submitted_for_review"
  | "requires_iteration"
  | "approved";

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
      "requires_iteration",
      "approved",
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
    description: "Datos guardados del estudiante",
  })
  datosGuardados?: Record<string, any>;

  @ApiProperty({
    description: "Fecha de creación",
  })
  createdAt: string;

  @ApiProperty({
    description: "Fecha de última actualización",
  })
  updatedAt: string;
}
