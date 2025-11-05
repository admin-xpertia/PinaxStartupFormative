import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PesoTotalValidator } from '../validators/peso-total.validator';

/**
 * Descriptor de una dimensión de evaluación.
 * Representa un nivel de logro dentro de la dimensión.
 */
export class DescriptorDto {
  @IsNotEmpty()
  @IsString()
  nivel!: string; // ej. "Excelente", "Bueno", "Regular", "Insuficiente"

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  puntos!: number;

  @IsNotEmpty()
  @IsString()
  descripcion!: string; // Criterio observable para este nivel
}

/**
 * Dimensión de evaluación de una rúbrica.
 */
export class DimensionDto {
  @IsNotEmpty()
  @IsString()
  nombre!: string; // ej. "Claridad de Ideas", "Uso de Evidencia"

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  peso!: number; // Peso porcentual (debe sumar 100 entre todas las dimensiones)

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DescriptorDto)
  descriptores!: DescriptorDto[]; // Lista de niveles de logro
}

/**
 * DTO para crear o actualizar una rúbrica.
 *
 * IMPORTANTE: La suma de los pesos de todas las dimensiones debe ser 100.
 * El validador customizado PesoTotalValidator verifica esto automáticamente.
 */
export class CrearRubricaDto {
  @IsNotEmpty()
  @IsString()
  componenteId!: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DimensionDto)
  @Validate(PesoTotalValidator, {
    message: 'La suma de los pesos de las dimensiones debe ser 100',
  })
  dimensiones!: DimensionDto[];

  @IsOptional()
  @IsBoolean()
  pesosValidados?: boolean;
}

/**
 * DTO para validar que los pesos de las dimensiones suman 100.
 */
export class ValidarPesosDto {
  @IsNotEmpty()
  @IsString()
  rubricaId!: string;
}
