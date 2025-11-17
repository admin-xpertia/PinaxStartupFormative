import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { IExerciseInstanceRepository } from "../../../../domain/exercise-instance/repositories/IExerciseInstanceRepository";
import { IExerciseContentRepository } from "../../../../domain/exercise-instance/repositories/IExerciseContentRepository";
import { IExerciseTemplateRepository } from "../../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository";
import { OpenAIService } from "../../../../infrastructure/ai/OpenAIService";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import {
  GetSocraticGuidanceRequest,
  GetSocraticGuidanceResponse,
} from "./GetSocraticGuidanceDTO";

/**
 * GetSocraticGuidanceUseCase
 *
 * Provides Socratic mentorship to students without giving away answers.
 * Uses AI to analyze student work and provide guiding questions rather than solutions.
 *
 * Key principles:
 * - Never solve problems directly
 * - Ask probing questions
 * - Guide towards deeper thinking
 * - Reference relevant concepts without explaining everything
 */
@Injectable()
export class GetSocraticGuidanceUseCase
  implements
    ICommand<GetSocraticGuidanceRequest, GetSocraticGuidanceResponse>
{
  private readonly logger = new Logger(GetSocraticGuidanceUseCase.name);

  constructor(
    @Inject("IExerciseInstanceRepository")
    private readonly instanceRepository: IExerciseInstanceRepository,
    @Inject("IExerciseContentRepository")
    private readonly contentRepository: IExerciseContentRepository,
    @Inject("IExerciseTemplateRepository")
    private readonly templateRepository: IExerciseTemplateRepository,
    private readonly openAIService: OpenAIService,
  ) {}

  async execute(
    request: GetSocraticGuidanceRequest,
  ): Promise<Result<GetSocraticGuidanceResponse, Error>> {
    try {
      this.logger.log(
        `🧠 Providing Socratic guidance for exercise: ${request.exerciseInstanceId}`,
      );

      // 1. Load exercise instance
      const instanceId = RecordId.fromString(request.exerciseInstanceId);
      const instance = await this.instanceRepository.findById(instanceId);

      if (!instance) {
        return Result.fail(
          new Error(
            `Exercise instance not found: ${request.exerciseInstanceId}`,
          ),
        );
      }

      // 2. Load exercise content
      const content = await this.contentRepository.findByInstance(instanceId);

      if (!content) {
        return Result.fail(
          new Error(
            `Exercise content not found for: ${request.exerciseInstanceId}`,
          ),
        );
      }

      // 3. Load template
      const template = await this.templateRepository.findById(
        instance.getTemplate(),
      );

      if (!template) {
        return Result.fail(
          new Error(`Template not found: ${instance.getTemplate().toString()}`),
        );
      }

      // 4. Extract mentor configuration
      const contentData = content.getContenido();
      const mentorConfig = this.extractMentorConfig(contentData);

      // 5. Build system prompt
      const systemPrompt = this.buildMentorSystemPrompt(
        mentorConfig,
        contentData,
        request.context,
      );

      // 6. Build user prompt with student's work
      const userPrompt = this.buildMentorUserPrompt(request);

      // 7. Call OpenAI for Socratic guidance
      this.logger.debug("Requesting Socratic guidance from AI...");
      const aiResponse = await this.openAIService.generateChatResponse({
        systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: 800,
        responseFormat: { type: "json_object" },
      });

      // 8. Parse AI response
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(aiResponse.content);
      } catch (error) {
        this.logger.error("Failed to parse AI response as JSON", error);
        return Result.fail(new Error("Invalid AI response format"));
      }

      // 9. Build response
      const response: GetSocraticGuidanceResponse = {
        guidance: parsedResponse.guidance || parsedResponse.guia || "",
        followUpQuestions:
          parsedResponse.follow_up_questions ||
          parsedResponse.preguntas_seguimiento ||
          [],
        references:
          parsedResponse.references || parsedResponse.referencias || [],
        encouragementLevel:
          parsedResponse.encouragement_level ||
          parsedResponse.nivel_animo ||
          "medium",
      };

      this.logger.log("✅ Socratic guidance generated successfully");

      return Result.ok(response);
    } catch (error) {
      this.logger.error("❌ Failed to generate Socratic guidance", error);
      return Result.fail(error as Error);
    }
  }

  /**
   * Extracts mentor configuration from exercise content
   */
  private extractMentorConfig(contentData: any): any {
    const defaultConfig = {
      nombre: "Mentor IA",
      especialidad: "emprendimiento e innovación",
      estilo: "socrático",
    };

    if (contentData.mentor_ia) {
      return { ...defaultConfig, ...contentData.mentor_ia };
    }

    if (contentData.mentor) {
      return { ...defaultConfig, ...contentData.mentor };
    }

    return defaultConfig;
  }

  /**
   * Builds system prompt for Socratic mentor
   */
  private buildMentorSystemPrompt(
    mentorConfig: any,
    contentData: any,
    context?: GetSocraticGuidanceRequest["context"],
  ): string {
    const nombre = mentorConfig.nombre || "Mentor IA";
    const especialidad =
      mentorConfig.especialidad || "emprendimiento e innovación";
    const estilo = mentorConfig.estilo || "socrático";

    return `Eres ${nombre}, un experto en ${especialidad}.

ESTILO DE MENTORÍA: ${estilo}

TU ROL:
- Guiar al estudiante hacia sus propias conclusiones mediante preguntas
- NO proporcionar respuestas directas o soluciones completas
- Analizar el trabajo del estudiante y señalar áreas de mejora sutilmente
- Hacer preguntas que profundicen su reflexión
- Proporcionar referencias a conceptos relevantes sin explicarlos completamente

CONTEXTO DEL EJERCICIO:
${contentData.objetivo || contentData.objective || "Completar el ejercicio exitosamente"}

${context?.stepTitle ? `PASO ACTUAL: ${context.stepTitle}` : ""}
${context?.stepDescription ? `Descripción: ${context.stepDescription}` : ""}

PRINCIPIOS CLAVE:
1. Nunca resuelvas el problema por el estudiante
2. Si la respuesta es superficial, pregunta "¿Por qué?" o "¿Cómo lo sabes?"
3. Si está confuso, pide clarificación o reformulación
4. Si está atascado, da una pista indirecta mediante analogías o ejemplos generales
5. Reconoce fortalezas específicas antes de sugerir mejoras
6. Mantén un tono motivador pero honesto

FORMATO DE RESPUESTA:
Devuelve siempre un JSON con esta estructura:
{
  "guidance": "tu guía principal (2-3 oraciones máximo)",
  "follow_up_questions": ["pregunta 1", "pregunta 2"] (1-3 preguntas para profundizar),
  "references": ["referencia opcional a conceptos/lecciones previas"],
  "encouragement_level": "low|medium|high" (basado en qué tan bien va el estudiante)
}

IMPORTANTE:
- Sé conciso y directo
- Evita jerga innecesaria
- Adapta tu nivel de ayuda según el contexto (si es el primer intento, sé más guiador; si es el tercero, sé más directo sobre qué está fallando)`;
  }

  /**
   * Builds user prompt with student's current work
   */
  private buildMentorUserPrompt(request: GetSocraticGuidanceRequest): string {
    const stepInfo = request.currentStep
      ? `\n\nPaso actual: ${request.currentStep}`
      : "";

    const attemptInfo =
      request.context?.previousAttempts !== undefined
        ? `\n\nNúmero de intentos previos: ${request.context.previousAttempts}`
        : "";

    return `El estudiante está trabajando en este ejercicio y ha solicitado ayuda.${stepInfo}${attemptInfo}

Su borrador/trabajo actual:
"""
${request.studentInput}
"""

Proporciona guía socrática para ayudarle a mejorar sin darle la respuesta directa.`;
  }
}
