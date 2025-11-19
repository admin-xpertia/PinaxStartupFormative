import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import type { ExerciseProgressStatus } from "./exercise-progress-response.dto";

export class SubmitExerciseForGradingDto {
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

  @ApiPropertyOptional({
    description: "Datos finales del ejercicio (respuesta o borrador)",
    example: { respuesta: "..." },
  })
  @IsOptional()
  @IsObject()
  datos?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Minutos invertidos reportados por el estudiante",
    example: 45,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tiempoInvertidoMinutos?: number;
}

export class SubmitExerciseForGradingResponseDto {
  @ApiProperty({
    description: "ID del progreso actualizado",
    example: "exercise_progress:abc123",
  })
  id: string;

  @ApiProperty({
    description: "Estado extendido después del envío",
    example: "pending_review",
  })
  status: ExerciseProgressStatus;

  @ApiProperty({
    description: "Puntaje sugerido por la IA (0-100)",
    example: 82,
  })
  aiScore: number;

  @ApiProperty({
    description: "Feedback estructurado generado por IA",
  })
  feedback: Record<string, any>;

  @ApiProperty({
    description: "Fecha de envío",
    example: "2024-05-01T10:00:00Z",
  })
  submittedAt: string;
}

export class ReviewAndGradeSubmissionDto {
  @ApiProperty({
    description: "Puntaje asignado por el instructor (0-100)",
    example: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  instructorScore: number;

  @ApiPropertyOptional({
    description: "Feedback manual del instructor",
    example: "Buen razonamiento, mejora la claridad en la introducción.",
  })
  @IsOptional()
  @IsString()
  instructorFeedback?: string;

  @ApiProperty({
    description: "Indica si se publica la nota definitiva",
    example: true,
  })
  @IsBoolean()
  publish: boolean;
}

export class ReviewAndGradeSubmissionResponseDto {
  @ApiProperty({
    description: "ID del progreso",
    example: "exercise_progress:abc123",
  })
  id: string;

  @ApiProperty({
    description: "Estado final",
    example: "graded",
  })
  status: ExerciseProgressStatus;

  @ApiProperty({
    description: "Puntaje final publicado",
    example: 90,
  })
  finalScore: number;

  @ApiPropertyOptional({
    description: "Puntaje propuesto por la IA",
    example: 82,
  })
  aiScore?: number;

  @ApiPropertyOptional({
    description: "Feedback manual cargado por el instructor",
    example: "Buen trabajo. Ajusta las conclusiones.",
  })
  manualFeedback?: string;

  @ApiProperty({
    description: "Fecha de publicación",
    example: "2024-05-02T12:00:00Z",
  })
  gradedAt: string;
}

export class InstructorSubmissionListItemDto {
  @ApiProperty({
    description: "ID del registro de progreso",
    example: "exercise_progress:abc123",
  })
  progressId: string;

  @ApiProperty({
    description: "Nombre del estudiante asociado",
    example: "Camila Méndez",
  })
  estudianteNombre: string;

  @ApiProperty({
    description: "Nombre del ejercicio entregado",
    example: "Mapa de stakeholders clave",
  })
  ejercicioNombre: string;

  @ApiProperty({
    description: "Fecha de envío registrada",
    example: "2024-05-04T09:15:00Z",
  })
  entregadoEl: string;

  @ApiProperty({
    description: "Estado actual del progreso",
    example: "pending_review",
  })
  status: ExerciseProgressStatus;

  @ApiPropertyOptional({
    description: "Puntaje sugerido por IA si está disponible",
    example: 78,
  })
  aiScore?: number | null;
}
