import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class SaveProgressDto {
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

  @ApiPropertyOptional({
    description: "Datos del progreso del estudiante (JSON)",
    example: { respuestas: [], seccion_actual: 2 },
  })
  @IsOptional()
  datos?: Record<string, any> | any[];

  @ApiPropertyOptional({
    description: "Porcentaje de completitud (0-100)",
    example: 45,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeCompletitud?: number;

  @ApiPropertyOptional({
    description: "Tiempo invertido en minutos",
    example: 15,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tiempoInvertidoMinutos?: number;
}
