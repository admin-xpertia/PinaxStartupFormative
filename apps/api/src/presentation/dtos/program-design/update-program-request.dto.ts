import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  Min,
  IsArray,
  IsEnum,
} from "class-validator";

export class UpdateProgramRequestDto {
  @ApiPropertyOptional({
    description: "Nombre del programa",
    example: "Programa de Desarrollo Web",
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombre?: string;

  @ApiPropertyOptional({
    description: "Descripción del programa",
    example: "Programa completo para aprender desarrollo web full-stack",
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: "Duración en semanas",
    example: 12,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duracionSemanas?: number;

  @ApiPropertyOptional({
    description: "Categoría del programa",
    example: "Tecnología",
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: "Nivel de dificultad",
    enum: ["principiante", "intermedio", "avanzado"],
    example: "intermedio",
  })
  @IsOptional()
  @IsEnum(["principiante", "intermedio", "avanzado"])
  nivelDificultad?: "principiante" | "intermedio" | "avanzado";

  @ApiPropertyOptional({
    description: "Objetivos de aprendizaje",
    type: [String],
    example: ["Dominar HTML y CSS", "Crear aplicaciones con React"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objetivosAprendizaje?: string[];

  @ApiPropertyOptional({
    description: "Prerequisitos del programa",
    type: [String],
    example: ["Conocimientos básicos de programación"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisitos?: string[];

  @ApiPropertyOptional({
    description: "Audiencia objetivo",
    example: "Estudiantes universitarios de carreras técnicas",
  })
  @IsOptional()
  @IsString()
  audienciaObjetivo?: string;

  @ApiPropertyOptional({
    description: "Tags del programa",
    type: [String],
    example: ["web", "frontend", "backend", "full-stack"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
