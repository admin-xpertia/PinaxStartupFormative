import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ExerciseTemplate } from '../../domain/exercise-catalog/entities/ExerciseTemplate';
import { ProofPoint } from '../../domain/program-design/entities/ProofPoint';
import { Fase } from '../../domain/program-design/entities/Fase';
import { Programa } from '../../domain/program-design/entities/Programa';

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
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        '⚠️  OPENAI_API_KEY not configured. AI generation will not work.',
      );
    }

    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-testing',
    });

    // Configuration
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-5-nano';
    this.maxCompletionTokens =
      this.configService.get<number>('OPENAI_MAX_TOKENS') || 12000;
    this.initialCompletionTokens = Math.min(
      this.configService.get<number>('OPENAI_INITIAL_COMPLETION_TOKENS') ||
        4000,
      this.maxCompletionTokens,
    );
    this.completionRetryLimit =
      this.configService.get<number>('OPENAI_COMPLETION_MAX_RETRIES') || 2;
    this.completionTokenMultiplier =
      this.configService.get<number>('OPENAI_COMPLETION_TOKEN_MULTIPLIER') || 2;

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

      this.logger.debug('🔧 System Prompt:');
      this.logger.debug(systemPrompt);
      this.logger.debug('💬 User Prompt:');
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
        `   Tokens used: ${response.usage?.total_tokens || 'unknown'}`,
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
          '   Full response:',
          JSON.stringify(response, null, 2),
        );
        throw new Error('OpenAI returned empty content');
      }

      // Parse and validate response
      let content: Record<string, any>;
      try {
        content = JSON.parse(rawContent);
      } catch (parseError) {
        this.logger.error(
          'Failed to parse JSON content from OpenAI',
          parseError,
        );
        this.logger.debug(`Raw OpenAI content: ${rawContent}`);
        throw new Error('OpenAI returned invalid JSON content');
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
      this.logger.error('❌ Error generating content with OpenAI', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Builds the system prompt for the AI
   */
  private buildSystemPrompt(request: GenerateContentRequest): string {
    const { template } = request;

    const basePrompt = `Eres un diseñador instruccional experto especializado en crear contenido educativo de alta calidad para programas de emprendimiento e innovación.

Tu rol específico es: ${template.getRolIA() || 'crear contenido educativo efectivo y atractivo'}.

Objetivo pedagógico: ${template.getObjetivoPedagogico() || 'facilitar el aprendizaje efectivo del estudiante'}.

IMPORTANTE:
- Genera contenido en español
- Usa un tono profesional pero accesible
- Incluye ejemplos prácticos y relevantes
- Estructura el contenido de forma clara y progresiva
- Adapta la complejidad al nivel del estudiante
- SIEMPRE devuelve la respuesta en formato JSON válido
- La respuesta debe seguir exactamente la estructura del schema de salida`;

    return basePrompt;
  }

  /**
   * Builds the user prompt with context
   */
  private buildUserPrompt(request: GenerateContentRequest): string {
    const { template, configuration, context } = request;

    // Start with template's prompt template
    let prompt = template.getPromptTemplate();

    // Replace placeholders with actual context
    const replacements: Record<string, string> = {
      '{programa_nombre}': context.programa.getNombre(),
      '{programa_descripcion}': context.programa.getDescripcion(),
      '{fase_nombre}': context.fase.getNombre(),
      '{fase_descripcion}': context.fase.getDescripcion() || '',
      '{fase_objetivos}': context.fase.getObjetivosAprendizaje().join(', '),
      '{proof_point_nombre}': context.proofPoint.getNombre(),
      '{proof_point_descripcion}': context.proofPoint.getDescripcion() || '',
      '{proof_point_pregunta}': context.proofPoint.getPreguntaCentral() || '',
      '{exercise_nombre}': context.exerciseName,
      '{contexto_instructor}': context.customContext || '',
    };

    // Add configuration values as replacements
    Object.entries(configuration).forEach(([key, value]) => {
      replacements[`{config_${key}}`] = String(value);
    });

    // Replace all placeholders
    Object.entries(replacements).forEach(([placeholder, value]) => {
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    });

    // Append output schema requirement
    const outputSchema = template.getOutputSchema();
    if (outputSchema && Object.keys(outputSchema).length > 0) {
      prompt += `\n\nDebes generar el contenido siguiendo esta estructura JSON:\n${JSON.stringify(outputSchema, null, 2)}`;
    }

    return prompt;
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: tokenBudget,
        response_format: { type: 'json_object' },
      });

      lastResponse = response;

      const finishReason = response.choices[0]?.finish_reason;
      const message = response.choices[0]?.message;
      const rawContent = this.extractMessageContent(message);

      this.logger.debug(`   Finish reason: ${finishReason || 'unknown'}`);

      if (rawContent) {
        return { response, rawContent };
      }

      const reachedRetryLimit = attempt >= this.completionRetryLimit;
      const hitMaxTokens = tokenBudget >= this.maxCompletionTokens;
      const shouldRetryWithMoreTokens =
        finishReason === 'length' && !reachedRetryLimit && !hitMaxTokens;

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
      throw new Error('No response received from OpenAI');
    }

    return { response: lastResponse, rawContent: '' };
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
        `⚠️  Generated content is missing fields: ${missingFields.join(', ')}`,
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
        messages.push({ role: 'system', content: options.systemPrompt });
      }

      // Add user prompt
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_completion_tokens: options?.maxTokens ?? 500,
      });

      return this.extractMessageContent(response.choices[0]?.message);
    } catch (error) {
      this.logger.error('❌ Error generating completion with OpenAI', error);
      throw new Error(`Failed to generate completion: ${error.message}`);
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
          { role: 'user', content: 'Responde con "OK" si puedes leerme.' },
        ],
        max_completion_tokens: 10,
      });

      const answer = this.extractMessageContent(response.choices[0]?.message)
        .trim()
        .toLowerCase();
      return answer === 'ok';
    } catch (error) {
      this.logger.error('❌ OpenAI connection test failed', error);
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
      this.logger.debug('extractMessageContent: message is undefined/null');
      return '';
    }

    // Check for parsed content first (used with response_format: json_object)
    const potentialParsed = (message as any)?.parsed;
    if (potentialParsed) {
      this.logger.debug('extractMessageContent: Found parsed content');
      if (typeof potentialParsed === 'string') {
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
          'extractMessageContent: Failed to stringify parsed content',
          error,
        );
        return '';
      }
    }

    // Check for regular content
    if (!message.content) {
      this.logger.debug(
        'extractMessageContent: No content or parsed field found',
      );
      return '';
    }

    const content = message.content as any;

    if (typeof content === 'string') {
      this.logger.debug(
        `extractMessageContent: String content (${content.length} chars)`,
      );
      return content.trim();
    }

    if (Array.isArray(content)) {
      this.logger.debug('extractMessageContent: Array content');
      return content
        .map((part: any) => {
          if (!part) return '';
          if (typeof part === 'string') {
            return part;
          }

          if (typeof part.text === 'string') {
            return part.text;
          }

          if (part.type === 'json_object' && part.json_object) {
            return this.safeStringify(part.json_object);
          }

          return '';
        })
        .filter(
          (segment) => typeof segment === 'string' && segment.trim().length > 0,
        )
        .join('\n')
        .trim();
    }

    if (typeof content === 'object') {
      this.logger.debug('extractMessageContent: Object content');
      return this.safeStringify(content);
    }

    this.logger.debug(
      'extractMessageContent: Fallback - returning empty string',
    );
    return '';
  }

  private safeStringify(value: unknown): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
}
