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
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('⚠️  OPENAI_API_KEY not configured. AI generation will not work.');
    }

    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-testing',
    });

    // Configuration
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4-turbo-preview';
    this.maxTokens = this.configService.get<number>('OPENAI_MAX_TOKENS') || 4000;
    this.temperature = this.configService.get<number>('OPENAI_TEMPERATURE') || 0.7;

    this.logger.log(`🤖 OpenAI Service initialized`);
    this.logger.log(`   Model: ${this.model}`);
    this.logger.log(`   Max Tokens: ${this.maxTokens}`);
    this.logger.log(`   Temperature: ${this.temperature}`);
  }

  /**
   * Generates exercise content using OpenAI
   */
  async generateExerciseContent(
    request: GenerateContentRequest,
  ): Promise<GenerateContentResponse> {
    try {
      this.logger.log(`📝 Generating content for exercise: ${request.context.exerciseName}`);
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
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' },
      });

      const duration = Date.now() - startTime;

      this.logger.log(`✅ Content generated in ${duration}ms`);
      this.logger.debug(`   Tokens used: ${response.usage?.total_tokens || 'unknown'}`);
      this.logger.debug(`   Model: ${response.model}`);

      // Parse and validate response
      const content = JSON.parse(response.choices[0].message.content || '{}');

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
   * Tests the OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: 'Responde con "OK" si puedes leerme.' },
        ],
        max_tokens: 10,
      });

      const answer = response.choices[0].message.content?.trim().toLowerCase();
      return answer === 'ok';
    } catch (error) {
      this.logger.error('❌ OpenAI connection test failed', error);
      return false;
    }
  }
}
