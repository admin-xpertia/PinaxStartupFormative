import { Injectable } from '@nestjs/common';
import { ExerciseTemplate } from '../../domain/exercise-catalog/entities/ExerciseTemplate';
import { ExerciseInstance } from '../../domain/exercise-instance/entities/ExerciseInstance';
import { ExerciseContent } from '../../domain/exercise-instance/entities/ExerciseContent';
import { RecordId } from '../../domain/shared/value-objects/RecordId';
import { Timestamp } from '../../domain/shared/value-objects/Timestamp';
import { ExerciseCategory } from '../../domain/exercise-catalog/value-objects/ExerciseCategory';
import { ConfigurationSchema } from '../../domain/exercise-catalog/value-objects/ConfigurationSchema';
import { ContentStatus } from '../../domain/exercise-instance/value-objects/ContentStatus';

/**
 * ExerciseMapper
 * Maps between domain entities and database records for Exercise contexts
 */
@Injectable()
export class ExerciseMapper {
  /**
   * Maps database record to ExerciseTemplate domain entity
   */
  templateToDomain(raw: any): ExerciseTemplate {
    const id = RecordId.fromString(raw.id);
    const categoria = ExerciseCategory.create(raw.categoria);
    const configuracionSchema = ConfigurationSchema.create(raw.configuracion_schema || {});

    return ExerciseTemplate.reconstitute(id, {
      nombre: raw.nombre,
      categoria,
      descripcion: raw.descripcion,
      objetivoPedagogico: raw.objetivo_pedagogico,
      rolIA: raw.rol_ia,
      configuracionSchema,
      configuracionDefault: raw.configuracion_default || {},
      promptTemplate: raw.prompt_template,
      outputSchema: raw.output_schema || {},
      previewConfig: raw.preview_config || {},
      icono: raw.icono || categoria.getDefaultIcon(),
      color: raw.color || '#6366f1',
      esOficial: raw.es_oficial ?? true,
      activo: raw.activo ?? true,
      createdAt: Timestamp.fromISOString(raw.created_at),
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  /**
   * Maps ExerciseTemplate domain entity to database record
   */
  templateToPersistence(template: ExerciseTemplate): any {
    return template.toPersistence();
  }

  /**
   * Maps database record to ExerciseInstance domain entity
   */
  instanceToDomain(raw: any): ExerciseInstance {
    const id = RecordId.fromString(raw.id);
    const template = RecordId.fromString(raw.template);
    const proofPoint = RecordId.fromString(raw.proof_point);
    const estadoContenido = ContentStatus.create(raw.estado_contenido);

    const contenidoActual = raw.contenido_actual
      ? RecordId.fromString(raw.contenido_actual)
      : undefined;

    return ExerciseInstance.reconstitute(id, {
      template,
      proofPoint,
      nombre: raw.nombre,
      descripcionBreve: raw.descripcion_breve,
      consideracionesContexto: raw.consideraciones_contexto || '',
      configuracionPersonalizada: raw.configuracion_personalizada || {},
      orden: raw.orden,
      duracionEstimadaMinutos: raw.duracion_estimada_minutos,
      estadoContenido,
      contenidoActual,
      esObligatorio: raw.es_obligatorio ?? true,
      createdAt: Timestamp.fromISOString(raw.created_at),
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  /**
   * Maps ExerciseInstance domain entity to database record
   */
  instanceToPersistence(instance: ExerciseInstance): any {
    return instance.toPersistence();
  }

  /**
   * Maps database record to ExerciseContent domain entity
   */
  contentToDomain(raw: any): ExerciseContent {
    const id = RecordId.fromString(raw.id);
    const exerciseInstance = RecordId.fromString(raw.exercise_instance);

    const generacionRequest = raw.generacion_request
      ? RecordId.fromString(raw.generacion_request)
      : undefined;

    return ExerciseContent.reconstitute(id, {
      exerciseInstance,
      contenido: raw.contenido || {},
      estado: raw.estado,
      generacionRequest,
      version: raw.version || 1,
      createdAt: Timestamp.fromISOString(raw.created_at),
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  /**
   * Maps ExerciseContent domain entity to database record
   */
  contentToPersistence(content: ExerciseContent): any {
    return content.toPersistence();
  }
}
