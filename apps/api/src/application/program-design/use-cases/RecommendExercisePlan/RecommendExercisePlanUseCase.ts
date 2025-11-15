import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import {
  IProgramRepository,
  IFaseRepository,
  IProofPointRepository,
} from "../../../../domain/program-design/repositories/IProgramRepository";
import { Programa } from "../../../../domain/program-design/entities/Programa";
import { Fase } from "../../../../domain/program-design/entities/Fase";
import { ProofPoint } from "../../../../domain/program-design/entities/ProofPoint";
import { IExerciseTemplateRepository } from "../../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository";
import { ExerciseTemplate } from "../../../../domain/exercise-catalog/entities/ExerciseTemplate";
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
      const faseMap = new Map<string, Fase>();
      fases.forEach((fase) => faseMap.set(fase.getId().toString(), fase));

      if (fases.length === 0) {
        return Result.fail(new Error("Program has no phases"));
      }

      // Get all proof points from all fases
      const allProofPoints: ProofPoint[] = [];
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
        const fase = faseMap.get(proofPoint.getFase().toString());
        const recommendations =
          await this.generateRecommendationsForProofPoint(
            programa,
            fase,
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
    programa: Programa,
    fase: Fase | undefined,
    proofPoint: ProofPoint,
    context: ProofPointContext,
    templates: ExerciseTemplate[],
  ): Promise<ExerciseRecommendation[]> {
    // Build the system prompt
    const systemPrompt = this.buildSystemPrompt(templates);

    // Build the user prompt with proof point context
    const userPrompt = this.buildUserPrompt(programa, fase, proofPoint, context);

    this.logger.debug("System Prompt:");
    this.logger.debug(systemPrompt);
    this.logger.debug("User Prompt:");
    this.logger.debug(userPrompt);

    // Call OpenAI
    const response = await this.openAIService.generateChatResponse({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 16000,
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
            templates,
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
  private buildSystemPrompt(templates: ExerciseTemplate[]): string {
    const templateList = templates
      .filter((t) => t.isActivo())
      .map((t) => ({
        id: t.getId().toString(),
        nombre: t.getNombre(),
        categoria: t.getCategoria().getValue(),
        categoria_legible: t.getCategoria().getDisplayName(),
        objetivo: t.getObjetivoPedagogico(),
        descripcion: t.getDescripcion(),
        rolIA: t.getRolIA(),
        configuracionDefault: t.getConfiguracionDefault(),
        configuracionSchema: t.getConfiguracionSchema().getFields(),
      }));

    return `Eres un experto en diseño instruccional que usa el framework de 'Conceptos Umbral' (Threshold Concepts).

Este framework tiene 6 fases pedagógicas:
1. **Activar**: Conectar con conocimiento previo y experiencias
2. **Disonancia**: Exponer y confrontar concepciones erróneas
3. **Presentar**: Introducir formalmente el nuevo concepto
4. **Practicar**: Aplicar en contextos controlados
5. **Transferir**: Aplicar en nuevos contextos y situaciones
6. **Producir/Reflejar**: Crear entregables y reflexionar metacognitivamente

**Templates de Ejercicio Disponibles (con sus campos de configuración):**
${JSON.stringify(templateList, null, 2)}

**Tu Tarea:**
1. Diseña una secuencia pedagógica de 3 a 5 ejercicios para el proof point dado
2. La secuencia debe cubrir las fases del framework en orden lógico
3. Configura cada ejercicio para abordar DIRECTAMENTE las concepciones erróneas y barreras conceptuales
4. Selecciona templates apropiados para cada fase del aprendizaje
5. Para el campo \`templateId\`, usa EXACTAMENTE uno de los \`id\` listados arriba. (Ejemplo: "exercise_template:cuaderno-activacion")
6. Respeta los campos definidos en \`configuracionSchema\`. Usa \`configuracionDefault\` como punto de partida y RELLENA TODOS los campos requeridos con contenido específico (ej. lista de actividades, secciones de cuaderno, prompts concretos, checklists, etc.). No dejes estructuras vacías ni texto genérico.

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
- \`configuracionPersonalizada\` debe incluir la estructura COMPLETA que el template necesita (listas, objetos, campos booleanos, etc.). Si el template define secciones, pasos o checklists, crea contenido detallado.`;
  }

  /**
   * Build the user prompt with proof point context
   */
  private buildUserPrompt(
    programa: Programa,
    fase: Fase | undefined,
    proofPoint: ProofPoint,
    context: ProofPointContext,
  ): string {
    const programaObjetivosList = programa.getObjetivosAprendizaje() ?? [];
    const programaObjetivos =
      programaObjetivosList.length > 0
        ? programaObjetivosList.join("; ")
        : "No definidos";

    const faseDescripcion = fase?.getDescripcion() || "No especificada";
    const faseObjetivosList = fase?.getObjetivosAprendizaje() ?? [];
    const faseObjetivos =
      faseObjetivosList.length > 0 ? faseObjetivosList.join("; ") : "No definidos";

    return `Contexto del Programa:
- Nombre: ${programa.getNombre()}
- Descripción: ${programa.getDescripcion() || "No especificada"}
- Objetivos de aprendizaje generales: ${programaObjetivos}
- Nivel/Dificultad: ${programa.getNivelDificultad() || "No declarado"}
- Audiencia Objetivo: ${programa.getAudienciaObjetivo() || "No declarada"}

Fase actual:
- Nombre: ${
      fase
        ? `Fase ${fase.getNumeroFase()} - ${fase.getNombre()}`
        : "Proof point sin fase asignada"
    }
- Descripción de la fase: ${faseDescripcion}
- Objetivos/competencias de la fase: ${faseObjetivos}
- Duración estimada: ${
      fase ? `${fase.getDuracion().toWeeks()} semanas` : "No declarada"
    }

Proof Point que requiere ejercicios:
- Nombre: ${proofPoint.getNombre()}
- Pregunta central: ${proofPoint.getPreguntaCentral() || "No especificada"}
- Descripción detallada: ${proofPoint.getDescripcion() || "No especificada"}
- Documentación previa del instructor: ${proofPoint.getDocumentacionContexto() || "Sin documentación adicional"}
- Entregable/tipo de evidencia: ${proofPoint.getTipoEntregableFinal() || "No definido"}

Contexto pedagógico entregado por el instructor:
- Concepciones erróneas comunes: ${context.concepcionesErroneas || "No especificadas"}
- Barreras conceptuales: ${context.barrerasConceptuales || "No especificadas"}

Diseña una secuencia de 3 a 5 ejercicios que logre que el estudiante domine este proof point dentro del programa descrito. Cada ejercicio debe enlazar explícitamente con el propósito del proof point, cubrir diferentes fases del framework de Conceptos Umbral y detallar la configuración específica del template seleccionado (incluyendo secciones, prompts, checklists, rúbricas u otros campos requeridos).`;
  }

  /**
   * Map AI response to ExerciseRecommendation
   */
  private mapAIResponseToRecommendation(
    aiExercise: any,
    proofPointId: string,
    templates: ExerciseTemplate[],
  ): ExerciseRecommendation {
    const templateId = this.resolveTemplateId(aiExercise, templates);

    if (!templateId) {
      throw new Error("Missing templateId in AI response");
    }

    if (!aiExercise.nombre) {
      throw new Error("Missing nombre in AI response");
    }

    return {
      proofPointId,
      templateId,
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

  /**
   * Attempts to resolve the template ID returned by the AI, even if it used alternative keys.
   */
  private resolveTemplateId(
    aiExercise: any,
    templates: ExerciseTemplate[],
  ): string | null {
    const directId =
      aiExercise.templateId ||
      aiExercise.template_id ||
      aiExercise.templateID ||
      aiExercise.template ||
      aiExercise.templateSlug ||
      aiExercise.template_slug;

    if (typeof directId === "string" && directId.trim().length > 0) {
      return directId.trim();
    }

    const templateNameCandidate =
      aiExercise._templateNombre ||
      aiExercise.templateNombre ||
      aiExercise.templateName;

    if (typeof templateNameCandidate === "string") {
      const normalized = templateNameCandidate.trim().toLowerCase();
      if (normalized.length > 0) {
        const matchedTemplate = templates.find(
          (template) => template.getNombre().trim().toLowerCase() === normalized,
        );
        if (matchedTemplate) {
          return matchedTemplate.getId().toString();
        }
      }
    }

    return null;
  }
}
