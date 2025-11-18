import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ExerciseProgressStatus } from "./exercise-progress-response.dto";
import { Type } from "class-transformer";
import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class CompleteExerciseDto {
  @ApiPropertyOptional({
    description: "ID del estudiante",
    example: "estudiante:abc123",
  })
  @IsOptional()
  @IsString()
  estudianteId?: string;

  @ApiPropertyOptional({
    description: "ID de la cohorte",
    example: "cohorte:xyz789",
  })
  @IsOptional()
  @IsString()
  cohorteId?: string;

  @ApiProperty({
    description: "Datos finales del ejercicio (respuestas, trabajo completado)",
    example: { respuestas: [], trabajo_final: {} },
  })
  datos: Record<string, any> | any[];

  @ApiPropertyOptional({
    description: "Tiempo total invertido en minutos",
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tiempoInvertidoMinutos?: number;

  @ApiPropertyOptional({
    description: "Score obtenido (si aplica)",
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  scoreFinal?: number;
}

export class CompleteExerciseResponseDto {
  @ApiProperty({
    description: "ID del progreso actualizado",
    example: "exercise_progress:abc123",
  })
  id: string;

  @ApiProperty({
    description: "Estado del ejercicio",
    example: "completado",
  })
  estado: string;

  @ApiProperty({
    description: "Estado extendido del ejercicio",
    enum: [
      "not_started",
      "in_progress",
      "submitted_for_review",
      "requires_iteration",
      "approved",
    ],
    example: "submitted_for_review",
  })
  status: ExerciseProgressStatus;

  @ApiPropertyOptional({
    description: "Fecha de envío a revisión",
    example: "2025-01-15T10:30:00Z",
  })
  submittedAt?: string;

  @ApiPropertyOptional({
    description: "Score final obtenido",
    example: 8.5,
  })
  scoreFinal?: number;

  @ApiPropertyOptional({
    description: "Feedback de IA sobre el trabajo realizado",
    example: "Excelente trabajo. Demostraste dominio de los conceptos clave.",
  })
  feedback?: string;

  @ApiProperty({
    description: "Indica si el ejercicio fue completado exitosamente",
    example: true,
  })
  completado: boolean;
}
