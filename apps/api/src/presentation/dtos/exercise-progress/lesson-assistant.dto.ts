import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class LessonAssistantHistoryMessageDto {
  @ApiProperty({
    description: "Rol del mensaje",
    enum: ["user", "assistant"],
    example: "user",
  })
  @IsIn(["user", "assistant"])
  role: "user" | "assistant";

  @ApiProperty({
    description: "Contenido del mensaje",
    example: "¿Puedes explicarme de nuevo el concepto de ventaja injusta?",
  })
  @IsString()
  content: string;
}

export class LessonAssistantRequestDto {
  @ApiProperty({
    description: "Pregunta o mensaje del estudiante",
    example:
      "¿Cuál es la diferencia entre una hipótesis y un insight accionable?",
  })
  @IsString()
  pregunta: string;

  @ApiProperty({
    description: "Identificador de la sección actualmente visible",
    example: "section-mindset",
  })
  @IsString()
  seccionId: string;

  @ApiProperty({
    description: "Título de la sección actualmente visible",
    example: "Mindset emprendedor vs. mindset corporativo",
  })
  @IsString()
  seccionTitulo: string;

  @ApiProperty({
    description:
      "Contenido completo de la sección en texto plano/Markdown para que el asistente tenga contexto",
    example:
      "### Mindset emprendedor\nEl mindset emprendedor se caracteriza por...",
  })
  @IsString()
  seccionContenido: string;

  @ApiPropertyOptional({
    description: "Historial de mensajes previos (máximo 10)",
    type: [LessonAssistantHistoryMessageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonAssistantHistoryMessageDto)
  historial?: LessonAssistantHistoryMessageDto[];

  @ApiPropertyOptional({
    description:
      "Perfil de comprensión del estudiante basado en sus respuestas previas",
    example: {
      nivelActual: "intermedio",
      conceptosDominados: ["oportunidades vs problemas"],
      conceptosPendientes: ["marcos de priorización"],
      tonoPreferido: "socratico",
    },
  })
  @IsOptional()
  @IsObject()
  perfilComprension?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      "Concepto o término específico que disparó la pregunta (si aplica)",
    example: "tasa de conversión implícita",
  })
  @IsOptional()
  @IsString()
  conceptoFocal?: string;

  @ApiPropertyOptional({
    description:
      "Prompt del sistema opcional para sobreescribir el comportamiento por defecto del asistente.",
  })
  @IsOptional()
  @IsString()
  systemPromptOverride?: string;

  @ApiPropertyOptional({
    description:
      "Criterios de éxito para simulaciones de interacción (Shadow Monitor)",
    example: [
      {
        id: "criterio_1",
        descripcion: "Mostrar empatía genuina",
        rubrica_evaluacion: "El estudiante hace preguntas abiertas y valida emociones",
      },
    ],
  })
  @IsOptional()
  @IsArray()
  criteriosExito?: Array<{
    id: string;
    descripcion: string;
    rubrica_evaluacion?: string;
  }>;

  @ApiPropertyOptional({
    description:
      "IDs de criterios ya cumplidos (para evitar re-evaluarlos)",
    example: ["criterio_1"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  criteriosCumplidos?: string[];

  @ApiPropertyOptional({
    description:
      "Configuración del Shadow Monitor (activación, frecuencia, etc.)",
    example: {
      activado: true,
      frecuencia_turnos: 2,
    },
  })
  @IsOptional()
  @IsObject()
  shadowMonitorConfig?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      "Criterios de evaluación semántica para pasos de mentor (validación)",
    example: [
      "Identifica al menos 3 riesgos financieros",
      "Propone estrategias de mitigación concretas",
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  criteriosValidacion?: string[];

  @ApiPropertyOptional({
    description:
      "Umbral de calidad para validación semántica (1-5)",
    example: 3,
  })
  @IsOptional()
  umbralCalidad?: number;

  @ApiPropertyOptional({
    description:
      "Contador actual de insights (para metacognición)",
    example: 2,
  })
  @IsOptional()
  insightCount?: number;
}

export class LessonAssistantResponseDto {
  @ApiProperty({
    description: "Respuesta completa del asistente contextual a la sección",
  })
  @IsString()
  respuesta: string;

  @ApiPropertyOptional({
    description:
      "Conceptos o secciones citadas explícitamente para referencia del estudiante",
    example: [
      "Mindset emprendedor vs corporativo",
      "Actividad: mapa de hipótesis",
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  referencias?: string[];

  @ApiPropertyOptional({
    description: "Tokens usados en la respuesta (diagnóstico)",
    example: 820,
  })
  @IsOptional()
  tokensUsados?: number;

  @ApiPropertyOptional({
    description:
      "Resultados del Shadow Monitor (evaluación de criterios)",
    example: {
      metCriteriaIds: ["criterio_1"],
      qualityScores: { criterio_1: 4 },
      internalFeedback: "El estudiante demostró empatía genuina",
    },
  })
  @IsOptional()
  shadowMonitorResult?: {
    metCriteriaIds: string[];
    qualityScores: Record<string, number>;
    internalFeedback: string;
  };

  @ApiPropertyOptional({
    description:
      "Resultado de validación semántica (para mentor steps)",
    example: {
      isValid: true,
      qualityScore: 4,
      feedback: "Respuesta completa y bien fundamentada",
      missingAspects: [],
    },
  })
  @IsOptional()
  validationResult?: {
    isValid: boolean;
    qualityScore: number;
    feedback: string;
    missingAspects: string[];
  };

  @ApiPropertyOptional({
    description:
      "Insights detectados (para metacognición)",
    example: {
      insightCount: 3,
      latestInsight: "Me di cuenta que aprendo mejor con ejemplos visuales",
      detectedInsights: ["Aprendo mejor con ejemplos visuales"],
    },
  })
  @IsOptional()
  insightsResult?: {
    insightCount: number;
    latestInsight: string | null;
    detectedInsights: string[];
  };
}
