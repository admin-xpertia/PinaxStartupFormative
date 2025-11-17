import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { IExerciseInstanceRepository } from "../../../../domain/exercise-instance/repositories/IExerciseInstanceRepository";
import { IExerciseContentRepository } from "../../../../domain/exercise-instance/repositories/IExerciseContentRepository";
import { IExerciseTemplateRepository } from "../../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository";
import { OpenAIService } from "../../../../infrastructure/ai/OpenAIService";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import {
  ProcessSimulationTurnRequest,
  ProcessSimulationTurnResponse,
} from "./ProcessSimulationTurnDTO";

/**
 * ProcessSimulationTurnUseCase
 *
 * Handles turn-based environment simulations where student actions
 * affect numerical variables and trigger narrative events.
 *
 * Think of it as a "Game Master" that:
 * - Receives player action
 * - Calculates consequences on variables (budget, morale, time, etc.)
 * - Generates narrative description
 * - Triggers random or conditional events
 * - Checks win/loss conditions
 *
 * Examples:
 * - Business simulation (budget, market share, team morale)
 * - Project management (time, resources, stakeholder satisfaction)
 * - Negotiation scenarios (trust levels, deal progress)
 */
@Injectable()
export class ProcessSimulationTurnUseCase
  implements
    ICommand<ProcessSimulationTurnRequest, ProcessSimulationTurnResponse>
{
  private readonly logger = new Logger(ProcessSimulationTurnUseCase.name);

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
    request: ProcessSimulationTurnRequest,
  ): Promise<Result<ProcessSimulationTurnResponse, Error>> {
    try {
      this.logger.log(
        `🎮 Processing simulation turn for exercise: ${request.exerciseInstanceId}`,
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

      // 3. Extract simulation configuration
      const contentData = content.getContenido();
      const simulationConfig = this.extractSimulationConfig(contentData);

      if (!simulationConfig) {
        return Result.fail(
          new Error(
            "Simulation configuration not found in exercise content",
          ),
        );
      }

      // 4. Build system prompt for Game Master AI
      const systemPrompt = this.buildSimulationSystemPrompt(
        simulationConfig,
        contentData,
      );

      // 5. Build user prompt with action and current state
      const userPrompt = this.buildSimulationUserPrompt(
        request.action,
        request.currentState,
        simulationConfig,
      );

      // 6. Call OpenAI for simulation processing
      this.logger.debug("Requesting AI simulation processing...");
      const aiResponse = await this.openAIService.generateChatResponse({
        systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: 1500,
        responseFormat: { type: "json_object" },
      });

      // 7. Parse AI response
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(aiResponse.content);
      } catch (error) {
        this.logger.error("Failed to parse AI response as JSON", error);
        return Result.fail(new Error("Invalid AI response format"));
      }

      // 8. Validate and normalize state updates
      const updatedState = this.validateState(
        parsedResponse.estado_actualizado || parsedResponse.updated_state || {},
        simulationConfig.variables_iniciales || simulationConfig.initial_variables,
      );

      // 9. Build response
      const response: ProcessSimulationTurnResponse = {
        narrativa: parsedResponse.narrativa || parsedResponse.narrative || "",
        estadoActualizado: updatedState,
        eventos: parsedResponse.eventos || parsedResponse.events || [],
        finalizado: parsedResponse.finalizado || parsedResponse.finished || false,
        resultado: parsedResponse.resultado || parsedResponse.result || undefined,
      };

      this.logger.log(
        `✅ Simulation turn processed. Finished: ${response.finalizado}`,
      );

      return Result.ok(response);
    } catch (error) {
      this.logger.error("❌ Failed to process simulation turn", error);
      return Result.fail(error as Error);
    }
  }

  /**
   * Extracts simulation configuration from exercise content
   */
  private extractSimulationConfig(contentData: any): any {
    if (contentData.simulacion) {
      return contentData.simulacion;
    }

    if (contentData.simulation) {
      return contentData.simulation;
    }

    if (contentData.estructura_ejercicio?.simulacion) {
      return contentData.estructura_ejercicio.simulacion;
    }

    return null;
  }

  /**
   * Builds system prompt for simulation Game Master
   */
  private buildSimulationSystemPrompt(
    simulationConfig: any,
    contentData: any,
  ): string {
    const tipoEntorno =
      simulationConfig.tipo_entorno ||
      simulationConfig.environment_type ||
      "simulación empresarial";

    const reglas =
      simulationConfig.reglas ||
      simulationConfig.rules ||
      "Aplica lógica realista";

    const variablesInfo = this.buildVariablesDescription(
      simulationConfig.variables_iniciales ||
        simulationConfig.initial_variables ||
        {},
    );

    const eventosInfo = this.buildEventsDescription(
      simulationConfig.eventos_posibles ||
        simulationConfig.possible_events ||
        [],
    );

    const condicionesVictoria =
      simulationConfig.condiciones_victoria ||
      simulationConfig.victory_conditions ||
      [];

    const condicionesDerrota =
      simulationConfig.condiciones_derrota ||
      simulationConfig.defeat_conditions ||
      [];

    return `Eres el Game Master de una simulación de ${tipoEntorno}.

REGLAS DE LA SIMULACIÓN:
${reglas}

VARIABLES DEL SISTEMA:
${variablesInfo}

EVENTOS POSIBLES:
${eventosInfo}

CONDICIONES DE VICTORIA:
${Array.isArray(condicionesVictoria) ? condicionesVictoria.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n") : condicionesVictoria}

CONDICIONES DE DERROTA:
${Array.isArray(condicionesDerrota) ? condicionesDerrota.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n") : condicionesDerrota}

TU ROL:
1. Recibir la acción del estudiante
2. Calcular el impacto numérico en las variables
3. Generar una narrativa descriptiva de lo que sucedió (2-4 oraciones)
4. Determinar si ocurre algún evento especial (basado en probabilidades o condiciones)
5. Verificar si se cumplen condiciones de victoria o derrota

PRINCIPIOS:
- Sé realista en los cálculos de impacto
- Los cambios deben ser proporcionales a la acción
- Incluye consecuencias secundarias (ej: invertir en marketing aumenta visibilidad pero reduce presupuesto)
- Genera eventos inesperados ocasionalmente para mantener interés
- Mantén consistencia narrativa

FORMATO DE RESPUESTA:
Devuelve SIEMPRE un JSON con esta estructura exacta:
{
  "narrativa": "Descripción de lo que ocurrió (2-4 oraciones)",
  "estado_actualizado": {
    "variable1": nuevo_valor,
    "variable2": nuevo_valor
  },
  "eventos": [
    {
      "tipo": "oportunidad|crisis|neutral",
      "mensaje": "Descripción del evento",
      "impacto": {"variable": cambio} // opcional
    }
  ],
  "finalizado": false,
  "resultado": null // o { "tipo": "exito|fracaso|neutro", "mensaje": "...", "puntajeFinal": 85 }
}

IMPORTANTE:
- Todos los valores de variables deben ser números
- Si una variable tiene un máximo/mínimo, respétalo
- Si la simulación termina (victoria/derrota), set "finalizado": true y llena "resultado"`;
  }

  /**
   * Builds description of simulation variables
   */
  private buildVariablesDescription(variables: Record<string, any>): string {
    return Object.entries(variables)
      .map(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          const min = value.min !== undefined ? ` (mín: ${value.min}` : "";
          const max = value.max !== undefined ? `, máx: ${value.max})` : min ? ")" : "";
          const desc = value.descripcion || value.description || "";
          return `- ${key}: ${value.inicial || value.initial}${min}${max} ${desc ? `- ${desc}` : ""}`;
        }
        return `- ${key}: ${value}`;
      })
      .join("\n");
  }

  /**
   * Builds description of possible events
   */
  private buildEventsDescription(events: any[]): string {
    if (!Array.isArray(events) || events.length === 0) {
      return "No hay eventos especiales configurados.";
    }

    return events
      .map((event: any, i: number) => {
        const tipo = event.tipo || event.type || "neutral";
        const desc = event.descripcion || event.description || "";
        const prob = event.probabilidad || event.probability || "variable";
        return `${i + 1}. [${tipo}] ${desc} (prob: ${prob})`;
      })
      .join("\n");
  }

  /**
   * Builds user prompt with action and state
   */
  private buildSimulationUserPrompt(
    action: string,
    currentState: Record<string, any>,
    simulationConfig: any,
  ): string {
    const stateJson = JSON.stringify(currentState, null, 2);

    return `ESTADO ACTUAL DE LA SIMULACIÓN:
${stateJson}

ACCIÓN DEL ESTUDIANTE:
${action}

Procesa esta acción y devuelve el resultado en formato JSON según las instrucciones.`;
  }

  /**
   * Validates and normalizes state values
   */
  private validateState(
    updatedState: Record<string, any>,
    initialVariables: Record<string, any>,
  ): Record<string, any> {
    const validated: Record<string, any> = { ...updatedState };

    // Apply min/max constraints if defined
    Object.entries(initialVariables).forEach(([key, config]) => {
      if (validated[key] !== undefined && typeof config === "object") {
        if (config.min !== undefined && validated[key] < config.min) {
          validated[key] = config.min;
        }
        if (config.max !== undefined && validated[key] > config.max) {
          validated[key] = config.max;
        }
      }
    });

    return validated;
  }
}
