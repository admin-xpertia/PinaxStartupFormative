import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { ExerciseTemplate } from "../../domain/exercise-catalog/entities/ExerciseTemplate";
import { ProofPoint } from "../../domain/program-design/entities/ProofPoint";
import { Fase } from "../../domain/program-design/entities/Fase";
import { Programa } from "../../domain/program-design/entities/Programa";
import { FaseDocumentation } from "../../domain/program-design/entities/FaseDocumentation";

/**
 * Request for generating exercise content
 */
export interface GenerateContentRequest {
  template: ExerciseTemplate;
  configuration: Record<string, any>;
  context: {
    programa: Programa;
    fase: Fase;
    proofPoint: ProofPoint;
    exerciseName: string;
    customContext?: string;
    faseDocumentation?: FaseDocumentation;
  };
}

/**
 * Response from content generation
 */
export interface GenerateContentResponse {
  content: Record<string, any>;
  tokensUsed: number;
  model: string;
  generatedAt: Date;
}

/**
 * OpenAI Service
 *
 * Integrates with OpenAI API to generate educational content
 * using GPT-4 or GPT-5 models.
 */
@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxCompletionTokens: number;
  private readonly initialCompletionTokens: number;
  private readonly completionRetryLimit: number;
  private readonly completionTokenMultiplier: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");

    if (!apiKey) {
      this.logger.error(
        "OPENAI_API_KEY no está configurada. La generación de contenido requiere credenciales reales.",
      );
      throw new Error("OPENAI_API_KEY is required to initialize OpenAIService");
    }

    this.client = new OpenAI({
      apiKey,
    });

    // Configuration
    this.model = this.configService.get<string>("OPENAI_MODEL") || "gpt-5-nano";
    const configuredMaxTokens =
      this.configService.get<number>("OPENAI_MAX_TOKENS");
    this.maxCompletionTokens =
      configuredMaxTokens && configuredMaxTokens > 0
        ? configuredMaxTokens
        : 42000;
    this.initialCompletionTokens = Math.min(
      this.configService.get<number>("OPENAI_INITIAL_COMPLETION_TOKENS") ||
        36000,
      this.maxCompletionTokens,
    );
    this.completionRetryLimit =
      this.configService.get<number>("OPENAI_COMPLETION_MAX_RETRIES") || 2;
    this.completionTokenMultiplier =
      this.configService.get<number>("OPENAI_COMPLETION_TOKEN_MULTIPLIER") || 2;

    this.logger.log(`🤖 OpenAI Service initialized`);
    this.logger.log(`   Model: ${this.model}`);
    this.logger.log(`   Max Tokens: ${this.maxCompletionTokens}`);
  }

  /**
   * Generates exercise content using OpenAI
   */
  async generateExerciseContent(
    request: GenerateContentRequest,
  ): Promise<GenerateContentResponse> {
    try {
      this.logger.log(
        `📝 Generating content for exercise: ${request.context.exerciseName}`,
      );
      this.logger.debug(`   Template: ${request.template.getNombre()}`);
      this.logger.debug(`   Category: ${request.template.getCategoria()}`);

      // Build the prompt
      const systemPrompt = this.buildSystemPrompt(request);
      const userPrompt = this.buildUserPrompt(request);

      this.logger.debug("🔧 System Prompt:");
      this.logger.debug(systemPrompt);
      this.logger.debug("💬 User Prompt:");
      this.logger.debug(userPrompt);

      // Call OpenAI
      const startTime = Date.now();
      const { response, rawContent } = await this.requestStructuredCompletion(
        systemPrompt,
        userPrompt,
      );

      const duration = Date.now() - startTime;

      this.logger.log(`✅ Content generated in ${duration}ms`);
      this.logger.debug(
        `   Tokens used: ${response.usage?.total_tokens || "unknown"}`,
      );
      this.logger.debug(`   Model: ${response.model}`);

      // Debug the response structure
      const message = response.choices[0]?.message;
      this.logger.debug(
        `   Message structure: content=${!!message?.content}, parsed=${!!(message as any)?.parsed}`,
      );

      this.logger.debug(
        `   Extracted content length: ${rawContent?.length || 0}`,
      );

      if (!rawContent) {
        this.logger.error(
          "   Full response:",
          JSON.stringify(response, null, 2),
        );
        throw new Error("OpenAI returned empty content");
      }

      // Parse and validate response
      let content: Record<string, any>;
      try {
        content = JSON.parse(rawContent);
      } catch (parseError) {
        this.logger.error(
          "Failed to parse JSON content from OpenAI",
          parseError,
        );
        this.logger.debug(`Raw OpenAI content: ${rawContent}`);
        throw new Error("OpenAI returned invalid JSON content");
      }

      // Validate against template's output schema if available
      const outputSchema = request.template.getOutputSchema();
      if (outputSchema && Object.keys(outputSchema).length > 0) {
        this.validateContent(content, outputSchema);
      }

      return {
        content,
        tokensUsed: response.usage?.total_tokens || 0,
        model: response.model,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error("❌ Error generating content with OpenAI", error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Builds the system prompt for the AI
   */
  private buildSystemPrompt(request: GenerateContentRequest): string {
    const { template } = request;

    const templateRole = template.getRolIA()?.trim();
    const roleDefinition =
      templateRole && templateRole.length > 0
        ? templateRole
        : "Eres un diseñador instruccional experto en crear contenido educativo adaptado al contexto del programa.";

    const technicalInstructions = `
IMPORTANTE:
- Genera contenido en español
- SIEMPRE devuelve la respuesta en formato JSON válido
- La respuesta debe seguir exactamente la estructura del schema de salida`;

    return `${roleDefinition}\n\n${technicalInstructions}`;
  }

  /**
   * Builds the user prompt with context
   */
  private buildUserPrompt(request: GenerateContentRequest): string {
    const { template, configuration, context } = request;

    let prompt = template.getPromptTemplate();
    const promptHasSchemaPlaceholder = prompt.includes("{{output_schema}}");

    const promptData = this.buildPromptData(template, configuration, context);
    prompt = this.applyTemplate(prompt, promptData);

    const replacements = this.buildLegacyPlaceholderReplacements(
      configuration,
      context,
      promptData,
    );
    Object.entries(replacements).forEach(([placeholder, value]) => {
      prompt = prompt.replace(new RegExp(placeholder, "g"), value);
    });

    const outputSchema = template.getOutputSchema();
    if (
      outputSchema &&
      Object.keys(outputSchema).length > 0 &&
      !promptHasSchemaPlaceholder
    ) {
      prompt += `\n\nDebes generar el contenido siguiendo esta estructura JSON:\n${JSON.stringify(outputSchema, null, 2)}`;
    }

    if (template.getCategoria().toString() === "leccion_interactiva") {
      const requiredExamples = this.getRequiredExamplesCount(configuration);
      prompt += `

FORMATO PARA EJEMPLOS PRÁCTICOS:
- Incluye al menos ${requiredExamples} ejemplos prácticos que conecten el concepto con situaciones reales del proof point.
- Cuando desarrolles un ejemplo completo, encapsúlalo en un bloque de código "example".
- IMPORTANTE: El contenido JSON debe comenzar en una línea nueva. Ejemplo:
  \`\`\`example
  { ... }
  \`\`\`
- El JSON del bloque debe contener "titulo" (o "title"), "contexto" (o "context"), "pasos"/"steps" (lista de 3 a 5 bullets) y "resultado"/"result". Puedes agregar "metricas"/"metrics" (pares etiqueta-valor) y "casos"/"cases" con sub-escenarios.
- Después de cada bloque example continúa con el flujo narrativo del artículo.`;
    }

    return prompt;
  }

  private buildPromptData(
    template: ExerciseTemplate,
    configuration: Record<string, any>,
    context: GenerateContentRequest["context"],
  ): Record<string, any> {
    const programaData = this.serializePrograma(context.programa);
    const faseData = this.serializeFase(context.fase);
    const proofPointData = this.serializeProofPoint(context.proofPoint);
    const documentationSummary = this.formatFaseDocumentation(
      context.faseDocumentation,
    );
    const contextoCompleto = this.buildContextoCompleto(
      context.programa,
      context.fase,
      context.proofPoint,
      documentationSummary,
      context.customContext,
    );
    const outputSchema = template.getOutputSchema();
    const schemaString =
      outputSchema && Object.keys(outputSchema).length > 0
        ? JSON.stringify(outputSchema, null, 2)
        : "{}";

    return {
      ...configuration,
      programa: programaData,
      fase: faseData,
      proof_point: proofPointData,
      configuracion: configuration,
      exercise: { nombre: context.exerciseName },
      consideraciones: context.customContext || "",
      contexto_instructor: context.customContext || "",
      contexto_completo: contextoCompleto,
      fase_documentation: documentationSummary,
      output_schema: schemaString,
    };
  }

  private buildLegacyPlaceholderReplacements(
    configuration: Record<string, any>,
    context: GenerateContentRequest["context"],
    promptData: Record<string, any>,
  ): Record<string, string> {
    const replacements: Record<string, string> = {
      "{programa_nombre}":
        promptData.programa?.nombre || context.programa.getNombre(),
      "{programa_descripcion}":
        promptData.programa?.descripcion ||
        context.programa.getDescripcion() ||
        "",
      "{fase_nombre}": promptData.fase?.nombre || context.fase.getNombre(),
      "{fase_descripcion}":
        promptData.fase?.descripcion || context.fase.getDescripcion() || "",
      "{fase_objetivos}": Array.isArray(promptData.fase?.objetivos)
        ? promptData.fase.objetivos.join(", ")
        : context.fase.getObjetivosAprendizaje().join(", "),
      "{proof_point_nombre}":
        promptData.proof_point?.nombre || context.proofPoint.getNombre(),
      "{proof_point_descripcion}":
        promptData.proof_point?.descripcion ||
        context.proofPoint.getDescripcion() ||
        "",
      "{proof_point_pregunta}":
        promptData.proof_point?.pregunta_central ||
        context.proofPoint.getPreguntaCentral() ||
        "",
      "{proof_point_documentacion}":
        promptData.proof_point?.documentacion_contexto ||
        context.proofPoint.getDocumentacionContexto() ||
        "",
      "{exercise_nombre}": context.exerciseName,
      "{contexto_instructor}": context.customContext || "",
      "{fase_documentation}": promptData.fase_documentation || "",
      "{contexto_completo}": promptData.contexto_completo || "",
    };

    Object.entries(configuration).forEach(([key, value]) => {
      replacements[`{config_${key}}`] = this.stringifyReplacementValue(value);
    });

    return replacements;
  }

  private stringifyReplacementValue(value: any): string {
    if (value === undefined || value === null) {
      return "";
    }

    if (Array.isArray(value)) {
      return value
        .map((entry) => this.stringifyReplacementValue(entry))
        .join(", ");
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  private getRequiredExamplesCount(configuration: Record<string, any>): number {
    const candidates = [
      configuration.numero_casos_practica,
      configuration.numero_ejemplos,
      configuration.numero_examples,
      configuration.examples,
    ];

    const match = candidates.find(
      (value) => typeof value === "number" && value > 0,
    );

    return (match as number | undefined) || 3;
  }

  private serializePrograma(programa: Programa): Record<string, any> {
    return {
      id: programa.getId().toString(),
      nombre: programa.getNombre(),
      descripcion: programa.getDescripcion() || "",
      objetivos: programa.getObjetivosAprendizaje() || [],
      duracion_semanas: programa.getDuracion().toWeeks(),
      categoria: programa.getCategoria() || "",
      nivel_dificultad: programa.getNivelDificultad() || "",
      audiencia: programa.getAudienciaObjetivo() || "",
      tags: programa.getTags() || [],
    };
  }

  private serializeFase(fase: Fase): Record<string, any> {
    return {
      id: fase.getId().toString(),
      nombre: fase.getNombre(),
      descripcion: fase.getDescripcion() || "",
      numero: fase.getNumeroFase(),
      objetivos: fase.getObjetivosAprendizaje(),
      duracion_semanas: fase.getDuracion().toWeeks(),
      orden: fase.getOrden(),
    };
  }

  private serializeProofPoint(proofPoint: ProofPoint): Record<string, any> {
    return {
      id: proofPoint.getId().toString(),
      nombre: proofPoint.getNombre(),
      descripcion: proofPoint.getDescripcion() || "",
      pregunta_central: proofPoint.getPreguntaCentral() || "",
      documentacion_contexto: proofPoint.getDocumentacionContexto() || "",
      duracion_horas: proofPoint.getDuracion().toHours(),
      orden: proofPoint.getOrdenEnFase(),
      tipo_entregable: proofPoint.getTipoEntregableFinal() || "",
    };
  }

  private formatFaseDocumentation(doc?: FaseDocumentation): string {
    if (!doc) {
      return "No hay documentación adicional registrada para esta fase.";
    }

    const sections: string[] = [];

    if (doc.getContextoGeneral()) {
      sections.push(`Contexto general:\n${doc.getContextoGeneral()}`);
    }

    if (doc.getConceptosClave().length > 0) {
      const conceptos = doc
        .getConceptosClave()
        .map((concepto) => `- ${concepto.nombre}: ${concepto.definicion}`)
        .join("\n");
      sections.push(`Conceptos clave relevantes:\n${conceptos}`);
    }

    if (doc.getCasosEjemplo().length > 0) {
      const casos = doc
        .getCasosEjemplo()
        .map(
          (caso, index) =>
            `${index + 1}. ${caso.titulo}: ${caso.descripcion}${
              caso.resultado ? ` (resultado: ${caso.resultado})` : ""
            }`,
        )
        .join("\n");
      sections.push(`Casos de ejemplo representativos:\n${casos}`);
    }

    if (doc.getErroresComunes().length > 0) {
      const errores = doc
        .getErroresComunes()
        .map(
          (error) =>
            `- ${error.descripcion}${
              error.solucion ? ` → Mitigación: ${error.solucion}` : ""
            }`,
        )
        .join("\n");
      sections.push(`Errores frecuentes a evitar:\n${errores}`);
    }

    if (doc.getRecursosReferencia().length > 0) {
      const recursos = doc
        .getRecursosReferencia()
        .map(
          (recurso) =>
            `- (${recurso.tipo}) ${recurso.titulo}${
              recurso.descripcion ? ` — ${recurso.descripcion}` : ""
            }${recurso.url ? ` [${recurso.url}]` : ""}`,
        )
        .join("\n");
      sections.push(`Recursos sugeridos:\n${recursos}`);
    }

    return sections.join("\n\n");
  }

  private buildContextoCompleto(
    programa: Programa,
    fase: Fase,
    proofPoint: ProofPoint,
    documentation: string,
    customContext?: string,
  ): string {
    const blocks: string[] = [
      `Programa: ${programa.getNombre()}${
        programa.getDescripcion() ? ` — ${programa.getDescripcion()}` : ""
      }`,
      `Fase ${fase.getNumeroFase()}: ${fase.getNombre()}${
        fase.getDescripcion() ? ` — ${fase.getDescripcion()}` : ""
      }\nObjetivos de aprendizaje: ${fase
        .getObjetivosAprendizaje()
        .join(", ")}`,
      `Proof Point: ${proofPoint.getNombre()}\nPregunta central: ${
        proofPoint.getPreguntaCentral() || "No definida"
      }\nDocumentación clave: ${
        proofPoint.getDocumentacionContexto() || "Sin documentación"
      }`,
    ];

    if (documentation) {
      blocks.push(`Documentación extendida de la fase:\n${documentation}`);
    }

    if (customContext && customContext.trim().length > 0) {
      blocks.push(`Consideraciones del instructor:\n${customContext.trim()}`);
    }

    return blocks.join("\n\n");
  }

  private applyTemplate(template: string, data: Record<string, any>): string {
    if (!template || !template.includes("{{")) {
      return template;
    }

    return template.replace(/\{\{\s*([^{}]+)\s*\}\}/g, (_, expression) => {
      const value = this.resolveTemplatePath(data, expression.trim());
      return this.formatTemplateValue(value);
    });
  }

  private resolveTemplatePath(source: Record<string, any>, path: string): any {
    return path.split(".").reduce((acc: any, key: string) => {
      if (acc === undefined || acc === null) {
        return undefined;
      }

      return acc[key];
    }, source);
  }

  private formatTemplateValue(value: any): string {
    if (value === undefined || value === null) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value
        .map((entry) =>
          typeof entry === "string" ? entry : JSON.stringify(entry),
        )
        .join(", ");
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  private async requestStructuredCompletion(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{
    response: OpenAI.Chat.Completions.ChatCompletion;
    rawContent: string;
  }> {
    let attempt = 0;
    let tokenBudget = this.initialCompletionTokens;
    let lastResponse: OpenAI.Chat.Completions.ChatCompletion | undefined;

    while (attempt <= this.completionRetryLimit) {
      this.logger.debug(
        `🚀 OpenAI request attempt ${attempt + 1} with token budget ${tokenBudget}`,
      );

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: tokenBudget,
        response_format: { type: "json_object" },
      });

      lastResponse = response;

      const finishReason = response.choices[0]?.finish_reason;
      const message = response.choices[0]?.message;
      const rawContent = this.extractMessageContent(message);

      this.logger.debug(`   Finish reason: ${finishReason || "unknown"}`);

      if (rawContent) {
        return { response, rawContent };
      }

      const reachedRetryLimit = attempt >= this.completionRetryLimit;
      const hitMaxTokens = tokenBudget >= this.maxCompletionTokens;
      const shouldRetryWithMoreTokens =
        finishReason === "length" && !reachedRetryLimit && !hitMaxTokens;

      if (!shouldRetryWithMoreTokens) {
        break;
      }

      const nextBudget = Math.min(
        Math.ceil(tokenBudget * this.completionTokenMultiplier),
        this.maxCompletionTokens,
      );

      if (nextBudget === tokenBudget) {
        break;
      }

      this.logger.warn(
        `⚠️  OpenAI truncated response at ${tokenBudget} tokens (finish_reason: length). Retrying with ${nextBudget} tokens...`,
      );

      tokenBudget = nextBudget;
      attempt += 1;
    }

    if (!lastResponse) {
      throw new Error("No response received from OpenAI");
    }

    return { response: lastResponse, rawContent: "" };
  }

  /**
   * Validates generated content against schema
   */
  private validateContent(content: any, schema: Record<string, any>): void {
    // Basic validation - check that all required fields are present
    const requiredFields = Object.keys(schema);
    const contentFields = Object.keys(content);

    const missingFields = requiredFields.filter(
      (field) => !contentFields.includes(field),
    );

    if (missingFields.length > 0) {
      this.logger.warn(
        `⚠️  Generated content is missing fields: ${missingFields.join(", ")}`,
      );
      // Don't throw error, just warn - we'll use what we got
    }
  }

  /**
   * Generates a text completion using OpenAI
   * Generic method for various AI tasks (feedback, chat, etc.)
   */
  async generateCompletion(
    prompt: string,
    options?: {
      maxTokens?: number;
      systemPrompt?: string;
    },
  ): Promise<string> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system prompt if provided
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }

      // Add user prompt
      messages.push({ role: "user", content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_completion_tokens: options?.maxTokens ?? 500,
      });

      return this.extractMessageContent(response.choices[0]?.message);
    } catch (error) {
      this.logger.error("❌ Error generating completion with OpenAI", error);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }

  /**
   * Generates a streaming chat completion
   * Returns an async generator that yields chunks of text as they arrive
   */
  async *generateChatResponseStream({
    systemPrompt,
    messages,
    maxTokens,
  }: {
    systemPrompt: string;
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    maxTokens?: number;
  }): AsyncGenerator<string, void, unknown> {
    try {
      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [{ role: "system", content: systemPrompt }, ...messages];

      const tokenBudget = Math.min(
        maxTokens && maxTokens > 0 ? maxTokens : this.initialCompletionTokens,
        this.maxCompletionTokens,
      );

      this.logger.debug(`🤖 Starting streaming chat completion`);
      this.logger.debug(`   Model: ${this.model}`);
      this.logger.debug(`   Messages count: ${chatMessages.length}`);
      this.logger.debug(`   Max tokens: ${tokenBudget}`);

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: chatMessages,
        max_completion_tokens: tokenBudget,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content;

        if (content) {
          yield content;
        }
      }

      this.logger.debug(`✅ Streaming chat completion finished`);
    } catch (error) {
      this.logger.error(
        "❌ Error generating streaming chat response with OpenAI",
        error,
      );
      throw new Error(
        `Failed to generate streaming chat response: ${error.message}`,
      );
    }
  }

  /**
   * Generates a chat-style completion with full control over messages
   */
  async generateChatResponse({
    systemPrompt,
    messages,
    maxTokens,
    responseFormat,
    model,
  }: {
    systemPrompt: string;
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    maxTokens?: number;
    responseFormat?: OpenAI.Chat.Completions.ChatCompletionCreateParams["response_format"];
    model?: string;
  }): Promise<{
    content: string;
    raw: OpenAI.Chat.Completions.ChatCompletion;
  }> {
    try {
      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [{ role: "system", content: systemPrompt }, ...messages];
      const modelToUse = model || this.model;

      let tokenBudget = Math.min(
        maxTokens && maxTokens > 0 ? maxTokens : this.initialCompletionTokens,
        this.maxCompletionTokens,
      );
      let attempt = 0;
      let lastResponse: OpenAI.Chat.Completions.ChatCompletion | null = null;

      while (attempt <= this.completionRetryLimit) {
        this.logger.debug(
          `🤖 Sending chat completion request (attempt ${attempt + 1})`,
        );
        this.logger.debug(`   Model: ${modelToUse}`);
        this.logger.debug(`   Messages count: ${chatMessages.length}`);
        this.logger.debug(`   Max tokens: ${tokenBudget}`);
        this.logger.debug(
          `   Response format: ${responseFormat?.type || "text"}`,
        );

        const response = await this.client.chat.completions.create({
          model: modelToUse,
          messages: chatMessages,
          max_completion_tokens: tokenBudget,
          response_format: responseFormat ?? { type: "text" },
        });

        lastResponse = response;

        this.logger.debug(`✅ Chat completion received`);
        this.logger.debug(
          `   Finish reason: ${response.choices[0]?.finish_reason}`,
        );
        this.logger.debug(
          `   Message exists: ${!!response.choices[0]?.message}`,
        );
        this.logger.debug(
          `   Message content type: ${typeof response.choices[0]?.message?.content}`,
        );
        this.logger.debug(
          `   Message content length: ${response.choices[0]?.message?.content?.toString().length || 0}`,
        );

        const content = this.extractMessageContent(
          response.choices[0]?.message,
        );

        this.logger.debug(`   Extracted content length: ${content.length}`);

        if (content) {
          return { content, raw: response };
        }

        const finishReason = response.choices[0]?.finish_reason;
        const reachedRetryLimit = attempt >= this.completionRetryLimit;
        const hitMaxTokens = tokenBudget >= this.maxCompletionTokens;
        const shouldRetry =
          finishReason === "length" && !reachedRetryLimit && !hitMaxTokens;

        if (!shouldRetry) {
          this.logger.warn("⚠️  Empty content extracted from chat response");
          this.logger.debug(
            `   Full message: ${JSON.stringify(response.choices[0]?.message, null, 2)}`,
          );
          break;
        }

        const nextBudget = Math.min(
          Math.ceil(tokenBudget * this.completionTokenMultiplier),
          this.maxCompletionTokens,
        );

        if (nextBudget === tokenBudget) {
          break;
        }

        this.logger.warn(
          `⚠️  Chat response truncated at ${tokenBudget} tokens (finish_reason: length). Retrying with ${nextBudget} tokens...`,
        );

        tokenBudget = nextBudget;
        attempt += 1;
      }

      if (!lastResponse) {
        throw new Error("No response received from OpenAI");
      }

      return { content: "", raw: lastResponse };
    } catch (error) {
      this.logger.error("❌ Error generating chat response with OpenAI", error);
      throw new Error(`Failed to generate chat response: ${error.message}`);
    }
  }

  /**
   * Tests the OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "user", content: 'Responde con "OK" si puedes leerme.' },
        ],
        max_completion_tokens: 10,
      });

      const answer = this.extractMessageContent(response.choices[0]?.message)
        .trim()
        .toLowerCase();
      return answer === "ok";
    } catch (error) {
      this.logger.error("❌ OpenAI connection test failed", error);
      return false;
    }
  }

  /**
   * Extracts text content from OpenAI chat completion responses
   */
  private extractMessageContent(
    message?: OpenAI.Chat.Completions.ChatCompletionMessage,
  ): string {
    if (!message) {
      this.logger.debug("extractMessageContent: message is undefined/null");
      return "";
    }

    this.logger.debug(
      `extractMessageContent: message keys: ${Object.keys(message).join(", ")}`,
    );
    this.logger.debug(`extractMessageContent: message.role: ${message.role}`);
    this.logger.debug(
      `extractMessageContent: message.content type: ${typeof message.content}`,
    );

    // Check for parsed content first (used with response_format: json_object with structured outputs)
    const potentialParsed = (message as any)?.parsed;
    if (potentialParsed) {
      this.logger.debug("extractMessageContent: Found parsed content");
      if (typeof potentialParsed === "string") {
        return potentialParsed.trim();
      }

      try {
        const stringified = JSON.stringify(potentialParsed);
        this.logger.debug(
          `extractMessageContent: Stringified parsed content (${stringified.length} chars)`,
        );
        return stringified;
      } catch (error) {
        this.logger.warn(
          "extractMessageContent: Failed to stringify parsed content",
          error,
        );
        return "";
      }
    }

    // Check for regular content
    if (!message.content) {
      const refusalText = (message as any)?.refusal;
      if (typeof refusalText === "string" && refusalText.trim().length > 0) {
        this.logger.warn("extractMessageContent: Model refusal detected");
        return refusalText.trim();
      }

      this.logger.debug(
        "extractMessageContent: No content or parsed field found",
      );
      this.logger.debug(
        `extractMessageContent: Full message structure: ${JSON.stringify(message, null, 2)}`,
      );
      return "";
    }

    const content = message.content as any;

    if (typeof content === "string") {
      this.logger.debug(
        `extractMessageContent: String content (${content.length} chars)`,
      );
      return content.trim();
    }

    if (Array.isArray(content)) {
      this.logger.debug("extractMessageContent: Array content");
      return content
        .map((part: any) => {
          if (!part) return "";
          if (typeof part === "string") {
            return part;
          }

          if (typeof part.text === "string") {
            return part.text;
          }

          if (part.type === "json_object" && part.json_object) {
            return this.safeStringify(part.json_object);
          }

          return "";
        })
        .filter(
          (segment) => typeof segment === "string" && segment.trim().length > 0,
        )
        .join("\n")
        .trim();
    }

    if (typeof content === "object") {
      this.logger.debug("extractMessageContent: Object content");
      return this.safeStringify(content);
    }

    this.logger.debug(
      "extractMessageContent: Fallback - returning empty string",
    );
    return "";
  }

  private safeStringify(value: unknown): string {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
}
