import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para componentes dentro de un nivel
 */
export class ComponenteDto {
  @ApiProperty({ description: 'ID único del componente' })
  id: string;

  @ApiProperty({ description: 'Nombre del componente' })
  nombre: string;

  @ApiProperty({ description: 'Tipo de componente (leccion, ejercicio, etc.)' })
  tipo: string;

  @ApiProperty({ description: 'Orden del componente en el nivel' })
  orden: number;

  @ApiProperty({ description: 'ID del nivel al que pertenece' })
  nivel: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: string;
}

/**
 * DTO para niveles dentro de un proof point
 */
export class NivelDto {
  @ApiProperty({ description: 'ID único del nivel' })
  id: string;

  @ApiProperty({ description: 'Número del nivel' })
  numero: number;

  @ApiProperty({ description: 'Nombre del nivel' })
  nombre: string;

  @ApiProperty({ description: 'Objetivo específico del nivel' })
  objetivo_especifico: string;

  @ApiProperty({ description: 'ID del proof point al que pertenece' })
  proof_point: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: string;

  @ApiProperty({
    description: 'Componentes del nivel',
    type: [ComponenteDto],
    required: false,
  })
  componentes?: ComponenteDto[];
}

/**
 * DTO para proof points dentro de una fase
 */
export class ProofPointDto {
  @ApiProperty({ description: 'ID único del proof point' })
  id: string;

  @ApiProperty({ description: 'Nombre del proof point' })
  nombre: string;

  @ApiProperty({ description: 'Slug único del proof point' })
  slug: string;

  @ApiProperty({ description: 'Descripción del proof point' })
  descripcion: string;

  @ApiProperty({ description: 'Pregunta central del proof point' })
  pregunta_central: string;

  @ApiProperty({ description: 'Tipo de entregable esperado' })
  tipo_entregable: string;

  @ApiProperty({ description: 'Número de niveles' })
  numero_niveles: number;

  @ApiProperty({ description: 'Prerequisitos', type: [String] })
  prerequisitos: string[];

  @ApiProperty({ description: 'Duración estimada en horas' })
  duracion_estimada_horas: number;

  @ApiProperty({ description: 'ID de la fase a la que pertenece' })
  fase: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: string;

  @ApiProperty({
    description: 'Niveles del proof point',
    type: [NivelDto],
    required: false,
  })
  niveles?: NivelDto[];
}

/**
 * DTO para fases dentro de un programa
 */
export class FaseDto {
  @ApiProperty({ description: 'ID único de la fase' })
  id: string;

  @ApiProperty({ description: 'Nombre de la fase' })
  nombre: string;

  @ApiProperty({ description: 'Descripción de la fase' })
  descripcion: string;

  @ApiProperty({ description: 'Objetivos de aprendizaje' })
  objetivos_aprendizaje: string;

  @ApiProperty({ description: 'Duración en semanas' })
  duracion_semanas: number;

  @ApiProperty({ description: 'Número de proof points' })
  numero_proof_points: number;

  @ApiProperty({ description: 'ID del programa al que pertenece' })
  programa: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: string;

  @ApiProperty({
    description: 'Proof points de la fase',
    type: [ProofPointDto],
    required: false,
  })
  proof_points?: ProofPointDto[];
}

/**
 * DTO de respuesta para la arquitectura completa de un programa
 * Incluye toda la jerarquía: Programa -> Fases -> ProofPoints -> Niveles -> Componentes
 */
export class ArquitecturaResponseDto {
  @ApiProperty({ description: 'ID único del programa' })
  id: string;

  @ApiProperty({ description: 'Nombre del programa' })
  nombre: string;

  @ApiProperty({ description: 'Descripción del programa' })
  descripcion: string;

  @ApiProperty({ description: 'Categoría del programa' })
  categoria: string;

  @ApiProperty({ description: 'Duración total en semanas' })
  duracion_semanas: number;

  @ApiProperty({ description: 'Número de fases' })
  numero_fases: number;

  @ApiProperty({ description: 'ID del creador' })
  creador: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: string;

  @ApiProperty({
    description: 'Fases del programa con su jerarquía completa',
    type: [FaseDto],
    required: false,
  })
  fases?: FaseDto[];
}
