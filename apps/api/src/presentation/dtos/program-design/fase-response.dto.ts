import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class FaseResponseDto {
  @ApiProperty({
    description: "ID de la fase",
    example: "fase:abc123",
  })
  id: string;

  @ApiProperty({
    description: "ID del programa al que pertenece",
    example: "programa:xyz789",
  })
  programa: string;

  @ApiProperty({
    description: "Número de la fase",
    example: 1,
  })
  numeroFase: number;

  @ApiProperty({
    description: "Nombre de la fase",
    example: "Fundamentos de Programación",
  })
  nombre: string;

  @ApiProperty({
    description: "Descripción de la fase",
    example: "Introducción a los conceptos básicos de programación",
  })
  descripcion: string;

  @ApiPropertyOptional({
    description: "Objetivos de aprendizaje",
    type: [String],
    example: ["Entender variables", "Aprender loops"],
  })
  objetivosAprendizaje?: string[];

  @ApiProperty({
    description: "Duración estimada en semanas",
    example: 3,
  })
  duracionSemanasEstimada: number;

  @ApiProperty({
    description: "Orden de la fase en el programa",
    example: 1,
  })
  orden: number;

  @ApiProperty({
    description: "Fecha de creación",
    example: "2025-11-06T10:00:00Z",
  })
  createdAt: string;

  @ApiProperty({
    description: "Fecha de última actualización",
    example: "2025-11-06T12:30:00Z",
  })
  updatedAt: string;
}
