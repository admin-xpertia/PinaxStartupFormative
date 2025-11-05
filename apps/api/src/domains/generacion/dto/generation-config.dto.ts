import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum TipoComponente {
  LECCION = "leccion",
  CUADERNO = "cuaderno",
  SIMULACION = "simulacion",
  HERRAMIENTA = "herramienta",
}

export enum EstiloNarrativo {
  ACADEMICO = "academico",
  CONVERSACIONAL = "conversacional",
  NARRATIVO = "narrativo",
  SOCRATICO = "socratico",
}

export enum TipoPregunta {
  REFLEXION = "reflexion",
  APLICACION = "aplicacion",
  ANALISIS = "analisis",
  SINTESIS = "sintesis",
}

export enum PersonalidadPersonaje {
  COOPERATIVO = "cooperativo",
  ESCEPTICO = "esceptico",
  OCUPADO = "ocupado",
  DETALLISTA = "detallista",
}

class PersonajeConfigDto {
  @ApiProperty({ description: "Nombre del personaje" })
  @IsString()
  nombre!: string;

  @ApiProperty({ description: "Rol que desempeña el personaje" })
  @IsString()
  rol!: string;

  @ApiProperty({ description: "Contexto o antecedentes del personaje" })
  @IsString()
  background!: string;

  @ApiProperty({ enum: PersonalidadPersonaje })
  @IsEnum(PersonalidadPersonaje)
  personalidad!: PersonalidadPersonaje;

  @ApiProperty({ description: "Estilo de comunicación del personaje" })
  @IsString()
  estilo_comunicacion!: string;
}

class EscenarioConfigDto {
  @ApiProperty({ description: "Contexto general del escenario" })
  @IsString()
  contexto_situacion!: string;

  @ApiProperty({ description: "Objetivo principal de la conversación" })
  @IsString()
  objetivo_conversacion!: string;

  @ApiProperty({ description: "Duración estimada en minutos" })
  @IsNumber()
  @Min(1)
  duracion_estimada!: number;

  @ApiProperty({ description: "Número de respuestas que se deben generar" })
  @IsNumber()
  @Min(1)
  numero_respuestas_generar!: number;
}

export class GenerationConfigDto {
  @ApiProperty({
    description: "ID de la fase asociada a la generación",
    example: "fase:abcd1234",
  })
  @IsString()
  faseId!: string;

  @ApiProperty({
    description: "ID del componente que solicita la generación",
    example: "componente:abcd1234",
  })
  @IsString()
  componenteId!: string;

  @ApiProperty({
    description: "Nombre del programa",
    example: "Programa de Innovación",
  })
  @IsString()
  programa_nombre!: string;

  @ApiProperty({
    description: "Nombre de la fase",
    example: "Fase 2 - Validación",
  })
  @IsString()
  fase_nombre!: string;

  @ApiProperty({
    description: "Nombre del proof point",
    example: "MVP Inicial",
  })
  @IsString()
  proof_point_nombre!: string;

  @ApiProperty({
    description: "Pregunta central del proof point",
    example: "¿Cómo validarías tu hipótesis de mercado?",
  })
  @IsString()
  proof_point_pregunta!: string;

  @ApiProperty({
    description: "Nombre del nivel actual",
    example: "Nivel 1 - Fundamentos",
  })
  @IsString()
  nivel_nombre!: string;

  @ApiProperty({
    description: "Objetivo pedagógico del nivel",
    example: "Comprender la importancia de validar hipótesis",
  })
  @IsString()
  nivel_objetivo!: string;

  @ApiPropertyOptional({ description: "Instrucciones adicionales para la IA" })
  @IsOptional()
  @IsString()
  instrucciones_adicionales?: string;

  @ApiProperty({
    description: "Conceptos que se deben enfatizar",
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  conceptos_enfatizar!: string[];

  @ApiProperty({
    description: "Casos de estudio o referencias que se deben incluir",
    type: [String],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  casos_incluir!: string[];

  @ApiProperty({
    description: "Tipo de componente a generar",
    enum: TipoComponente,
  })
  @IsEnum(TipoComponente)
  tipo_componente!: TipoComponente;

  @ApiProperty({
    description: "Nombre del componente a generar",
    example: "Lección 1 - Introducción al Mercado",
  })
  @IsString()
  nombre_componente!: string;

  @ApiPropertyOptional({
    description: "Nivel de profundidad deseado (1-5)",
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  nivel_profundidad?: number;

  @ApiPropertyOptional({
    description: "Estilo narrativo deseado",
    enum: EstiloNarrativo,
  })
  @IsOptional()
  @IsEnum(EstiloNarrativo)
  estilo_narrativo?: EstiloNarrativo;

  @ApiPropertyOptional({
    description: "Duración objetivo en minutos",
    minimum: 1,
    maximum: 240,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(240)
  duracion_target?: number;

  @ApiPropertyOptional({
    description: "Elementos que se deben incluir en la generación",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  elementos_incluir?: string[];

  @ApiPropertyOptional({
    description: "Ejemplos visuales que se deben incorporar",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ejemplos_visuales?: string[];

  @ApiPropertyOptional({
    description: "Número de secciones para cuadernos",
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  numero_secciones?: number;

  @ApiPropertyOptional({
    description: "Tipos de pregunta a generar",
    enum: TipoPregunta,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TipoPregunta, { each: true })
  tipos_pregunta?: TipoPregunta[];

  @ApiPropertyOptional({
    description: "Si las respuestas de ejemplo deben incluirse",
  })
  @IsOptional()
  @IsBoolean()
  incluir_ejemplos_respuesta?: boolean;

  @ApiPropertyOptional({
    description: "Nivel de guía deseado (1-5)",
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  nivel_guia?: number;

  @ApiPropertyOptional({
    description: "Configuración del personaje para simulaciones",
    type: PersonajeConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonajeConfigDto)
  personaje?: PersonajeConfigDto;

  @ApiPropertyOptional({
    description: "Configuración del escenario para simulaciones",
    type: EscenarioConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EscenarioConfigDto)
  escenario?: EscenarioConfigDto;

  @ApiPropertyOptional({
    description: "Habilidades que se deben evaluar",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  habilidades_evaluar?: string[];

  @ApiPropertyOptional({
    description: "Modelo de IA a utilizar",
    example: "gpt-4o-mini",
  })
  @IsOptional()
  @IsString()
  modelo_ia?: string;

  @ApiPropertyOptional({
    description: "Temperatura creativa del modelo (0-2)",
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperatura?: number;

  @ApiPropertyOptional({
    description: "Indica si se deben usar ejemplos few-shot",
  })
  @IsOptional()
  @IsBoolean()
  usar_few_shot?: boolean;
}
