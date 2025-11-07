import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProgramResponseDto {
  @ApiProperty({
    description: 'ID del programa',
    example: 'programa:abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del programa',
    example: 'Programa de Desarrollo Web',
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del programa',
    example: 'Programa completo para aprender desarrollo web full-stack',
  })
  descripcion?: string;

  @ApiProperty({
    description: 'Duración en semanas',
    example: 12,
  })
  duracionSemanas: number;

  @ApiProperty({
    description: 'Estado del programa',
    enum: ['borrador', 'publicado', 'archivado'],
    example: 'borrador',
  })
  estado: string;

  @ApiProperty({
    description: 'Versión actual',
    example: '1.0.0',
  })
  versionActual: string;

  @ApiPropertyOptional({
    description: 'Categoría del programa',
    example: 'Tecnología',
  })
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Nivel de dificultad',
    enum: ['principiante', 'intermedio', 'avanzado'],
    example: 'intermedio',
  })
  nivelDificultad?: string;

  @ApiPropertyOptional({
    description: 'URL de imagen de portada',
    example: 'https://example.com/image.jpg',
  })
  imagenPortadaUrl?: string;

  @ApiPropertyOptional({
    description: 'Objetivos de aprendizaje',
    type: [String],
    example: ['Dominar HTML y CSS', 'Crear aplicaciones con React'],
  })
  objetivosAprendizaje?: string[];

  @ApiPropertyOptional({
    description: 'Prerequisitos del programa',
    type: [String],
    example: ['Conocimientos básicos de programación'],
  })
  prerequisitos?: string[];

  @ApiPropertyOptional({
    description: 'Audiencia objetivo',
    example: 'Estudiantes universitarios de carreras técnicas',
  })
  audienciaObjetivo?: string;

  @ApiPropertyOptional({
    description: 'Tags del programa',
    type: [String],
    example: ['web', 'frontend', 'backend', 'full-stack'],
  })
  tags?: string[];

  @ApiProperty({
    description: 'Visible para estudiantes',
    example: true,
  })
  visible: boolean;

  @ApiProperty({
    description: 'ID del creador',
    example: 'usuario:instructor123',
  })
  creador: string;

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

  @ApiPropertyOptional({
    description: 'Estadísticas del programa (número de fases, proof points, etc.)',
    example: {
      fases: 3,
      proof_points: 8,
      duracion: '12 semanas',
      estudiantes: 0,
    },
  })
  estadisticas?: {
    fases: number;
    proof_points: number;
    duracion: string;
    estudiantes: number;
  };
}
