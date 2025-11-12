import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

/**
 * DTO for analyzing a draft against rubric criteria
 */
export class AnalyzeDraftRequestDto {
  @ApiProperty({
    description: "Question/Prompt ID within the exercise",
    example: "s0_p0",
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: "Draft text written by the student",
    example: "Mi análisis del problema es...",
  })
  @IsString()
  @IsNotEmpty()
  draftText: string;
}
