import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO para la respuesta de validación de calidad
 */
export class ValidacionCalidadDto {
  @ApiProperty({
    description: "Puntuación general de calidad del contenido generado",
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  score_general!: number;

  @ApiProperty({
    description: "Métricas detalladas de calidad",
    example: {
      claridad: 9,
      relevancia: 8,
      profundidad: 7,
      pedagogia: 8.5,
    },
  })
  metricas!: Record<string, any>;

  @ApiProperty({
    description: "Sugerencias de mejora para el contenido",
    type: [String],
    example: [
      "Agregar más ejemplos prácticos",
      "Incluir diagrama visual para el concepto X",
    ],
  })
  sugerencias!: string[];

  @ApiProperty({
    description: "Comparación del contenido con los objetivos de aprendizaje",
    type: [Object],
    example: [
      {
        objetivo: "Comprender el concepto de MVP",
        cumplimiento: 0.9,
        comentario: "Bien cubierto con ejemplos",
      },
    ],
  })
  comparacion_objetivos!: Array<Record<string, any>>;
}

/**
 * DTO para la respuesta de contenido generado
 */
export class GeneratedContentResponseDto {
  @ApiProperty({
    description: "Contenido generado por la IA",
    example: {
      titulo: "Introducción al MVP",
      secciones: [],
    },
  })
  contenido!: Record<string, any>;

  @ApiPropertyOptional({
    description: "Análisis de calidad del contenido generado",
    type: ValidacionCalidadDto,
  })
  analisis_calidad?: ValidacionCalidadDto;

  @ApiProperty({
    description: "ID del registro de componente_contenido creado",
    example: "componente_contenido:abc123",
  })
  componente_contenido_id!: string;
}
