import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

/**
 * DTO para actualizar los prerequisitos de un proof point
 * Utilizado por el roadmap visual al crear/eliminar conectores entre proof points
 */
export class UpdatePrerequisitosDto {
  @ApiProperty({
    description:
      'Array de IDs de proof points que son prerequisitos (formato: "proofpoint:id")',
    type: [String],
    example: ["proofpoint:abc123", "proofpoint:def456"],
  })
  @IsArray()
  @IsString({ each: true })
  prerequisitos!: string[];
}
