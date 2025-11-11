import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for detailed proof point information (student view)
 * Includes proof point metadata and related phase information
 */
export class ProofPointDetailsDto {
  @ApiProperty({
    description: "Proof point ID",
    example: "proof_point:⟨1762784185921_0⟩",
  })
  id: string;

  @ApiProperty({
    description: "Proof point name",
    example: "Identificación de Necesidades del Cliente",
  })
  nombre: string;

  @ApiProperty({
    description: "URL-friendly slug",
    example: "identificacion-necesidades-cliente",
  })
  slug: string;

  @ApiPropertyOptional({
    description: "Proof point description",
    example:
      "Aprenderás a identificar y validar necesidades reales de clientes potenciales",
  })
  descripcion?: string;

  @ApiPropertyOptional({
    description: "Central question to guide learning",
    example: "¿Cómo puedo validar que estoy resolviendo un problema real?",
  })
  preguntaCentral?: string;

  @ApiProperty({
    description: "Order within the phase",
    example: 1,
  })
  ordenEnFase: number;

  @ApiProperty({
    description: "Estimated duration in hours",
    example: 8,
  })
  duracionEstimadaHoras: number;

  @ApiPropertyOptional({
    description: "Type of final deliverable",
    example: "Reporte de Validación de Hipótesis",
  })
  tipoEntregableFinal?: string;

  @ApiPropertyOptional({
    description: "Context documentation",
  })
  documentacionContexto?: string;

  @ApiProperty({
    description: "Array of prerequisite proof point IDs",
    type: [String],
    example: [],
  })
  prerequisitos: string[];

  @ApiProperty({
    description: "Phase ID",
    example: "fase:⟨1762784185920_0⟩",
  })
  faseId: string;

  @ApiProperty({
    description: "Phase name",
    example: "Fase 1: Descubrimiento y Validación",
  })
  faseNombre: string;

  @ApiPropertyOptional({
    description: "Phase description",
  })
  faseDescripcion?: string;

  @ApiProperty({
    description: "Phase number",
    example: 1,
  })
  faseNumero: number;

  @ApiProperty({
    description: "Program ID",
    example: "programa:⟨1762784185919_0⟩",
  })
  programaId: string;

  @ApiProperty({
    description: "Program name",
    example: "Emprendimiento e Innovación Xpertia",
  })
  programaNombre: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2025-01-15T10:30:00Z",
  })
  createdAt: string;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2025-01-15T10:30:00Z",
  })
  updatedAt: string;
}
