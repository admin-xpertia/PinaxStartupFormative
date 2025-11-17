import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { IExerciseInstanceRepository } from "../../../../domain/exercise-instance/repositories/IExerciseInstanceRepository";
import { IExerciseContentRepository } from "../../../../domain/exercise-instance/repositories/IExerciseContentRepository";
import { IExerciseTemplateRepository } from "../../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository";
import { OpenAIService } from "../../../../infrastructure/ai/OpenAIService";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import {
  SimulateRoleplayRequest,
  SimulateRoleplayResponse,
} from "./SimulateRoleplayDTO";

/**
 * SimulateRoleplayUseCase
 *
 * Manages AI-powered roleplay interactions where the student practices
 * communication or negotiation with a simulated character.
 *
 * The AI maintains:
 * - Character personality and role consistency
 * - Emotional state tracking
 * - Hidden evaluation of success criteria
 * - Context-aware responses
 */
@Injectable()
export class SimulateRoleplayUseCase
  implements ICommand<SimulateRoleplayRequest, SimulateRoleplayResponse>
{
  private readonly logger = new Logger(SimulateRoleplayUseCase.name);

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
    request: SimulateRoleplayRequest,
  ): Promise<Result<SimulateRoleplayResponse, Error>> {
    try {
      this.logger.log(
        `🎭 Processing roleplay interaction for exercise: ${request.exerciseInstanceId}`,
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

      // 4. Extract character configuration from content
      const contentData = content.getContenido();
      const characterConfig = this.extractCharacterConfig(contentData);

      if (!characterConfig) {
        return Result.fail(
          new Error("Character configuration not found in exercise content"),
        );
      }

      // 5. Build AI system prompt
      const systemPrompt = this.buildRoleplaySystemPrompt(
        characterConfig,
        contentData,
      );

      // 6. Build user messages (history + current)
      const messages = this.buildConversationMessages(
        request.conversationHistory || [],
        request.userMessage,
      );

      // 7. Call OpenAI for character response
      this.logger.debug("Requesting AI roleplay response...");
      const aiResponse = await this.openAIService.generateChatResponse({
        systemPrompt,
        messages,
        maxTokens: 1000,
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

      // 9. Extract and validate response fields
      const response: SimulateRoleplayResponse = {
        reply: parsedResponse.reply || parsedResponse.respuesta || "",
        objectivesMet:
          parsedResponse.objectives_met || parsedResponse.objetivos_cumplidos || [],
        emotionalState:
          parsedResponse.emotional_state ||
          parsedResponse.estado_emocional ||
          "neutral",
        evaluation: parsedResponse.evaluation || parsedResponse.evaluacion || {},
        shouldEnd: parsedResponse.should_end || parsedResponse.debe_finalizar || false,
      };

      this.logger.log(
        `✅ Roleplay interaction complete. Objectives met: ${response.objectivesMet.length}`,
      );

      return Result.ok(response);
    } catch (error) {
      this.logger.error("❌ Failed to process roleplay interaction", error);
      return Result.fail(error as Error);
    }
  }

  /**
   * Extracts character configuration from exercise content
   */
  private extractCharacterConfig(contentData: any): any {
    // Check different possible content structures
    if (contentData.personaje_ia) {
      return contentData.personaje_ia;
    }

    if (contentData.personaje) {
      return contentData.personaje;
    }

    if (contentData.character) {
      return contentData.character;
    }

    // Try to find in nested estructura_ejercicio
    if (contentData.estructura_ejercicio?.personaje_ia) {
      return contentData.estructura_ejercicio.personaje_ia;
    }

    return null;
  }

  /**
   * Builds the system prompt for roleplay character
   */
  private buildRoleplaySystemPrompt(
    characterConfig: any,
    contentData: any,
  ): string {
    const nombre = characterConfig.nombre || characterConfig.name || "un personaje";
    const rol = characterConfig.rol || characterConfig.role || "interlocutor";
    const personalidad =
      characterConfig.personalidad || characterConfig.personality || "neutral";
    const tono = characterConfig.tono || characterConfig.tone || "profesional";

    // Extract success criteria
    const criterios =
      contentData.criterios_exito ||
      contentData.success_criteria ||
      contentData.objetivos ||
      [];

    const criteriosText = Array.isArray(criterios)
      ? criterios.map((c: any, i: number) => `${i + 1}. ${typeof c === "string" ? c : c.descripcion || c.description}`).join("\n")
      : "";

    return `Eres ${nombre}, un ${rol}.

PERSONALIDAD: ${personalidad}
TONO: ${tono}

${characterConfig.contexto || characterConfig.context || ""}

OBJETIVO DEL ESTUDIANTE:
${contentData.objetivo_estudiante || contentData.student_objective || "Practicar comunicación efectiva"}

CRITERIOS DE ÉXITO (evalúa en silencio, sin mencionar al estudiante):
${criteriosText}

INSTRUCCIONES:
1. Mantente en personaje en todo momento
2. Responde de manera natural y consistente con tu personalidad
3. Evalúa internamente si el estudiante cumple con los criterios de éxito
4. Tu estado emocional debe evolucionar basado en las acciones del estudiante
5. SIEMPRE devuelve tu respuesta en formato JSON con esta estructura:
{
  "reply": "tu respuesta al estudiante",
  "objectives_met": [números de criterios cumplidos, ej: [1, 3]],
  "emotional_state": "tu estado emocional actual (ej: neutral, interesado, molesto, entusiasmado)",
  "evaluation": {
    "criterio_1": true/false,
    "criterio_2": true/false,
    "puntaje_general": 0.0-1.0,
    "notas_internas": "observaciones sobre el desempeño"
  },
  "should_end": false (true si la conversación debe terminar naturalmente)
}

IMPORTANTE:
- Sé realista y coherente con el rol
- No seas demasiado fácil ni demasiado difícil
- Proporciona pistas sutiles si el estudiante está atascado
- Si el estudiante hace algo inapropiado o fuera de contexto, reacciona en personaje`;
  }

  /**
   * Builds conversation messages array for OpenAI
   */
  private buildConversationMessages(
    history: Array<{ role: string; content: string }>,
    currentMessage: string,
  ): Array<{ role: "user" | "assistant"; content: string }> {
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Add history (limit to last 10 messages for token efficiency)
    const recentHistory = history.slice(-10);
    recentHistory.forEach((msg) => {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    });

    // Add current user message
    messages.push({
      role: "user",
      content: currentMessage,
    });

    return messages;
  }
}
