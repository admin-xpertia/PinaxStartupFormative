import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for exercise progress summary within a proof point
 */
export class ExerciseProgressSummaryDto {
  @ApiProperty({
    description: "Exercise instance ID",
    example: "exercise_instance:⟨1762822550477_0⟩",
  })
  exerciseId: string;

  @ApiProperty({
    description: "Exercise status",
    enum: ["not_started", "in_progress", "completed"],
    example: "in_progress",
  })
  status: "not_started" | "in_progress" | "completed";

  @ApiProperty({
    description: "Progress percentage (0-100)",
    example: 45,
  })
  progress: number;

  @ApiProperty({
    description: "Final score",
    example: 85.5,
    nullable: true,
  })
  score?: number;

  @ApiProperty({
    description: "Last accessed date",
    example: "2025-01-15T10:30:00Z",
    nullable: true,
  })
  lastAccessed?: Date;
}

/**
 * DTO for detailed proof point progress
 */
export class ProofPointProgressResponseDto {
  @ApiProperty({
    description: "Proof point ID",
    example: "proof_point:⟨1762784185921_0⟩",
  })
  proofPointId: string;

  @ApiProperty({
    description: "Student ID",
    example: "estudiante:⟨1762784185921_0⟩",
  })
  studentId: string;

  @ApiProperty({
    description: "Proof point status",
    enum: ["locked", "available", "in_progress", "completed"],
    example: "in_progress",
  })
  status: "locked" | "available" | "in_progress" | "completed";

  @ApiProperty({
    description: "Overall progress percentage (0-100)",
    example: 60,
  })
  progress: number;

  @ApiProperty({
    description: "Number of completed exercises",
    example: 3,
  })
  completedExercises: number;

  @ApiProperty({
    description: "Total number of exercises",
    example: 5,
  })
  totalExercises: number;

  @ApiProperty({
    description: "Number of required exercises to complete",
    example: 4,
  })
  requiredExercises: number;

  @ApiProperty({
    description: "Average score across completed exercises",
    example: 85.5,
  })
  averageScore: number;

  @ApiProperty({
    description: "Date when first exercise was started",
    example: "2025-01-10T10:30:00Z",
    nullable: true,
  })
  startedAt?: Date;

  @ApiProperty({
    description: "Date when proof point was completed",
    example: "2025-01-15T10:30:00Z",
    nullable: true,
  })
  completedAt?: Date;

  @ApiProperty({
    description: "Progress details for each exercise",
    type: [ExerciseProgressSummaryDto],
  })
  exercises: ExerciseProgressSummaryDto[];
}
