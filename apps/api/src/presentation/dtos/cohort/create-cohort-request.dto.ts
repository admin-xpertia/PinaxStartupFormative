import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsDateString,
  IsObject,
  IsNumber,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCohortRequestDto {
  @ApiProperty({
    description: "ID del programa publicado",
    example: "programa:leadership_001",
  })
  @IsString()
  @IsNotEmpty()
  programaId: string;

  @ApiProperty({
    description: "Nombre de la cohorte",
    example: "Cohorte Primavera 2025",
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiPropertyOptional({
    description: "Descripción opcional de la cohorte",
    example: "Sesión enfocada en líderes con experiencia previa",
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: "Fecha de inicio de la cohorte",
    example: "2025-03-10T08:00:00.000Z",
  })
  @IsDateString()
  fechaInicio: string;

  @ApiPropertyOptional({
    description: "Fecha estimada de finalización",
    example: "2025-06-12T08:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  fechaFinEstimada?: string;

  @ApiPropertyOptional({
    description: "Configuración avanzada de la cohorte",
    example: {
      modoAcceso: "secuencial",
      permitirSaltarNiveles: false,
    },
  })
  @IsOptional()
  @IsObject()
  configuracion?: Record<string, any>;

  @ApiPropertyOptional({
    description: "ID del instructor asignado",
    example: "user:instructor_demo",
  })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiPropertyOptional({
    description: "Capacidad máxima de estudiantes",
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  capacidadMaxima?: number;

  @ApiPropertyOptional({
    description: "Activar automáticamente la cohorte al crearla",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoActivate?: boolean;
}
