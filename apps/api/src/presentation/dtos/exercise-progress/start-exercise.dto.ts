import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class StartExerciseDto {
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
}
