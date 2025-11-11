import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum EstadoContenido {
  SIN_GENERAR = 'sin_generar',
  GENERANDO = 'generando',
  GENERADO = 'generado',
  DRAFT = 'draft',
  PUBLICADO = 'publicado',
  ERROR = 'error',
}

export class UpdateExerciseStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del contenido',
    enum: EstadoContenido,
    example: EstadoContenido.PUBLICADO,
  })
  @IsEnum(EstadoContenido)
  estadoContenido: EstadoContenido;
}
