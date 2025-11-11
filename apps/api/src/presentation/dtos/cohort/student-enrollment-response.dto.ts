import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ProgramStructure } from "../../../types/enrollment";

export class StudentEnrollmentResponseDto {
  @ApiProperty({ description: "ID de la inscripción" })
  id: string;

  @ApiProperty({ description: "ID del estudiante" })
  studentId: string;

  @ApiProperty({ description: "ID de la cohorte" })
  cohortId: string;

  @ApiProperty({ description: "ID del programa" })
  programId: string;

  @ApiProperty({ description: "Nombre del programa" })
  programName: string;

  @ApiPropertyOptional({ description: "Descripción del programa" })
  programDescription?: string;

  @ApiProperty({ description: "Nombre del instructor asignado" })
  instructorName: string;

  @ApiProperty({
    description: "Fecha de inscripción",
    type: String,
    format: "date-time",
  })
  enrolledAt: string;

  @ApiProperty({
    description: "Estado de la inscripción",
    enum: ["active", "completed", "dropped"],
  })
  status: "active" | "completed" | "dropped";

  @ApiProperty({
    description: "Progreso general del estudiante en la cohorte (0-100)",
    example: 42,
  })
  overallProgress: number;

  @ApiProperty({
    description: "Proof points completados",
    example: 3,
  })
  completedProofPoints: number;

  @ApiProperty({
    description: "Proof points totales",
    example: 12,
  })
  totalProofPoints: number;

  @ApiPropertyOptional({
    description: "Fecha estimada de finalización",
    type: String,
    format: "date-time",
  })
  estimatedCompletionDate?: string;

  @ApiPropertyOptional({
    description: "ID de la fase actual",
  })
  currentPhaseId?: string;

  @ApiPropertyOptional({
    description: "ID del proof point actual",
  })
  currentProofPointId?: string;

  @ApiPropertyOptional({
    description: "ID del ejercicio actual",
  })
  currentExerciseId?: string;

  @ApiPropertyOptional({
    description: "Estructura congelada del programa asignado",
    type: Object,
  })
  snapshotStructure?: ProgramStructure | null;
}
