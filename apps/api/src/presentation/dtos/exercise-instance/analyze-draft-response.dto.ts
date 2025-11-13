import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for AI-generated draft analysis response
 */
export class AnalyzeDraftResponseDto {
  @ApiProperty({
    description: "Question ID that was analyzed",
    example: "s0_p0",
  })
  questionId: string;

  @ApiProperty({
    description: "AI-generated suggestion/feedback",
    example:
      "Tu análisis muestra un buen punto de partida. Considera profundizar en...",
  })
  suggestion: string;

  @ApiProperty({
    description: "Strengths identified in the draft",
    example: [
      "Identificaste el problema principal",
      "Usaste ejemplos concretos",
    ],
    required: false,
  })
  strengths?: string[];

  @ApiProperty({
    description: "Areas for improvement",
    example: [
      "Podrías agregar más contexto sobre...",
      "Considera explorar el impacto de...",
    ],
    required: false,
  })
  improvements?: string[];

  @ApiProperty({
    description: "Rubric alignment score (0-100)",
    example: 75,
    required: false,
  })
  rubricAlignment?: number;
}
