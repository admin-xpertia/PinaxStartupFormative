import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  MinLength,
  Min,
} from "class-validator";

export class AddExerciseToProofPointRequestDto {
  @ApiProperty({
    description: "ID del template de ejercicio a utilizar",
    example: "exercise_template:crear-primera-variable",
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: "Nombre del ejercicio",
    example: "Crear variable de saludo",
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiPropertyOptional({
    description: "Descripción breve del ejercicio",
    example: 'Crea una variable llamada saludo con el texto "Hola Mundo"',
  })
  @IsOptional()
  @IsString()
  descripcionBreve?: string;

  @ApiProperty({
    description: "Consideraciones de contexto para el instructor",
    example:
      "Este es el primer ejercicio de la fase, los estudiantes no tienen experiencia previa",
  })
  @IsString()
  consideracionesContexto: string;

  @ApiProperty({
    description: "Configuración personalizada del ejercicio",
    type: "object",
    example: {
      lenguaje: "python",
      complejidad: "basico",
      tiempoSugerido: 15,
    },
  })
  @IsObject()
  configuracionPersonalizada: Record<string, any>;

  @ApiProperty({
    description: "Duración estimada en minutos",
    example: 30,
    minimum: 5,
  })
  @IsNumber()
  @Min(5)
  duracionEstimadaMinutos: number;

  @ApiPropertyOptional({
    description: "Es obligatorio completar este ejercicio",
    example: true,
    default: true,
  })
  @IsOptional()
  esObligatorio?: boolean;
}
