import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import OpenAI from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { SurrealDbService } from 'src/core/database';
import { ExerciseTemplatesService } from './exercise-templates.service';
import { ExerciseInstancesService } from './exercise-instances.service';
import { ProgramasService } from '../programas/programas.service';
import { OPENAI_CLIENT } from '../generacion/generacion.service';
import {
  ExerciseInstance,
  ExerciseTemplate,
  ExerciseContent,
  ProofPoint,
  Fase,
  Programa,
  FaseDocumentation,
} from '@repo/database/types';

export interface GenerateExerciseDto {
  exerciseInstanceId: string;
  userId: string;
}

@Injectable()
export class ExerciseGenerationService {
  private readonly logger = new Logger(ExerciseGenerationService.name);

  constructor(
    private readonly surrealDb: SurrealDbService,
    private readonly templatesService: ExerciseTemplatesService,
    private readonly instancesService: ExerciseInstancesService,
    private readonly programasService: ProgramasService,
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
  ) {}

  /**
   * Genera contenido para una instancia de ejercicio usando su template.
   *
   * Este es el método principal que orquesta todo el proceso de generación.
   */
  async generateExerciseContent(dto: GenerateExerciseDto): Promise<ExerciseContent> {
    const { exerciseInstanceId, userId } = dto;

    // 1. Obtener la instancia del ejercicio con todos sus datos relacionados
    const instance = await this.instancesService.getInstanceById(exerciseInstanceId);

    // 2. Marcar como "generando"
    await this.instancesService.markAsGenerating(exerciseInstanceId);

    try {
      // 3. Obtener el template
      const template = await this.templatesService.getTemplateById(
        String(instance.template),
      );

      // 4. Obtener contexto completo (programa, fase, proof point, documentación)
      const context = await this.buildGenerationContext(instance);

      // 5. Construir configuración final (default + personalizada)
      const configuracion = this.templatesService.mergeConfiguration(
        template,
        instance.configuracion_personalizada,
      );

      // 6. Interpolar el prompt con el contexto
      const prompt = this.templatesService.interpolatePromptTemplate(template, {
        ...context,
        consideraciones: instance.consideraciones_contexto,
        configuracion,
      });

      // 7. Crear request de generación
      const requestRecord = await this.createGeneracionRequest(
        instance,
        template,
        userId,
        prompt,
        configuracion,
      );

      // 8. Llamar a OpenAI
      const response = await this.callOpenAI(prompt, configuracion, template);

      // 9. Parsear respuesta
      const parsed = this.parseOpenAIResponse(response, template);

      // 10. Guardar contenido generado crudo
      await this.persistGeneratedContent(requestRecord.id, response, parsed);

      // 11. Crear ExerciseContent
      const content = await this.createExerciseContent(
        instance,
        parsed,
        requestRecord.id,
      );

      // 12. Actualizar instancia con contenido y estado
      await this.instancesService.updateContentStatus(
        exerciseInstanceId,
        'draft',
        String(content.id),
      );

      // 13. Marcar request como completado
      await this.markRequestCompleted(requestRecord.id);

      this.logger.log(
        `Ejercicio generado exitosamente: ${instance.nombre} (${content.id})`,
      );

      return content;
    } catch (error) {
      this.logger.error('Error durante la generación de ejercicio:', error);

      // Revertir estado a sin_generar
      await this.instancesService.updateContentStatus(
        exerciseInstanceId,
        'sin_generar',
      );

      throw new InternalServerErrorException(
        'No pudimos generar el ejercicio en este momento',
      );
    }
  }

  /**
   * Construye el contexto completo necesario para la generación.
   */
  private async buildGenerationContext(instance: ExerciseInstance): Promise<{
    programa?: Programa;
    fase?: Fase;
    proof_point?: ProofPoint;
    fase_documentation?: FaseDocumentation;
  }> {
    // Obtener proof point
    const proofPointQuery = `
      SELECT *,
        fase.* AS fase_data,
        fase.programa.* AS programa_data
      FROM type::thing("proof_point", $proofPointId)
    `;

    const proofPointResult = await this.surrealDb.query<any[]>(proofPointQuery, {
      proofPointId: this.extractId(String(instance.proof_point)),
    });

    const proofPoint = proofPointResult?.[0];

    if (!proofPoint) {
      throw new BadRequestException('Proof point no encontrado');
    }

    // Obtener fase documentation
    const faseId = this.extractId(String(proofPoint.fase || proofPoint.fase_data?.id));
    const faseDocumentation = await this.programasService.getDocumentacion(faseId);

    return {
      programa: proofPoint.programa_data,
      fase: proofPoint.fase_data,
      proof_point: proofPoint,
      fase_documentation: faseDocumentation as any,
    };
  }

  /**
   * Crea el registro de generacion_request en la BD.
   */
  private async createGeneracionRequest(
    instance: ExerciseInstance,
    template: ExerciseTemplate,
    userId: string,
    prompt: string,
    configuracion: Record<string, any>,
  ) {
    const query = `
      CREATE generacion_request CONTENT {
        exercise_instance: type::thing("exercise_instance", $instanceId),
        template: type::thing("exercise_template", $templateId),
        solicitado_por: type::thing("user", $userId),
        configuracion: $configuracion,
        prompt_usado: $prompt,
        estado: 'processing'
      }
      RETURN *;
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      instanceId: this.extractId(String(instance.id)),
      templateId: this.extractId(String(template.id)),
      userId: this.extractId(userId),
      configuracion,
      prompt,
    });

    const record = result?.[0];

    if (!record || !record.id) {
      throw new InternalServerErrorException(
        'No se pudo crear la solicitud de generación',
      );
    }

    return record;
  }

  /**
   * Llama a la API de OpenAI con el prompt construido.
   */
  private async callOpenAI(
    prompt: string,
    configuracion: Record<string, any>,
    template: ExerciseTemplate,
  ): Promise<ChatCompletion> {
    // Usar modelo de configuración o default
    const model = configuracion.modelo_ia || 'gpt-4o-mini';
    const temperature = configuracion.temperatura ?? 0.7;

    this.logger.log(
      `Llamando a OpenAI para template "${template.nombre}" con modelo: ${model}`,
    );
    this.logger.debug(
      `Prompt length: ${prompt.length} chars (~${Math.ceil(prompt.length / 4)} tokens)`,
    );

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
        ],
        temperature,
        response_format: {
          type: 'json_object',
        },
      });

      this.logger.log(
        `Respuesta recibida de OpenAI. Tokens: ${response.usage?.total_tokens || 'N/A'}`,
      );

      return response as ChatCompletion;
    } catch (error: any) {
      this.logger.error('Error al llamar a OpenAI:', error);

      if (error.status === 429) {
        throw new InternalServerErrorException(
          'Límite de tasa de OpenAI alcanzado. Intenta nuevamente en unos momentos.',
        );
      }

      if (error.status === 401) {
        throw new InternalServerErrorException(
          'Error de autenticación con OpenAI. Verifica la API key.',
        );
      }

      if (error.status === 400) {
        this.logger.error('Prompt que causó error:', prompt.substring(0, 500));
        throw new InternalServerErrorException('El prompt enviado es inválido.');
      }

      throw new InternalServerErrorException(
        `Error al generar contenido: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  /**
   * Parsea la respuesta JSON de OpenAI.
   */
  private parseOpenAIResponse(
    response: ChatCompletion,
    template: ExerciseTemplate,
  ): any {
    const output = response.choices?.[0]?.message?.content;

    if (!output) {
      this.logger.error('Respuesta sin contenido:', JSON.stringify(response));
      throw new InternalServerErrorException('Respuesta de OpenAI vacía');
    }

    this.logger.debug(`Parseando JSON (${output.length} caracteres)`);

    try {
      const parsed = JSON.parse(output);

      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('El contenido generado no es un objeto JSON válido');
      }

      // Validar contra output_schema del template (básico)
      const expectedKeys = Object.keys(template.output_schema);
      const missingKeys = expectedKeys.filter((key) => !(key in parsed));

      if (missingKeys.length > 0) {
        this.logger.warn(
          `Respuesta falta campos esperados: ${missingKeys.join(', ')}`,
        );
      }

      return parsed;
    } catch (error) {
      this.logger.error('Error al parsear JSON:', error);
      this.logger.error('Output raw:', output.substring(0, 500));
      throw new InternalServerErrorException(
        'La respuesta de OpenAI no es JSON válido',
      );
    }
  }

  /**
   * Persiste el contenido generado crudo en contenido_generado.
   */
  private async persistGeneratedContent(
    requestId: string,
    response: ChatCompletion,
    parsed: any,
  ) {
    const contenidoRaw = JSON.stringify(parsed);
    const metadata = {
      model: response.model,
      usage: response.usage,
    };

    const query = `
      CREATE contenido_generado CONTENT {
        generacion_request: type::thing("generacion_request", $requestId),
        contenido_raw: $contenido,
        metadata: $metadata,
        tokens_usados: $tokens,
        costo_estimado: $costo
      }
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      requestId: this.extractId(requestId),
      contenido: contenidoRaw,
      metadata,
      tokens: response.usage?.total_tokens ?? 0,
      costo: this.estimateCost(response),
    });
  }

  /**
   * Crea el registro de ExerciseContent.
   */
  private async createExerciseContent(
    instance: ExerciseInstance,
    contenido: any,
    requestId: string,
  ): Promise<ExerciseContent> {
    const query = `
      CREATE exercise_content CONTENT {
        exercise_instance: type::thing("exercise_instance", $instanceId),
        contenido: $contenido,
        estado: 'draft',
        generacion_request: type::thing("generacion_request", $requestId),
        version: 1
      }
      RETURN *;
    `;

    const result = await this.surrealDb.query<ExerciseContent[]>(query, {
      instanceId: this.extractId(String(instance.id)),
      contenido,
      requestId: this.extractId(requestId),
    });

    const content = result?.[0];

    if (!content) {
      throw new InternalServerErrorException('No se pudo crear exercise_content');
    }

    return content;
  }

  /**
   * Marca el request como completado.
   */
  private async markRequestCompleted(requestId: string) {
    const query = `
      UPDATE type::thing("generacion_request", $requestId)
      SET estado = 'completed',
          completed_at = time::now()
    `;

    await this.surrealDb.query(query, {
      requestId: this.extractId(requestId),
    });
  }

  /**
   * Estima el costo de la llamada a OpenAI.
   */
  private estimateCost(response: ChatCompletion): number {
    const usage = response.usage;
    if (!usage) return 0;

    // Precios aproximados (actualizar según pricing de OpenAI)
    const pricePerInputToken = 0.00015 / 1000; // $0.15 per 1M tokens input
    const pricePerOutputToken = 0.0006 / 1000; // $0.60 per 1M tokens output

    const inputCost = (usage.prompt_tokens || 0) * pricePerInputToken;
    const outputCost = (usage.completion_tokens || 0) * pricePerOutputToken;

    return inputCost + outputCost;
  }

  /**
   * Extrae el ID limpio de un RecordId.
   */
  private extractId(recordId: string): string {
    if (recordId.includes(':')) {
      return recordId.split(':')[1];
    }
    return recordId;
  }

  /**
   * Genera contenido para todas las instancias de un proof point (batch).
   */
  async generateBatchForProofPoint(
    proofPointId: string,
    userId: string,
  ): Promise<ExerciseContent[]> {
    // Obtener todas las instancias del proof point que no tienen contenido
    const instances = await this.instancesService.getInstancesByProofPoint(
      proofPointId,
    );

    const pendingInstances = instances.filter(
      (instance) => instance.estado_contenido === 'sin_generar',
    );

    this.logger.log(
      `Generación batch: ${pendingInstances.length} ejercicios pendientes`,
    );

    // Generar secuencialmente (para no sobrecargar OpenAI)
    const results: ExerciseContent[] = [];

    for (const instance of pendingInstances) {
      try {
        const content = await this.generateExerciseContent({
          exerciseInstanceId: String(instance.id),
          userId,
        });
        results.push(content);
      } catch (error) {
        this.logger.error(
          `Error generando ${instance.nombre}: ${error.message}`,
        );
        // Continuar con los siguientes aunque uno falle
      }
    }

    return results;
  }
}
