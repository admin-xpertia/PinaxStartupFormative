import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsObject, IsOptional, Min, Max } from 'class-validator';

export class CompleteExerciseDto {
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

  @ApiProperty({
    description: 'Datos finales del ejercicio (respuestas, trabajo completado)',
    example: { respuestas: [], trabajo_final: {} },
  })
  @IsObject()
  datos: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Tiempo total invertido en minutos',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tiempoInvertidoMinutos?: number;

  @ApiPropertyOptional({
    description: 'Score obtenido (si aplica)',
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  scoreFinal?: number;
}

export class CompleteExerciseResponseDto {
  @ApiProperty({
    description: 'ID del progreso actualizado',
    example: 'exercise_progress:abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Estado del ejercicio',
    example: 'completado',
  })
  estado: string;

  @ApiPropertyOptional({
    description: 'Score final obtenido',
    example: 8.5,
  })
  scoreFinal?: number;

  @ApiPropertyOptional({
    description: 'Feedback de IA sobre el trabajo realizado',
    example: 'Excelente trabajo. Demostraste dominio de los conceptos clave.',
  })
  feedback?: string;

  @ApiProperty({
    description: 'Indica si el ejercicio fue completado exitosamente',
    example: true,
  })
  completado: boolean;
}
