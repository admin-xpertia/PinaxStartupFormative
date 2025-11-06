import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SurrealDbService } from 'src/core/database';
import {
  ExerciseInstance,
  ExerciseTemplate,
  ExerciseContent,
  RecordId,
} from '@repo/database/types';
import { ExerciseTemplatesService } from './exercise-templates.service';

export interface CreateExerciseInstanceDto {
  templateId: string;
  proofPointId: string;
  nombre: string;
  descripcionBreve?: string;
  consideracionesContexto?: string;
  configuracionPersonalizada?: Record<string, any>;
  orden: number;
  duracionEstimadaMinutos?: number;
  esObligatorio?: boolean;
}

export interface UpdateExerciseInstanceDto {
  nombre?: string;
  descripcionBreve?: string;
  consideracionesContexto?: string;
  configuracionPersonalizada?: Record<string, any>;
  orden?: number;
  duracionEstimadaMinutos?: number;
  esObligatorio?: boolean;
}

@Injectable()
export class ExerciseInstancesService {
  private readonly logger = new Logger(ExerciseInstancesService.name);

  constructor(
    private readonly surrealDb: SurrealDbService,
    private readonly templatesService: ExerciseTemplatesService,
  ) {}

  /**
   * Crea una nueva instancia de ejercicio en un proof point.
   */
  async createInstance(dto: CreateExerciseInstanceDto): Promise<ExerciseInstance> {
    const {
      templateId,
      proofPointId,
      nombre,
      descripcionBreve,
      consideracionesContexto,
      configuracionPersonalizada,
      orden,
      duracionEstimadaMinutos,
      esObligatorio,
    } = dto;

    // Validar que el template existe
    const template = await this.templatesService.getTemplateById(templateId);

    // Validar configuración personalizada si se proporciona
    if (configuracionPersonalizada) {
      const validation = this.templatesService.validateConfiguration(
        template,
        configuracionPersonalizada,
      );

      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Configuración inválida',
          errors: validation.errors,
        });
      }
    }

    // Mergear configuración default con personalizada
    const configuracionFinal = this.templatesService.mergeConfiguration(
      template,
      configuracionPersonalizada,
    );

    // Obtener duración por defecto del template si no se especifica
    const duracion =
      duracionEstimadaMinutos ||
      configuracionFinal.duracion_minutos ||
      template.configuracion_default.duracion_minutos ||
      20;

    const query = `
      CREATE exercise_instance CONTENT {
        template: type::thing("exercise_template", $templateId),
        proof_point: type::thing("proof_point", $proofPointId),
        nombre: $nombre,
        descripcion_breve: $descripcionBreve,
        consideraciones_contexto: $consideracionesContexto,
        configuracion_personalizada: $configuracionPersonalizada,
        orden: $orden,
        duracion_estimada_minutos: $duracion,
        estado_contenido: 'sin_generar',
        es_obligatorio: $esObligatorio
      }
      RETURN *;
    `;

    const result = await this.surrealDb.query<ExerciseInstance[]>(query, {
      templateId: this.extractId(templateId),
      proofPointId: this.extractId(proofPointId),
      nombre,
      descripcionBreve: descripcionBreve || null,
      consideracionesContexto: consideracionesContexto || '',
      configuracionPersonalizada: configuracionFinal,
      orden,
      duracion,
      esObligatorio: esObligatorio ?? true,
    });

    const instance = result?.[0];

    if (!instance) {
      throw new BadRequestException('No se pudo crear la instancia de ejercicio');
    }

    this.logger.log(
      `Instancia de ejercicio creada: ${nombre} (ID: ${instance.id}) para proof point ${proofPointId}`,
    );

    return instance;
  }

  /**
   * Obtiene todas las instancias de ejercicios de un proof point.
   */
  async getInstancesByProofPoint(proofPointId: string): Promise<ExerciseInstance[]> {
    const query = `
      SELECT *,
        template.* AS template_details
      FROM exercise_instance
      WHERE proof_point = type::thing("proof_point", $proofPointId)
      ORDER BY orden ASC
    `;

    const result = await this.surrealDb.query<ExerciseInstance[]>(query, {
      proofPointId: this.extractId(proofPointId),
    });

    this.logger.log(
      `Obtenidas ${result.length} instancias de ejercicios para proof point ${proofPointId}`,
    );

    return result;
  }

  /**
   * Obtiene una instancia específica de ejercicio por su ID.
   */
  async getInstanceById(instanceId: string): Promise<ExerciseInstance> {
    const query = `
      SELECT *,
        template.* AS template_details,
        proof_point.* AS proof_point_details
      FROM type::thing("exercise_instance", $instanceId)
    `;

    const result = await this.surrealDb.query<ExerciseInstance[]>(query, {
      instanceId: this.extractId(instanceId),
    });

    const instance = result?.[0];

    if (!instance) {
      throw new NotFoundException(
        `Instancia de ejercicio con ID ${instanceId} no encontrada`,
      );
    }

    return instance;
  }

  /**
   * Actualiza una instancia de ejercicio.
   */
  async updateInstance(
    instanceId: string,
    dto: UpdateExerciseInstanceDto,
  ): Promise<ExerciseInstance> {
    // Verificar que existe
    const instance = await this.getInstanceById(instanceId);

    // Si hay configuración nueva, validarla
    if (dto.configuracionPersonalizada) {
      const template = await this.templatesService.getTemplateById(
        String(instance.template),
      );

      const validation = this.templatesService.validateConfiguration(
        template,
        dto.configuracionPersonalizada,
      );

      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Configuración inválida',
          errors: validation.errors,
        });
      }
    }

    // Construir update query
    const updates: string[] = [];
    const params: Record<string, any> = { instanceId: this.extractId(instanceId) };

    if (dto.nombre !== undefined) {
      updates.push('nombre = $nombre');
      params.nombre = dto.nombre;
    }

    if (dto.descripcionBreve !== undefined) {
      updates.push('descripcion_breve = $descripcionBreve');
      params.descripcionBreve = dto.descripcionBreve;
    }

    if (dto.consideracionesContexto !== undefined) {
      updates.push('consideraciones_contexto = $consideracionesContexto');
      params.consideracionesContexto = dto.consideracionesContexto;
    }

    if (dto.configuracionPersonalizada !== undefined) {
      updates.push('configuracion_personalizada = $configuracionPersonalizada');
      params.configuracionPersonalizada = dto.configuracionPersonalizada;
    }

    if (dto.orden !== undefined) {
      updates.push('orden = $orden');
      params.orden = dto.orden;
    }

    if (dto.duracionEstimadaMinutos !== undefined) {
      updates.push('duracion_estimada_minutos = $duracion');
      params.duracion = dto.duracionEstimadaMinutos;
    }

    if (dto.esObligatorio !== undefined) {
      updates.push('es_obligatorio = $esObligatorio');
      params.esObligatorio = dto.esObligatorio;
    }

    if (updates.length === 0) {
      return instance; // Nada que actualizar
    }

    const query = `
      UPDATE type::thing("exercise_instance", $instanceId)
      SET ${updates.join(', ')}
      RETURN *;
    `;

    const result = await this.surrealDb.query<ExerciseInstance[]>(query, params);

    const updated = result?.[0];

    if (!updated) {
      throw new BadRequestException('No se pudo actualizar la instancia');
    }

    this.logger.log(`Instancia de ejercicio actualizada: ${instanceId}`);

    return updated;
  }

  /**
   * Elimina una instancia de ejercicio.
   */
  async deleteInstance(instanceId: string): Promise<void> {
    // Verificar que existe
    await this.getInstanceById(instanceId);

    const query = 'DELETE type::thing("exercise_instance", $instanceId)';

    await this.surrealDb.query(query, {
      instanceId: this.extractId(instanceId),
    });

    this.logger.log(`Instancia de ejercicio eliminada: ${instanceId}`);
  }

  /**
   * Reordena las instancias de ejercicios de un proof point.
   */
  async reorderInstances(
    proofPointId: string,
    ordenamiento: { instanceId: string; orden: number }[],
  ): Promise<void> {
    // Ejecutar updates en batch
    const queries = ordenamiento.map(({ instanceId, orden }) => ({
      query: `
        UPDATE type::thing("exercise_instance", $instanceId)
        SET orden = $orden
      `,
      params: {
        instanceId: this.extractId(instanceId),
        orden,
      },
    }));

    // Ejecutar todas las queries
    for (const { query, params } of queries) {
      await this.surrealDb.query(query, params);
    }

    this.logger.log(
      `Reordenadas ${ordenamiento.length} instancias para proof point ${proofPointId}`,
    );
  }

  /**
   * Duplica una instancia de ejercicio.
   */
  async duplicateInstance(instanceId: string): Promise<ExerciseInstance> {
    const original = await this.getInstanceById(instanceId);

    // Obtener el orden máximo actual para el proof point
    const maxOrdenQuery = `
      SELECT orden FROM exercise_instance
      WHERE proof_point = $proofPoint
      ORDER BY orden DESC
      LIMIT 1
    `;

    const maxOrdenResult = await this.surrealDb.query<{ orden: number }[]>(
      maxOrdenQuery,
      {
        proofPoint: original.proof_point,
      },
    );

    const nuevoOrden = (maxOrdenResult?.[0]?.orden || 0) + 1;

    // Crear duplicado
    return this.createInstance({
      templateId: String(original.template),
      proofPointId: String(original.proof_point),
      nombre: `${original.nombre} (Copia)`,
      descripcionBreve: original.descripcion_breve,
      consideracionesContexto: original.consideraciones_contexto,
      configuracionPersonalizada: original.configuracion_personalizada,
      orden: nuevoOrden,
      duracionEstimadaMinutos: original.duracion_estimada_minutos,
      esObligatorio: original.es_obligatorio,
    });
  }

  /**
   * Obtiene el contenido generado de una instancia.
   */
  async getInstanceContent(instanceId: string): Promise<ExerciseContent | null> {
    const instance = await this.getInstanceById(instanceId);

    if (!instance.contenido_actual) {
      return null;
    }

    const query = 'SELECT * FROM type::thing("exercise_content", $contentId)';

    const result = await this.surrealDb.query<ExerciseContent[]>(query, {
      contentId: this.extractId(String(instance.contenido_actual)),
    });

    return result?.[0] || null;
  }

  /**
   * Marca una instancia como "generando" contenido.
   */
  async markAsGenerating(instanceId: string): Promise<void> {
    const query = `
      UPDATE type::thing("exercise_instance", $instanceId)
      SET estado_contenido = 'generando'
    `;

    await this.surrealDb.query(query, {
      instanceId: this.extractId(instanceId),
    });
  }

  /**
   * Actualiza el estado del contenido de una instancia.
   */
  async updateContentStatus(
    instanceId: string,
    estado: 'sin_generar' | 'generando' | 'draft' | 'publicado',
    contentId?: string,
  ): Promise<void> {
    let query = `
      UPDATE type::thing("exercise_instance", $instanceId)
      SET estado_contenido = $estado
    `;

    const params: any = {
      instanceId: this.extractId(instanceId),
      estado,
    };

    if (contentId) {
      query += ', contenido_actual = type::thing("exercise_content", $contentId)';
      params.contentId = this.extractId(contentId);
    }

    await this.surrealDb.query(query, params);
  }

  /**
   * Extrae el ID limpio de un RecordId de SurrealDB.
   */
  private extractId(recordId: string): string {
    if (recordId.includes(':')) {
      return recordId.split(':')[1];
    }
    return recordId;
  }
}
