import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export enum LessonQuestionTypeEnum {
  RespuestaCorta = "respuesta_corta",
  MultipleChoice = "multiple_choice",
  VerdaderoFalso = "verdadero_falso",
}

export class LessonQuestionEvaluationDto {
  @ApiProperty({
    description: "Identificador interno de la pregunta",
    example: "question-2",
  })
  @IsString()
  preguntaId: string;

  @ApiProperty({
    description: "Tipo de pregunta",
    enum: LessonQuestionTypeEnum,
  })
  @IsEnum(LessonQuestionTypeEnum)
  tipoPregunta: LessonQuestionTypeEnum;

  @ApiProperty({
    description: "Texto completo del enunciado",
  })
  @IsString()
  enunciado: string;

  @ApiProperty({
    description: "Respuesta proporcionada por el estudiante",
  })
  @IsString()
  respuestaEstudiante: string;

  @ApiProperty({
    description:
      "Criterios de evaluación específicos definidos por el LLM al generar la pregunta",
    example: {
      correcto: [
        "Menciona que el experimento reduce incertidumbre",
        "Explica qué validación busca",
      ],
      parcialmente_correcto: [
        "Describe el experimento pero no ata a hipótesis",
      ],
    },
  })
  @IsObject()
  criteriosEvaluacion: Record<string, any>;

  @ApiProperty({
    description: "Contenido textual de la sección donde vive la pregunta",
  })
  @IsString()
  seccionContenido: string;

  @ApiPropertyOptional({
    description: "Título de la sección (para contexto en feedback)",
  })
  @IsOptional()
  @IsString()
  seccionTitulo?: string;

  @ApiPropertyOptional({
    description: "Perfil de comprensión del estudiante",
    example: {
      nivelActual: "principiante",
      erroresRecurrentes: ["confundir problema con solución"],
    },
  })
  @IsOptional()
  @IsObject()
  perfilComprension?: Record<string, any>;
}

export class LessonQuestionEvaluationResponseDto {
  @ApiProperty({
    description: "Identificador de la pregunta evaluada",
  })
  preguntaId: string;

  @ApiProperty({
    description: "Score global devuelto por el modelo",
    enum: ["correcto", "parcialmente_correcto", "incorrecto"],
  })
  score: "correcto" | "parcialmente_correcto" | "incorrecto";

  @ApiProperty({
    description: "Feedback específico señalando evidencias",
  })
  feedback: string;

  @ApiPropertyOptional({
    description: "Sugerencias o próximos pasos recomendados",
    type: [String],
  })
  @IsOptional()
  sugerencias?: string[];
}
