import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ProgramStructure } from "../../../types/enrollment";

class CohortProgramDto {
  @ApiProperty({ description: "ID del programa publicado" })
  id: string;

  @ApiProperty({ description: "Nombre del programa" })
  nombre: string;

  @ApiProperty({ description: "Versión actual del programa" })
  version: string;
}

export class CohortResponseDto {
  @ApiProperty({ description: "ID de la cohorte" })
  id: string;

  @ApiProperty({ description: "Nombre de la cohorte" })
  nombre: string;

  @ApiPropertyOptional({ description: "Descripción de la cohorte" })
  descripcion?: string;

  @ApiProperty({
    description: "Estado actual de la cohorte",
    enum: ["planificado", "activo", "finalizado", "archivado"],
  })
  estado: string;

  @ApiProperty({
    description: "Fecha de inicio",
    type: String,
    format: "date-time",
  })
  fechaInicio: string;

  @ApiPropertyOptional({
    description: "Fecha estimada de finalización",
    type: String,
    format: "date-time",
  })
  fechaFinEstimada?: string;

  @ApiProperty({ type: CohortProgramDto })
  programa: CohortProgramDto;

  @ApiPropertyOptional({
    description: "Configuración avanzada de la cohorte",
    type: Object,
  })
  configuracion?: Record<string, any>;

  @ApiPropertyOptional({
    description: "ID del snapshot de programa asociado",
  })
  snapshotProgramaId?: string;

  @ApiProperty({
    description: "Número total de estudiantes inscritos",
    example: 12,
  })
  totalEstudiantes: number;

  @ApiPropertyOptional({
    description: "Estructura congelada del programa para esta cohorte",
    type: Object,
  })
  structure?: ProgramStructure | null;
}
