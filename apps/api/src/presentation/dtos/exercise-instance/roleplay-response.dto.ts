import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for Roleplay/Simulation interactions
 * Used by SimulacionInteraccionPlayer
 */
export class RoleplayResponseDto {
  @ApiProperty({
    description: "AI character's reply to the user",
    example: "Entiendo tu interés. Déjame contarte sobre nuestras características principales...",
  })
  reply: string;

  @ApiProperty({
    description: "List of objective IDs that have been met",
    example: [1, 3],
    required: false,
  })
  objectivesMet?: number[];

  @ApiProperty({
    description: "Current emotional state of the AI character",
    example: "interesado",
    required: false,
  })
  emotionalState?: string;

  @ApiProperty({
    description: "Internal evaluation of user performance (hidden from UI initially)",
    example: {
      criterio1: true,
      criterio2: false,
      puntaje: 0.75,
    },
    required: false,
  })
  evaluation?: Record<string, any>;

  @ApiProperty({
    description: "Whether the interaction should end",
    example: false,
    required: false,
  })
  shouldEnd?: boolean;
}
