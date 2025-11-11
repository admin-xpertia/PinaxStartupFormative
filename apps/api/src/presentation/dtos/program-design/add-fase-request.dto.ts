import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  Min,
  IsArray,
} from "class-validator";

export class AddFaseRequestDto {
  @ApiPropertyOptional({
    description:
      "Número de la fase (opcional, se auto-calcula si no se provee)",
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numeroFase?: number;

  @ApiProperty({
    description: "Nombre de la fase",
    example: "Fundamentos de Programación",
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiProperty({
    description: "Descripción de la fase",
    example: "Introducción a los conceptos básicos de programación",
  })
  @IsString()
  descripcion: string;

  @ApiPropertyOptional({
    description: "Objetivos de aprendizaje de la fase",
    type: [String],
    example: [
      "Entender variables y tipos de datos",
      "Aprender estructuras de control",
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objetivosAprendizaje?: string[];

  @ApiProperty({
    description: "Duración estimada en semanas",
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duracionSemanasEstimada: number;
}
