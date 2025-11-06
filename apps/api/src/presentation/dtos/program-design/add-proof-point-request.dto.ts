import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, MinLength, Min, IsArray } from 'class-validator';

export class AddProofPointRequestDto {
  @ApiProperty({
    description: 'Nombre del proof point',
    example: 'Crear mi primera variable',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiProperty({
    description: 'Slug para URL (se genera automáticamente si no se provee)',
    example: 'crear-mi-primera-variable',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    description: 'Descripción del proof point',
    example: 'Aprender a declarar y usar variables en JavaScript',
  })
  @IsString()
  descripcion: string;

  @ApiProperty({
    description: 'Pregunta central que responde este proof point',
    example: '¿Cómo declaro y uso variables en JavaScript?',
  })
  @IsString()
  preguntaCentral: string;

  @ApiProperty({
    description: 'Duración estimada en horas',
    example: 2,
    minimum: 0.5,
  })
  @IsNumber()
  @Min(0.5)
  duracionEstimadaHoras: number;

  @ApiPropertyOptional({
    description: 'Tipo de entregable final',
    example: 'código',
  })
  @IsOptional()
  @IsString()
  tipoEntregableFinal?: string;

  @ApiPropertyOptional({
    description: 'Documentación de contexto para IA',
    example: 'Variables son contenedores de datos. En JavaScript se usan let, const, var.',
  })
  @IsOptional()
  @IsString()
  documentacionContexto?: string;

  @ApiPropertyOptional({
    description: 'IDs de proof points prerequisitos',
    type: [String],
    example: ['proof_point:prereq123'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisitos?: string[];
}
