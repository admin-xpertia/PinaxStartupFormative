import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for overall student progress summary
 */
export class StudentProgressSummaryDto {
  @ApiProperty({
    description: "Total number of exercises available",
    example: 50,
  })
  totalExercises: number;

  @ApiProperty({
    description: "Number of completed exercises",
    example: 35,
  })
  completedExercises: number;

  @ApiProperty({
    description: "Number of exercises in progress",
    example: 10,
  })
  inProgressExercises: number;

  @ApiProperty({
    description: "Overall completion percentage",
    example: 70,
  })
  completionPercentage: number;

  @ApiProperty({
    description: "Total time invested in minutes",
    example: 2450,
  })
  totalTimeInvestedMinutes: number;

  @ApiProperty({
    description: "Average score across completed exercises",
    example: 85.5,
    nullable: true,
  })
  averageScore: number | null;

  @ApiProperty({
    description: "Progress by proof point",
    type: "array",
    items: {
      type: "object",
      properties: {
        proofPointId: { type: "string" },
        proofPointName: { type: "string" },
        totalExercises: { type: "number" },
        completedExercises: { type: "number" },
        completionPercentage: { type: "number" },
        averageScore: { type: "number", nullable: true },
        timeInvestedMinutes: { type: "number" },
      },
    },
  })
  proofPointStats: ProofPointProgressDto[];

  @ApiProperty({
    description: "Recent completed exercises",
    type: "array",
    items: {
      type: "object",
      properties: {
        exerciseId: { type: "string" },
        exerciseName: { type: "string" },
        exerciseTemplate: { type: "string" },
        completedAt: { type: "string" },
        score: { type: "number", nullable: true },
        timeInvestedMinutes: { type: "number" },
      },
    },
  })
  recentCompletedExercises: CompletedExerciseDto[];
}

export class ProofPointProgressDto {
  @ApiProperty()
  proofPointId: string;

  @ApiProperty()
  proofPointName: string;

  @ApiProperty()
  totalExercises: number;

  @ApiProperty()
  completedExercises: number;

  @ApiProperty()
  completionPercentage: number;

  @ApiProperty({ nullable: true })
  averageScore: number | null;

  @ApiProperty()
  timeInvestedMinutes: number;
}

export class CompletedExerciseDto {
  @ApiProperty()
  exerciseId: string;

  @ApiProperty()
  exerciseName: string;

  @ApiProperty()
  exerciseTemplate: string;

  @ApiProperty()
  completedAt: string;

  @ApiProperty({ nullable: true })
  score: number | null;

  @ApiProperty()
  timeInvestedMinutes: number;
}
