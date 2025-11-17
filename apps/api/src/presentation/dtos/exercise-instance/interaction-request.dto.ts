import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsObject, IsArray } from "class-validator";

/**
 * Generic DTO for AI-powered exercise interactions
 * Supports multiple interaction types: roleplay, mentor, simulation
 */
export class InteractionRequestDto {
  @ApiProperty({
    description: "User's action or message in the interaction",
    example: "Hola, me gustaría conocer más sobre el producto",
  })
  @IsString()
  accionUsuario: string;

  @ApiProperty({
    description: "Current state of the interaction (variables, context, progress)",
    example: { objetivosCumplidos: [1], turno: 3, estadoEmocional: "neutral" },
    required: false,
  })
  @IsOptional()
  @IsObject()
  estadoActual?: Record<string, any>;

  @ApiProperty({
    description: "Conversation history (previous messages)",
    example: [
      { role: "user", content: "Hola" },
      { role: "assistant", content: "¡Hola! ¿En qué puedo ayudarte?" },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  historial?: Array<{ role: string; content: string }>;

  @ApiProperty({
    description: "Additional context for the AI (current step, section, etc.)",
    example: { pasoActual: "introduccion", seccionId: "sec_1" },
    required: false,
  })
  @IsOptional()
  @IsObject()
  contexto?: Record<string, any>;
}
