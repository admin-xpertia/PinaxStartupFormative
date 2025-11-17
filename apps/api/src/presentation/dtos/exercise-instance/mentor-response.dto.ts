import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for Socratic Mentor/Advisor interactions
 * Used by MentorIAPlayer
 */
export class MentorResponseDto {
  @ApiProperty({
    description: "Socratic guidance or hint from the AI mentor",
    example: "Interesante propuesta. ¿Has considerado cómo esto impacta a tu audiencia objetivo? ¿Qué necesidades específicas están tratando de resolver?",
  })
  guidance: string;

  @ApiProperty({
    description: "Follow-up questions to deepen student thinking",
    example: [
      "¿Qué datos tienes para respaldar esta suposición?",
      "¿Cómo se compara esto con casos similares que hayas visto?",
    ],
    required: false,
  })
  followUpQuestions?: string[];

  @ApiProperty({
    description: "References or resources mentioned in the guidance",
    example: [
      "Revisa el concepto de 'Value Proposition Canvas' en la lección 2",
    ],
    required: false,
  })
  references?: string[];

  @ApiProperty({
    description: "Encouragement level (low, medium, high)",
    example: "medium",
    required: false,
  })
  encouragementLevel?: string;
}
