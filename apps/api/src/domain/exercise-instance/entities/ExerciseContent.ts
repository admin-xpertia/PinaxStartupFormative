import { Entity } from '../../shared/types/Entity';
import { RecordId } from '../../shared/value-objects/RecordId';
import { Timestamp } from '../../shared/value-objects/Timestamp';

/**
 * ExerciseContent Entity
 * Represents the generated content for an exercise instance
 */

export type ExerciseContentState = 'draft' | 'publicado';

export interface ExerciseContentProps {
  exerciseInstance: RecordId;
  contenido: Record<string, any>;
  estado: ExerciseContentState;
  generacionRequest?: RecordId; // Link to generation request for traceability
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ExerciseContent extends Entity<ExerciseContentProps> {
  private constructor(id: RecordId, props: ExerciseContentProps) {
    super(id, props);
  }

  /**
   * Creates new ExerciseContent (Factory method)
   */
  static create(
    exerciseInstanceId: RecordId,
    contenido: Record<string, any>,
    generacionRequestId?: RecordId,
    id?: RecordId,
  ): ExerciseContent {
    const contentId =
      id || RecordId.create('exercise_content', `${Date.now()}_${Math.random()}`);

    if (!contenido || Object.keys(contenido).length === 0) {
      throw new Error('Content cannot be empty');
    }

    const content = new ExerciseContent(contentId, {
      exerciseInstance: exerciseInstanceId,
      contenido,
      estado: 'draft',
      generacionRequest: generacionRequestId,
      version: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return content;
  }

  /**
   * Reconstitutes ExerciseContent from persistence
   */
  static reconstitute(id: RecordId, props: ExerciseContentProps): ExerciseContent {
    return new ExerciseContent(id, props);
  }

  // ========== Getters ==========

  getExerciseInstance(): RecordId {
    return this.props.exerciseInstance;
  }

  getContenido(): Record<string, any> {
    return { ...this.props.contenido };
  }

  getEstado(): ExerciseContentState {
    return this.props.estado;
  }

  getGeneracionRequest(): RecordId | undefined {
    return this.props.generacionRequest;
  }

  getVersion(): number {
    return this.props.version;
  }

  isDraft(): boolean {
    return this.props.estado === 'draft';
  }

  isPublicado(): boolean {
    return this.props.estado === 'publicado';
  }

  // ========== Business Methods ==========

  /**
   * Updates the content (only in draft state)
   */
  updateContenido(contenido: Record<string, any>): void {
    if (!this.isDraft()) {
      throw new Error('Cannot update published content');
    }

    if (!contenido || Object.keys(contenido).length === 0) {
      throw new Error('Content cannot be empty');
    }

    this.props.contenido = { ...contenido };
    this.props.version += 1;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates a specific field in the content
   */
  updateField(fieldName: string, value: any): void {
    if (!this.isDraft()) {
      throw new Error('Cannot update published content');
    }

    this.props.contenido[fieldName] = value;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Publishes the content (makes it immutable for cohorts)
   */
  publish(): void {
    if (this.isPublicado()) {
      throw new Error('Content is already published');
    }

    this.props.estado = 'publicado';
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Unpublishes the content (back to draft for editing)
   */
  unpublish(): void {
    if (this.isDraft()) {
      throw new Error('Content is already in draft state');
    }

    this.props.estado = 'draft';
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Validates content against a schema
   */
  validateAgainstSchema(schema: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation: check required fields from schema
    for (const [fieldName, fieldDef] of Object.entries(schema)) {
      if (fieldDef.required && !(fieldName in this.props.contenido)) {
        errors.push(`Required field "${fieldName}" is missing`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets a specific field from the content
   */
  getField(fieldName: string): any {
    return this.props.contenido[fieldName];
  }

  /**
   * Checks if a field exists in the content
   */
  hasField(fieldName: string): boolean {
    return fieldName in this.props.contenido;
  }

  // ========== Serialization ==========

  /**
   * Converts to a plain object for persistence
   * Note: created_at and updated_at are omitted - SurrealDB handles them automatically with DEFAULT time::now()
   */
  toPersistence(): any {
    return {
      id: this.getId().toString(),
      exercise_instance: this.props.exerciseInstance.toString(),
      contenido: this.props.contenido,
      estado: this.props.estado,
      generacion_request: this.props.generacionRequest?.toString(),
      version: this.props.version,
      // created_at and updated_at are handled by SurrealDB DEFAULT time::now()
    };
  }
}
