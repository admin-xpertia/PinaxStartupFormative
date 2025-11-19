import { Inject, Injectable, Logger } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { SurrealDbService } from "../../../../core/database/surrealdb.service";
import { OpenAIService } from "../../../../infrastructure/ai/OpenAIService";

export interface SubmitExerciseForGradingRequest {
  exerciseInstanceId: string;
  estudianteId: string;
  cohorteId?: string | null;
  datos?: Record<string, any>;
  tiempoInvertidoMinutos?: number;
}

export interface SubmitExerciseForGradingResponse {
  id: string;
  aiScore: number;
  feedback: Record<string, any>;
  status: string;
  submittedAt: string;
}

@Injectable()
export class SubmitExerciseForGradingUseCase
  implements
    ICommand<SubmitExerciseForGradingRequest, SubmitExerciseForGradingResponse>
{
  private readonly logger = new Logger(SubmitExerciseForGradingUseCase.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly openAIService: OpenAIService,
  ) {}

  async execute(
    request: SubmitExerciseForGradingRequest,
  ): Promise<Result<SubmitExerciseForGradingResponse, Error>> {
    try {
      if (!request.exerciseInstanceId || !request.estudianteId) {
        return Result.fail(
          new Error("exerciseInstanceId y estudianteId son requeridos"),
        );
      }

      const progress = await this.findProgressRecord(
        request.exerciseInstanceId,
        request.estudianteId,
        request.cohorteId,
      );

      if (!progress) {
        return Result.fail(
          new Error("No existe un progreso para este ejercicio y estudiante"),
        );
      }

      const submissionData =
        request.datos ?? progress.datos_guardados ?? progress.datos ?? null;

      if (!submissionData) {
        return Result.fail(
          new Error(
            "No se encontró el trabajo del estudiante para enviar a calificación",
          ),
        );
      }

      const exerciseContent = await this.findExerciseContent(
        request.exerciseInstanceId,
      );
      const exerciseName = exerciseContent?.exercise?.nombre || "ejercicio";
      const criterios = this.extractEvaluationCriteria(
        exerciseContent?.contenido_generado,
      );
      const narrative = this.extractNarrative(exerciseContent?.contenido_generado);

      const aiJudgement = await this.generateAIScore({
        exerciseName,
        criterios,
        narrative,
        submissionData,
      });

      const updateResult = await this.db.query(
        `
        UPDATE type::thing($progressId) SET
          estado = 'pendiente_revision',
          status = 'pending_review',
          porcentaje_completitud = 100,
          submitted_at = time::now(),
          ai_score = $aiScore,
          feedback_json = $feedback,
          datos_guardados = $datos,
          tiempo_invertido_minutos = $tiempoInvertido,
          updated_at = time::now()
        RETURN AFTER
      `,
        {
          progressId: progress.id,
          aiScore: aiJudgement.score,
          feedback: aiJudgement.feedback,
          datos: submissionData,
          tiempoInvertido: Math.max(request.tiempoInvertidoMinutos ?? 0, 0),
        },
      );

      const updated = this.extractFirstRecord(updateResult);
      if (!updated) {
        return Result.fail(new Error("No se pudo actualizar el progreso"));
      }

      return Result.ok({
        id: updated.id,
        aiScore: aiJudgement.score,
        feedback: aiJudgement.feedback,
        status: updated.status ?? "pending_review",
        submittedAt: updated.submitted_at,
      });
    } catch (error) {
      this.logger.error("Error enviando ejercicio a calificación", error);
      return Result.fail(error as Error);
    }
  }

  private async findProgressRecord(
    exerciseInstanceId: string,
    estudianteId: string,
    cohorteId?: string | null,
  ): Promise<any | null> {
    const query = `
      SELECT * FROM exercise_progress
      WHERE exercise_instance = type::thing($exerciseId)
        AND estudiante = type::thing($estudianteId)
        ${cohorteId ? "AND cohorte = type::thing($cohorteId)" : ""}
      LIMIT 1
    `;

    const result = await this.db.query(query, {
      exerciseId: exerciseInstanceId,
      estudianteId,
      cohorteId,
    });

    return this.extractFirstRecord(result);
  }

  private async findExerciseContent(
    exerciseInstanceId: string,
  ): Promise<any | null> {
    const query = `
      SELECT * FROM exercise_content
      WHERE exercise_instance = type::thing($exerciseId)
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const [contentResult] = await this.db.query(query, {
      exerciseId: exerciseInstanceId,
    });

    const content = this.extractFirstRecord(contentResult);
    if (!content) {
      this.logger.warn(
        `Contenido no encontrado para ejercicio ${exerciseInstanceId}`,
      );
      return null;
    }

    return content;
  }

  private extractEvaluationCriteria(contenido: any): string[] {
    if (!contenido || typeof contenido !== "object") {
      return [];
    }

    const criterios: string[] = [];

    // Secciones de análisis (casos)
    if (Array.isArray(contenido.secciones_analisis)) {
      contenido.secciones_analisis.forEach((seccion: any) => {
        criterios.push(
          ...(seccion.criterios_evaluacion_ia || []),
          ...(seccion.criteriosEvaluacionIa || []),
          ...(seccion.criteriosDeEvaluacion || []),
        );
      });
    }

    // Cuadernos: criterios a nivel sección y prompt
    if (Array.isArray(contenido.secciones)) {
      contenido.secciones.forEach((seccion: any) => {
        criterios.push(...(seccion.criteriosDeEvaluacion || []));
        if (Array.isArray(seccion.prompts)) {
          seccion.prompts.forEach((prompt: any) => {
            criterios.push(...(prompt.criteriosDeEvaluacion || []));
          });
        }
      });
    }

    // Rubricas genéricas
    if (Array.isArray(contenido.rubrica)) {
      criterios.push(...contenido.rubrica);
    }
    if (Array.isArray(contenido.rubrica_evaluacion)) {
      criterios.push(...contenido.rubrica_evaluacion);
    }

    return criterios.filter((c) => typeof c === "string" && c.trim().length > 0);
  }

  private extractNarrative(contenido: any): string {
    if (!contenido || typeof contenido !== "object") {
      return "";
    }

    if (typeof contenido.narrativa_markdown === "string") {
      return contenido.narrativa_markdown;
    }

    if (typeof contenido.contexto === "string") {
      return contenido.contexto;
    }

    return "";
  }

  private async generateAIScore(params: {
    exerciseName: string;
    criterios: string[];
    narrative?: string;
    submissionData: Record<string, any>;
  }): Promise<{ score: number; feedback: Record<string, any> }> {
    const criteriosList =
      params.criterios.length > 0
        ? params.criterios.map((c, i) => `${i + 1}. ${c}`).join("\n")
        : "1. Claridad y relevancia de la respuesta\n2. Profundidad del análisis\n3. Calidad de la argumentación";

    const narrativeBlock = params.narrative
      ? `\nCONTEXTO / NARRATIVA:\n${params.narrative}\n`
      : "";

    const systemPrompt = `Eres un evaluador pedagógico que asigna una calificación numérica (0-100) y feedback estructurado.
Debes ser claro, consistente con la rúbrica y conciso en el razonamiento.`;

    const userPrompt = `Evalúa la siguiente entrega para el ejercicio "${params.exerciseName}".
${narrativeBlock}
Criterios de evaluación:
${criteriosList}

Entrega del estudiante (JSON):
${JSON.stringify(params.submissionData, null, 2)}

Devuelve SIEMPRE un JSON válido con la estructura:
{
  "score": numero entre 0 y 100,
  "summary": "Resumen breve del juicio de la IA",
  "strengths": ["punto fuerte 1", "punto fuerte 2"],
  "improvements": ["área de mejora 1", "área de mejora 2"],
  "rubricAlignment": numero entre 0 y 100,
  "notes": "observaciones opcionales"
}`;

    const aiResponse = await this.openAIService.generateChatResponse({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4000,
      responseFormat: { type: "json_object" },
    });

    try {
      const parsed = JSON.parse(aiResponse.content);
      const score = Math.max(
        0,
        Math.min(100, Number(parsed.score) || Number(parsed.rubricAlignment) || 0),
      );

      return {
        score,
        feedback: {
          summary:
            parsed.summary ||
            parsed.suggestion ||
            "Análisis automático generado para tu entrega.",
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          rubricAlignment: Math.max(
            0,
            Math.min(100, Number(parsed.rubricAlignment) || score),
          ),
          notes: parsed.notes || "",
          raw: parsed,
        },
      };
    } catch (error) {
      this.logger.warn("No se pudo parsear la respuesta de IA, usando fallback");
      return {
        score: 50,
        feedback: {
          summary: aiResponse.content || "Análisis automático no disponible.",
          strengths: [],
          improvements: [],
          rubricAlignment: 50,
          notes: "",
          raw: aiResponse.content,
        },
      };
    }
  }

  private extractFirstRecord(result: any): any | null {
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        return result[0][0];
      }
      if (!Array.isArray(result[0])) {
        return result[0];
      }
    }
    return null;
  }
}
