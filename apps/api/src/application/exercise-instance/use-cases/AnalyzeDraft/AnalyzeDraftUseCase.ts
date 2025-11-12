import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { IExerciseContentRepository } from "../../../../domain/exercise-instance/repositories/IExerciseContentRepository";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import { OpenAIService } from "../../../../infrastructure/ai/OpenAIService";
import { AnalyzeDraftRequest, AnalyzeDraftResponse } from "./AnalyzeDraftDTO";

/**
 * AnalyzeDraftUseCase
 * Analyzes a student's draft text against the rubric criteria
 * and provides formative feedback
 *
 * Flow:
 * 1. Load exercise content
 * 2. Find the question by ID
 * 3. Extract the criteriosDeEvaluacion from the question
 * 4. Call OpenAI to analyze the draft against the criteria
 * 5. Return the suggestion
 */

@Injectable()
export class AnalyzeDraftUseCase
  implements ICommand<AnalyzeDraftRequest, AnalyzeDraftResponse>
{
  private readonly logger = new Logger(AnalyzeDraftUseCase.name);

  constructor(
    @Inject("IExerciseContentRepository")
    private readonly contentRepository: IExerciseContentRepository,
    private readonly openAIService: OpenAIService,
  ) {}

  async execute(
    request: AnalyzeDraftRequest,
  ): Promise<Result<AnalyzeDraftResponse, Error>> {
    try {
      this.logger.log(
        `🔍 Analyzing draft for exercise: ${request.exerciseInstanceId}, question: ${request.questionId}`,
      );

      // 1. Load exercise content
      const instanceId = RecordId.fromString(request.exerciseInstanceId);
      const content = await this.contentRepository.findByInstance(instanceId);

      if (!content) {
        return Result.fail(
          new Error(
            `Exercise content not found: ${request.exerciseInstanceId}`,
          ),
        );
      }

      // 2. Parse content and find the question
      const contenidoGenerado = content.getContenido();
      const { question, criterios } = this.findQuestionAndCriteria(
        contenidoGenerado,
        request.questionId,
      );

      if (!question) {
        return Result.fail(
          new Error(`Question not found: ${request.questionId}`),
        );
      }

      if (!criterios || criterios.length === 0) {
        return Result.fail(
          new Error(
            `No evaluation criteria found for question: ${request.questionId}`,
          ),
        );
      }

      // 3. Build prompt for AI analysis
      const systemPrompt = `Eres un tutor educativo experto que proporciona feedback formativo y constructivo.

Tu rol es:
- Analizar el borrador del estudiante contra los criterios de evaluación
- Identificar fortalezas en el trabajo actual
- Sugerir mejoras específicas y accionables
- Mantener un tono motivador y positivo
- Proporcionar feedback que ayude al estudiante a pensar más profundamente

IMPORTANTE:
- NO resuelvas el ejercicio por el estudiante
- NO des respuestas directas
- SÍ haz preguntas que guíen el pensamiento
- SÍ señala qué aspectos están bien encaminados
- SÍ sugiere áreas específicas donde profundizar`;

      const userPrompt = `Analiza el siguiente borrador del estudiante:

PREGUNTA:
${question.pregunta || question.enunciado || ""}

CRITERIOS DE EVALUACIÓN (RÚBRICA):
${criterios.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}

BORRADOR DEL ESTUDIANTE:
${request.draftText}

Proporciona feedback formativo en formato JSON con esta estructura:
{
  "suggestion": "Un párrafo de feedback general constructivo",
  "strengths": ["Fortaleza 1", "Fortaleza 2"],
  "improvements": ["Área de mejora 1", "Área de mejora 2"],
  "rubricAlignment": número entre 0-100 indicando qué tan alineado está con los criterios
}`;

      // 4. Call OpenAI
      this.logger.debug("Calling OpenAI for draft analysis");
      const { content: aiResponse } = await this.openAIService.generateChatResponse({
        systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: 800,
        responseFormat: { type: "json_object" },
      });

      // 5. Parse AI response
      let analysis: AnalyzeDraftResponse;
      try {
        const parsed = JSON.parse(aiResponse);
        analysis = {
          questionId: request.questionId,
          suggestion: parsed.suggestion || "Continúa desarrollando tu respuesta.",
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          rubricAlignment: parsed.rubricAlignment || 50,
        };
      } catch (error) {
        this.logger.error("Failed to parse AI response", error);
        // Fallback response
        analysis = {
          questionId: request.questionId,
          suggestion: aiResponse || "Continúa desarrollando tu respuesta con más detalle.",
          strengths: [],
          improvements: [],
          rubricAlignment: 50,
        };
      }

      this.logger.log(`✅ Draft analysis completed for question ${request.questionId}`);
      return Result.ok(analysis);
    } catch (error) {
      this.logger.error("❌ Error analyzing draft", error);
      return Result.fail(
        new Error(`Failed to analyze draft: ${error.message}`),
      );
    }
  }

  /**
   * Helper method to find a question and its evaluation criteria
   * from the exercise content
   */
  private findQuestionAndCriteria(
    contenido: any,
    questionId: string,
  ): { question: any; criterios: string[] } {
    let question: any = null;
    let criterios: string[] = [];

    try {
      // For Cuaderno de Trabajo exercises
      if (contenido.secciones && Array.isArray(contenido.secciones)) {
        for (const seccion of contenido.secciones) {
          if (seccion.prompts && Array.isArray(seccion.prompts)) {
            // Search in section prompts
            for (const prompt of seccion.prompts) {
              const promptId = this.generatePromptId(prompt);
              if (promptId === questionId || prompt.id === questionId) {
                question = prompt;
                criterios = prompt.criteriosDeEvaluacion || [];
                break;
              }
            }
          }

          // Also check section-level criteria if question is found in this section
          if (question && seccion.criteriosDeEvaluacion) {
            criterios = [
              ...criterios,
              ...seccion.criteriosDeEvaluacion,
            ];
          }
        }
      }

      // For Leccion Interactiva and other exercise types with preguntas
      if (!question && contenido.preguntas && Array.isArray(contenido.preguntas)) {
        question = contenido.preguntas.find(
          (p: any) => p.id === questionId,
        );
        if (question) {
          criterios = question.criteriosDeEvaluacion || question.criteriosEvaluacion || [];
        }
      }

      // Fallback to general evaluation criteria if no specific criteria found
      if (criterios.length === 0 && contenido.criterios_evaluacion) {
        criterios = contenido.criterios_evaluacion;
      }
    } catch (error) {
      this.logger.error(
        "Error finding question and criteria",
        error,
      );
    }

    return { question, criterios };
  }

  /**
   * Generate a consistent ID for prompts that might not have explicit IDs
   */
  private generatePromptId(prompt: any): string {
    if (prompt.id) return prompt.id;
    // Fallback: use question text hash or index
    const question = prompt.pregunta || prompt.enunciado || "";
    return question.substring(0, 30).replace(/\s+/g, "_");
  }
}
