import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExerciseTemplateResponseDto {
  @ApiProperty({
    description: 'ID del template',
    example: 'exercise_template:abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del template',
    example: 'Crear Mi Primera Variable',
  })
  nombre: string;

  @ApiProperty({
    description: 'Categoría del ejercicio',
    enum: ['code_generation', 'code_explanation', 'code_review', 'debugging', 'conceptual', 'project_design'],
    example: 'code_generation',
  })
  categoria: string;

  @ApiProperty({
    description: 'Descripción del template',
    example: 'Ejercicio para crear y trabajar con variables en programación',
  })
  descripcion: string;

  @ApiPropertyOptional({
    description: 'Objetivo pedagógico',
    example: 'Comprender el concepto de variables y su sintaxis',
  })
  objetivoPedagogico?: string;

  @ApiPropertyOptional({
    description: 'Rol del asistente de IA',
    example: 'Instructor paciente que guía paso a paso',
  })
  rolIA?: string;

  @ApiProperty({
    description: 'Schema de configuración (JSON Schema)',
    type: 'object',
  })
  configuracionSchema: Record<string, any>;

  @ApiProperty({
    description: 'Configuración por defecto',
    type: 'object',
  })
  configuracionDefault: Record<string, any>;

  @ApiProperty({
    description: 'Template del prompt para IA',
  })
  promptTemplate: string;

  @ApiProperty({
    description: 'Schema del output esperado',
    type: 'object',
  })
  outputSchema: Record<string, any>;

  @ApiProperty({
    description: 'Configuración de preview',
    type: 'object',
  })
  previewConfig: Record<string, any>;

  @ApiProperty({
    description: 'Icono del template',
    example: '🎯',
  })
  icono: string;

  @ApiProperty({
    description: 'Color en formato hex',
    example: '#6366f1',
  })
  color: string;

  @ApiProperty({
    description: 'Es template oficial de Xpertia',
  })
  esOficial: boolean;

  @ApiProperty({
    description: 'Está activo para uso',
  })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Fecha de última actualización',
  })
  updatedAt: string;
}
