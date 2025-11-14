import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import {
  IProgramRepository,
  IFaseRepository,
  IProofPointRepository,
} from "../../../../domain/program-design/repositories/IProgramRepository";
import { IExerciseTemplateRepository } from "../../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository";
import { OpenAIService } from "../../../../infrastructure/ai/OpenAIService";
import {
  RecommendExercisePlanCommand,
  RecommendExercisePlanResponse,
  ExerciseRecommendation,
  ProofPointContext,
} from "./RecommendExercisePlanDTO";

/**
 * RecommendExercisePlanUseCase
 * Uses AI to analyze proof points and recommend a sequence of exercises
 *
 * Framework-based approach:
 * - Understands the 6-phase Threshold Concepts framework
 * - Maps exercises to phases (Activate, Dissonance, Present, Practice, Transfer, Produce/Reflect)
 * - Addresses misconceptions and barriers directly
 */
@Injectable()
export class RecommendExercisePlanUseCase
  implements ICommand<RecommendExercisePlanCommand, RecommendExercisePlanResponse>
{
  private readonly logger = new Logger(RecommendExercisePlanUseCase.name);

  constructor(
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
    @Inject("IFaseRepository")
    private readonly faseRepository: IFaseRepository,
    @Inject("IProofPointRepository")
    private readonly proofPointRepository: IProofPointRepository,
    @Inject("IExerciseTemplateRepository")
    private readonly templateRepository: IExerciseTemplateRepository,
    private readonly openAIService: OpenAIService,
  ) {}

  async execute(
    command: RecommendExercisePlanCommand,
  ): Promise<Result<RecommendExercisePlanResponse, Error>> {
    try {
      this.logger.log(
        `Generating exercise recommendations for program ${command.programId}`,
      );

      // 1. Validate program exists
      const programId = RecordId.fromString(command.programId);
      const programa = await this.programRepository.findById(programId);

      if (!programa) {
        return Result.fail(
          new Error(`Program not found: ${command.programId}`),
        );
      }

      // 2. Get all fases and proof points
      const fases = await this.faseRepository.findByPrograma(programId);

      if (fases.length === 0) {
        return Result.fail(new Error("Program has no phases"));
      }

      // Get all proof points from all fases
      const allProofPoints: any[] = [];
      for (const fase of fases) {
        const proofPoints = await this.proofPointRepository.findByFase(
          fase.getId(),
        );
        allProofPoints.push(...proofPoints);
      }

      if (allProofPoints.length === 0) {
        return Result.fail(new Error("Program has no proof points"));
      }

      // 3. Get all available templates
      const templates = await this.templateRepository.findAll();

      if (templates.length === 0) {
        return Result.fail(
          new Error("No exercise templates available in the catalog"),
        );
      }

      this.logger.debug(`Found ${templates.length} available templates`);

      // 4. Generate recommendations for each proof point with context
      const allRecommendations: ExerciseRecommendation[] = [];

      for (const proofPoint of allProofPoints) {
        const ppId = proofPoint.getId().toString();
        const context = command.proofPointContexts[ppId];

        // Skip proof points without context
        if (!context) {
          this.logger.debug(`Skipping proof point ${ppId} - no context provided`);
          continue;
        }

        // Skip if both fields are empty
        if (
          !context.concepcionesErroneas?.trim() &&
          !context.barrerasConceptuales?.trim()
        ) {
          this.logger.debug(`Skipping proof point ${ppId} - empty context`);
          continue;
        }

        this.logger.log(
          `Generating recommendations for proof point: ${proofPoint.getNombre()}`,
        );

        // Call AI to generate recommendations for this proof point
        const recommendations = await this.generateRecommendationsForProofPoint(
          proofPoint,
          context,
          templates,
        );

        allRecommendations.push(...recommendations);
      }

      this.logger.log(
        `Generated ${allRecommendations.length} total recommendations`,
      );

      return Result.ok({
        recommendations: allRecommendations,
      });
    } catch (error) {
      this.logger.error("Failed to recommend exercise plan", error);
      return Result.fail(error as Error);
    }
  }

  /**
   * Generate exercise recommendations for a single proof point using AI
   */
  private async generateRecommendationsForProofPoint(
    proofPoint: any,
    context: ProofPointContext,
    templates: any[],
  ): Promise<ExerciseRecommendation[]> {
    // Build the system prompt
    const systemPrompt = this.buildSystemPrompt(templates);

    // Build the user prompt with proof point context
    const userPrompt = this.buildUserPrompt(proofPoint, context);

    this.logger.debug("System Prompt:");
    this.logger.debug(systemPrompt);
    this.logger.debug("User Prompt:");
    this.logger.debug(userPrompt);

    // Call OpenAI
    const response = await this.openAIService.generateChatResponse({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4000,
      responseFormat: { type: "json_object" },
    });

    // Parse the JSON response
    let aiResponse: any;
    try {
      aiResponse = JSON.parse(response.content);
    } catch (parseError) {
      this.logger.error("Failed to parse AI response as JSON", parseError);
      this.logger.debug("Raw AI response:", response.content);
      throw new Error("AI returned invalid JSON response");
    }

    // Validate and map the response
    const recommendations: ExerciseRecommendation[] = [];

    if (aiResponse.exercises && Array.isArray(aiResponse.exercises)) {
      for (const exercise of aiResponse.exercises) {
        try {
          const recommendation = this.mapAIResponseToRecommendation(
            exercise,
            proofPoint.getId().toString(),
          );
          recommendations.push(recommendation);
        } catch (mappingError) {
          this.logger.warn(
            "Failed to map AI exercise recommendation",
            mappingError,
          );
          // Continue with other recommendations
        }
      }
    }

    return recommendations;
  }

  /**
   * Build the system prompt for the AI
   */
  private buildSystemPrompt(templates: any[]): string {
    const templateList = templates
      .filter((t) => t.isActivo())
      .map((t) => ({
        id: t.getId().toString(),
        nombre: t.getNombre(),
        categoria: t.getCategoria(),
        objetivo: t.getObjetivoPedagogico(),
      }));

    return `Eres un experto en diseño instruccional que usa el framework de 'Conceptos Umbral' (Threshold Concepts).

Este framework tiene 6 fases pedagógicas:
1. **Activar**: Conectar con conocimiento previo y experiencias
2. **Disonancia**: Exponer y confrontar concepciones erróneas
3. **Presentar**: Introducir formalmente el nuevo concepto
4. **Practicar**: Aplicar en contextos controlados
5. **Transferir**: Aplicar en nuevos contextos y situaciones
6. **Producir/Reflejar**: Crear entregables y reflexionar metacognitivamente

**Templates de Ejercicio Disponibles:**
${JSON.stringify(templateList, null, 2)}

**Tu Tarea:**
1. Diseña una secuencia pedagógica de 3 a 5 ejercicios para el proof point dado
2. La secuencia debe cubrir las fases del framework en orden lógico
3. Configura cada ejercicio para abordar DIRECTAMENTE las concepciones erróneas y barreras conceptuales
4. Selecciona templates apropiados para cada fase del aprendizaje

**Formato de Salida (JSON):**
Devuelve un objeto JSON con esta estructura:
{
  "exercises": [
    {
      "templateId": "template:xxx",
      "nombre": "Nombre del Ejercicio",
      "descripcionBreve": "Breve descripción",
      "consideracionesContexto": "Cómo este ejercicio aborda las concepciones erróneas...",
      "configuracionPersonalizada": {},
      "duracionEstimadaMinutos": 30,
      "esObligatorio": true,
      "_templateNombre": "Lección Interactiva",
      "_fasePatron": "Fase 2: Disonancia",
      "_proposito": "Para confrontar la idea errónea de que..."
    }
  ]
}

IMPORTANTE:
- Devuelve SOLO JSON válido, sin texto adicional
- Cada ejercicio debe tener todos los campos requeridos
- configuracionPersonalizada puede estar vacío {} si no hay configuración específica`;
  }

  /**
   * Build the user prompt with proof point context
   */
  private buildUserPrompt(
    proofPoint: any,
    context: ProofPointContext,
  ): string {
    return `**Proof Point (Concepto Umbral):**
- **Nombre:** ${proofPoint.getNombre()}
- **Descripción:** ${proofPoint.getDescripcion() || "No especificada"}
- **Pregunta Central:** ${proofPoint.getPreguntaCentral() || "No especificada"}

**Contexto Pedagógico:**
- **Concepciones Erróneas Comunes:** ${context.concepcionesErroneas || "No especificadas"}
- **Barreras Conceptuales:** ${context.barrerasConceptuales || "No especificadas"}

Genera una secuencia de ejercicios (3-5) que ayude a los estudiantes a superar estas concepciones erróneas y barreras conceptuales, siguiendo las fases del framework de Conceptos Umbral.`;
  }

  /**
   * Map AI response to ExerciseRecommendation
   */
  private mapAIResponseToRecommendation(
    aiExercise: any,
    proofPointId: string,
  ): ExerciseRecommendation {
    // Validate required fields
    if (!aiExercise.templateId) {
      throw new Error("Missing templateId in AI response");
    }

    if (!aiExercise.nombre) {
      throw new Error("Missing nombre in AI response");
    }

    return {
      proofPointId,
      templateId: aiExercise.templateId,
      nombre: aiExercise.nombre,
      descripcionBreve: aiExercise.descripcionBreve || undefined,
      consideracionesContexto:
        aiExercise.consideracionesContexto ||
        "Generado automáticamente por IA",
      configuracionPersonalizada: aiExercise.configuracionPersonalizada || {},
      duracionEstimadaMinutos: aiExercise.duracionEstimadaMinutos || 30,
      esObligatorio: aiExercise.esObligatorio !== false, // Default to true
      _templateNombre: aiExercise._templateNombre || "Ejercicio",
      _fasePatron: aiExercise._fasePatron || "Fase desconocida",
      _proposito: aiExercise._proposito || "Sin propósito especificado",
    };
  }
}
