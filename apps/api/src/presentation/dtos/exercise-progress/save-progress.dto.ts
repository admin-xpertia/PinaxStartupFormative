import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsObject, IsOptional, Min, Max } from 'class-validator';

export class SaveProgressDto {
  @ApiProperty({
    description: 'ID del estudiante',
    example: 'estudiante:abc123',
  })
  @IsString()
  estudianteId: string;

  @ApiProperty({
    description: 'ID de la cohorte',
    example: 'cohorte:xyz789',
  })
  @IsString()
  cohorteId: string;

  @ApiPropertyOptional({
    description: 'Datos del progreso del estudiante (JSON)',
    example: { respuestas: [], seccion_actual: 2 },
  })
  @IsOptional()
  @IsObject()
  datos?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Porcentaje de completitud (0-100)',
    example: 45,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeCompletitud?: number;

  @ApiPropertyOptional({
    description: 'Tiempo invertido en minutos',
    example: 15,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tiempoInvertidoMinutos?: number;
}
