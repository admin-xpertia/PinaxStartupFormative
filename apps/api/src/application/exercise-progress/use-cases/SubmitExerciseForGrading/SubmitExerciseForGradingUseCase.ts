import { Inject, Injectable, Logger } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { SurrealDbService } from "../../../../core/database/surrealdb.service";
import { OpenAIService } from "../../../../infrastructure/ai/OpenAIService";

type ExerciseSubmissionStatus =
  | "not_started"
  | "in_progress"
  | "submitted_for_review"
  | "pending_review"
  | "requires_iteration"
  | "approved"
  | "graded";

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

      const normalizedStatus = this.normalizeStatusFromRecord(progress);
      if (this.isSubmissionLockedStatus(normalizedStatus)) {
        return Result.fail(
          new Error(
            "Esta entrega ya fue enviada o calificada y solo puede visualizarse.",
          ),
        );
      }

      const storedDatos = this.parseJsonField(
        progress.datos_guardados ?? progress.datos,
        null,
      );

      const submissionData = request.datos ?? storedDatos ?? null;

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

      let feedbackValue: Record<string, any>;
      try {
        feedbackValue = this.normalizeFeedbackForStorage(
          aiJudgement.feedback,
          aiJudgement.score,
        );
      } catch (error) {
        this.logger.warn(
          "No se pudo normalizar el feedback de IA, guardando datos crudos",
          error instanceof Error ? error.message : error,
        );
        const fallbackScore = Math.max(
          0,
          Math.min(100, Number(aiJudgement.score) || 0),
        );
        feedbackValue = {
          summary: "Análisis completado.",
          strengths: [],
          improvements: [],
          rubricAlignment: fallbackScore,
          raw: aiJudgement.feedback ?? {},
          generated_at: new Date().toISOString(),
          ai_version: "v1",
        };
      }

      try {
        this.logger.log(
          `Guardando Feedback: ${JSON.stringify(feedbackValue)}`,
        );
      } catch (logError) {
        this.logger.log(
          `Guardando Feedback (sin stringify por error: ${logError})`,
        );
      }

      const finalScoreForRecord =
        typeof progress.final_score === "number"
          ? progress.final_score
          : typeof progress.score_final === "number"
            ? progress.score_final
            : aiJudgement.score ?? 0;

      // FIX: Serializar objetos complejos como JSON strings para evitar problemas con SurrealDB
      const feedbackStr = JSON.stringify(feedbackValue);
      const datosStr = JSON.stringify(submissionData);

      const updateResult = await this.db.query(
        `
        UPDATE type::thing($progressId) MERGE {
          estado: 'pendiente_revision',
          status: 'pending_review',
          porcentaje_completitud: 100,
          submitted_at: time::now(),
          ai_score: $aiScore,
          final_score: $finalScore,
          graded_at: time::now(),
          feedback_json: $feedbackStr,
          feedback_data: $feedbackStr,
          datos_guardados: $datosStr,
          tiempo_invertido_minutos: $tiempoInvertido,
          updated_at: time::now()
        } RETURN AFTER
      `,
        {
          progressId: progress.id,
          aiScore: aiJudgement.score,
          finalScore: finalScoreForRecord,
          feedbackStr: feedbackStr,
          datosStr: datosStr,
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
        feedback: feedbackValue,
        status: updated.status ?? "pending_review",
        submittedAt: updated.submitted_at,
      });
    } catch (error) {
      this.logger.error("Error enviando ejercicio a calificación", error);
      return Result.fail(error as Error);
    }
  }

  private parseJsonField(payload: any, fallback: any = null): any {
    if (payload === undefined || payload === null) {
      return fallback;
    }

    if (typeof payload === "string") {
      const trimmed = payload.trim();
      if (!trimmed) {
        return fallback;
      }
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        this.logger.warn(
          `[SubmitExerciseForGrading] No se pudo parsear JSON`,
          error instanceof Error ? error.message : error,
        );
        return fallback;
      }
    }

    if (typeof payload === "object") {
      try {
        return JSON.parse(JSON.stringify(payload));
      } catch (error) {
        this.logger.warn(
          `[SubmitExerciseForGrading] No se pudo clonar payload`,
          error instanceof Error ? error.message : error,
        );
        return payload;
      }
    }

    return fallback;
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

    const contentResult = await this.db.query(query, {
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

  private normalizeStatusFromRecord(progress: any): ExerciseSubmissionStatus {
    const mapped = this.normalizeStatusFromString(progress?.status);
    if (mapped) {
      return mapped;
    }
    return this.mapEstadoToStatus(progress?.estado);
  }

  private normalizeStatusFromString(
    status?: string | null,
  ): ExerciseSubmissionStatus | null {
    switch (status) {
      case "not_started":
      case "in_progress":
      case "pending_review":
      case "submitted_for_review":
      case "requires_iteration":
      case "approved":
      case "graded":
        if (status === "submitted_for_review") {
          return "pending_review";
        }
        if (status === "approved") {
          return "graded";
        }
        return status;
      default:
        return null;
    }
  }

  private mapEstadoToStatus(
    estado?: string | null,
  ): ExerciseSubmissionStatus {
    switch (estado) {
      case "no_iniciado":
        return "not_started";
      case "en_progreso":
        return "in_progress";
      case "pendiente_revision":
        return "pending_review";
      case "revision_requerida":
        return "requires_iteration";
      case "completado":
        return "graded";
      default:
        return "not_started";
    }
  }

  private isSubmissionLockedStatus(
    status: ExerciseSubmissionStatus,
  ): boolean {
    return status === "pending_review" || status === "graded";
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
      maxTokens: 7500,
      responseFormat: { type: "json_object" },
    });

    try {
      const parsed = JSON.parse(aiResponse.content);
      const score = Math.max(
        0,
        Math.min(100, Number(parsed.score) || Number(parsed.rubricAlignment) || 0),
      );

      const summaryString =
        parsed.summary ||
        parsed.suggestion ||
        parsed.ai_analysis ||
        "Análisis automático generado para tu entrega.";

      const aiAnalysisString =
        typeof parsed.ai_analysis === "string"
          ? parsed.ai_analysis
          : summaryString;

      return {
        score,
        feedback: {
          summary: summaryString,
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          rubricAlignment: Math.max(
            0,
            Math.min(100, Number(parsed.rubricAlignment) || score),
          ),
          notes: parsed.notes || "",
          ai_analysis: aiAnalysisString,
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
          ai_analysis: aiResponse.content || "Análisis automático no disponible.",
          raw: aiResponse.content,
        },
      };
    }
  }

  private normalizeFeedbackForStorage(
    feedback: Record<string, any> | null | undefined,
    score: number,
  ): Record<string, any> {
    // 1. Asegurar un objeto base válido
    const rawData = feedback || {};

    // 2. Valores por defecto garantizados (evita undefined)
    const summary = rawData.summary || rawData.ai_analysis || rawData.suggestion || "Análisis completado.";
    const strengths = Array.isArray(rawData.strengths) ? rawData.strengths : [];
    const improvements = Array.isArray(rawData.improvements) ? rawData.improvements : [];
    const rubricAlignment = Number(rawData.rubricAlignment ?? rawData.score ?? score) || 0;

    // 3. Retornar objeto plano y completo
    return {
      summary: String(summary),
      strengths: strengths.map(String), // Asegurar que sean strings
      improvements: improvements.map(String),
      rubricAlignment: Math.max(0, Math.min(100, rubricAlignment)),

      // Campos para compatibilidad futura
      ai_analysis: String(summary),
      ai_strengths: strengths,
      ai_improvements: improvements,

      // Guardar SIEMPRE la data cruda como respaldo
      raw: rawData,

      // Metadatos para depuración
      generated_at: new Date().toISOString(),
      ai_version: "v1"
    };
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
