import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

enum CasoEstudioTipo {
  EXITO = "exito",
  FRACASO = "fracaso",
  COMPARACION = "comparacion",
}

enum RecursoReferenciaTipo {
  PAPER = "paper",
  LIBRO = "libro",
  VIDEO = "video",
  HERRAMIENTA = "herramienta",
  PODCAST = "podcast",
  OTRO = "otro",
}

enum NivelImportanciaCriterio {
  CRITICO = "critico",
  IMPORTANTE = "importante",
  DESEABLE = "deseable",
}

class ConceptoClaveDto {
  @ApiProperty({
    description: "Identificador único (uuid)",
    example: "concepto-123",
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: "Nombre del concepto clave" })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ description: "Definición formal del concepto" })
  @IsString()
  @IsNotEmpty()
  definicion!: string;

  @ApiProperty({ description: "Ejemplo práctico del concepto" })
  @IsString()
  @IsNotEmpty()
  ejemplo!: string;

  @ApiProperty({
    description: "Lista de términos relacionados",
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  terminos_relacionados!: string[];
}

class CasoEstudioDto {
  @ApiProperty({
    description: "Identificador único (uuid)",
    example: "caso-123",
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: "Título del caso de estudio" })
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @ApiProperty({
    description: "Tipo de caso de estudio",
    enum: CasoEstudioTipo,
  })
  @IsEnum(CasoEstudioTipo)
  tipo!: CasoEstudioTipo;

  @ApiProperty({ description: "Descripción del caso de estudio" })
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiProperty({ description: "Fuente de referencia del caso de estudio" })
  @IsString()
  @IsNotEmpty()
  fuente!: string;

  @ApiProperty({
    description: "Conceptos que ilustra este caso de estudio",
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  conceptos_ilustrados!: string[];
}

class ErrorComunDto {
  @ApiProperty({
    description: "Identificador único (uuid)",
    example: "error-123",
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: "Título del error común" })
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @ApiProperty({ description: "Explicación de por qué ocurre este error" })
  @IsString()
  @IsNotEmpty()
  explicacion!: string;

  @ApiProperty({ description: "Recomendaciones para evitar el error" })
  @IsString()
  @IsNotEmpty()
  como_evitar!: string;
}

class RecursoReferenciaDto {
  @ApiProperty({
    description: "Identificador único (uuid)",
    example: "recurso-123",
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: "Título del recurso de referencia" })
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @ApiProperty({
    description: "Tipo de recurso de referencia",
    enum: RecursoReferenciaTipo,
  })
  @IsEnum(RecursoReferenciaTipo)
  tipo!: RecursoReferenciaTipo;

  @ApiProperty({ description: "URL del recurso de referencia" })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url!: string;

  @ApiProperty({
    description: "Notas sobre el recurso de referencia",
    default: "",
  })
  @IsString()
  notas!: string;
}

class CriterioEvaluacionDto {
  @ApiProperty({
    description: "Identificador único (uuid)",
    example: "criterio-123",
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: "Nombre del criterio de evaluación" })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ description: "Descriptor del criterio" })
  @IsString()
  @IsNotEmpty()
  descriptor!: string;

  @ApiProperty({
    description: "Nivel de importancia del criterio",
    enum: NivelImportanciaCriterio,
  })
  @IsEnum(NivelImportanciaCriterio)
  nivel_importancia!: NivelImportanciaCriterio;
}

export class UpdateFaseDocDto {
  @ApiProperty({
    description: "ID de la fase (sin prefijo o con prefijo fase:)",
  })
  @IsString()
  @IsNotEmpty()
  fase_id!: string;

  @ApiProperty({
    description: "Contexto general de la fase",
    minLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(200)
  contexto!: string;

  @ApiProperty({
    description: "Conceptos clave necesarios para la fase",
    type: [ConceptoClaveDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptoClaveDto)
  conceptos_clave!: ConceptoClaveDto[];

  @ApiProperty({
    description: "Casos de estudio que ilustran la fase",
    type: [CasoEstudioDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CasoEstudioDto)
  casos_estudio!: CasoEstudioDto[];

  @ApiProperty({
    description: "Errores comunes en la fase",
    type: [ErrorComunDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ErrorComunDto)
  errores_comunes!: ErrorComunDto[];

  @ApiProperty({
    description: "Recursos externos de referencia",
    type: [RecursoReferenciaDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecursoReferenciaDto)
  recursos_referencia!: RecursoReferenciaDto[];

  @ApiProperty({
    description: "Criterios de evaluación aplicables",
    type: [CriterioEvaluacionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioEvaluacionDto)
  criterios_evaluacion!: CriterioEvaluacionDto[];

  @ApiProperty({
    description: "Nivel de completitud calculado para la documentación",
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completitud?: number;
}
