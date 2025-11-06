import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProofPointResponseDto {
  @ApiProperty({
    description: 'ID del proof point',
    example: 'proof_point:abc123',
  })
  id: string;

  @ApiProperty({
    description: 'ID de la fase a la que pertenece',
    example: 'fase:xyz789',
  })
  fase: string;

  @ApiProperty({
    description: 'Nombre del proof point',
    example: 'Crear mi primera variable',
  })
  nombre: string;

  @ApiProperty({
    description: 'Slug para URL',
    example: 'crear-mi-primera-variable',
  })
  slug: string;

  @ApiProperty({
    description: 'Descripción',
    example: 'Aprender a declarar y usar variables en JavaScript',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Pregunta central',
    example: '¿Cómo declaro y uso variables en JavaScript?',
  })
  preguntaCentral: string;

  @ApiProperty({
    description: 'Orden en la fase',
    example: 1,
  })
  ordenEnFase: number;

  @ApiProperty({
    description: 'Duración estimada en horas',
    example: 2,
  })
  duracionEstimadaHoras: number;

  @ApiPropertyOptional({
    description: 'Tipo de entregable final',
    example: 'código',
  })
  tipoEntregableFinal?: string;

  @ApiPropertyOptional({
    description: 'Documentación de contexto',
    example: 'Variables son contenedores de datos',
  })
  documentacionContexto?: string;

  @ApiProperty({
    description: 'IDs de proof points prerequisitos',
    type: [String],
    example: ['proof_point:prereq123'],
  })
  prerequisitos: string[];

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-11-06T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-11-06T12:30:00Z',
  })
  updatedAt: string;
}
