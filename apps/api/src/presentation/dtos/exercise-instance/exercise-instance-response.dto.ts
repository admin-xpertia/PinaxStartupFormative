import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ExerciseInstanceResponseDto {
  @ApiProperty({
    description: "ID de la instancia de ejercicio",
    example: "exercise_instance:abc123",
  })
  id: string;

  @ApiProperty({
    description: "ID del template utilizado",
    example: "exercise_template:crear-primera-variable",
  })
  template: string;

  @ApiProperty({
    description: "ID del proof point al que pertenece",
    example: "proof_point:variables-basicas",
  })
  proofPoint: string;

  @ApiProperty({
    description: "Nombre del ejercicio",
    example: "Crear variable de saludo",
  })
  nombre: string;

  @ApiPropertyOptional({
    description: "Descripción breve del ejercicio",
    example: 'Crea una variable llamada saludo con el texto "Hola Mundo"',
  })
  descripcionBreve?: string;

  @ApiProperty({
    description: "Consideraciones de contexto para el instructor",
  })
  consideracionesContexto: string;

  @ApiProperty({
    description: "Configuración personalizada del ejercicio",
    type: "object",
  })
  configuracionPersonalizada: Record<string, any>;

  @ApiProperty({
    description: "Orden dentro del proof point",
    example: 1,
  })
  orden: number;

  @ApiProperty({
    description: "Duración estimada en minutos",
    example: 30,
  })
  duracionEstimadaMinutos: number;

  @ApiProperty({
    description: "Estado del contenido generado",
    enum: [
      "sin_generar",
      "generando",
      "generado",
      "draft",
      "publicado",
      "error",
    ],
    example: "sin_generar",
  })
  estadoContenido: string;

  @ApiPropertyOptional({
    description: "ID del contenido actual (si existe)",
    example: "exercise_content:xyz789",
  })
  contenidoActual?: string;

  @ApiProperty({
    description: "Es obligatorio completar este ejercicio",
    example: true,
  })
  esObligatorio: boolean;

  @ApiProperty({
    description: "Fecha de creación",
  })
  createdAt: string;

  @ApiProperty({
    description: "Fecha de última actualización",
  })
  updatedAt: string;
}
