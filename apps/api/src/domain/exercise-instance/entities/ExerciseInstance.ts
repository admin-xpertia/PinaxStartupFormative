import { AggregateRoot } from '../../shared/types/AggregateRoot';
import { RecordId } from '../../shared/value-objects/RecordId';
import { Timestamp } from '../../shared/value-objects/Timestamp';
import { ContentStatus } from '../value-objects/ContentStatus';
import { ExerciseContentGeneratedEvent } from '../events/ExerciseContentGeneratedEvent';

/**
 * ExerciseInstance Entity (Aggregate Root)
 * Represents an instance of an exercise template applied to a proof point
 */

export interface ExerciseInstanceProps {
  template: RecordId; // ExerciseTemplate ID
  proofPoint: RecordId; // ProofPoint ID
  nombre: string;
  descripcionBreve?: string;
  consideracionesContexto: string;
  configuracionPersonalizada: Record<string, any>;
  orden: number;
  duracionEstimadaMinutos: number;
  estadoContenido: ContentStatus;
  contenidoActual?: RecordId; // ExerciseContent ID
  esObligatorio: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ExerciseInstance extends AggregateRoot<ExerciseInstanceProps> {
  private constructor(id: RecordId, props: ExerciseInstanceProps) {
    super(id, props);
  }

  /**
   * Creates a new ExerciseInstance (Factory method)
   */
  static create(
    templateId: RecordId,
    proofPointId: RecordId,
    nombre: string,
    orden: number,
    duracionMinutos: number,
    configuracion: Record<string, any>,
    consideraciones?: string,
    id?: RecordId,
  ): ExerciseInstance {
    const instanceId =
      id || RecordId.create('exercise_instance', `${Date.now()}_${Math.random()}`);

    if (nombre.trim().length < 3) {
      throw new Error('Exercise instance name must be at least 3 characters');
    }

    if (orden < 0) {
      throw new Error('Exercise order cannot be negative');
    }

    if (duracionMinutos <= 0) {
      throw new Error('Duration must be positive');
    }

    const instance = new ExerciseInstance(instanceId, {
      template: templateId,
      proofPoint: proofPointId,
      nombre,
      consideracionesContexto: consideraciones || '',
      configuracionPersonalizada: configuracion,
      orden,
      duracionEstimadaMinutos: duracionMinutos,
      estadoContenido: ContentStatus.sinGenerar(),
      esObligatorio: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return instance;
  }

  /**
   * Reconstitutes an ExerciseInstance from persistence
   */
  static reconstitute(id: RecordId, props: ExerciseInstanceProps): ExerciseInstance {
    return new ExerciseInstance(id, props);
  }

  // ========== Getters ==========

  getTemplate(): RecordId {
    return this.props.template;
  }

  getProofPoint(): RecordId {
    return this.props.proofPoint;
  }

  getNombre(): string {
    return this.props.nombre;
  }

  getDescripcionBreve(): string | undefined {
    return this.props.descripcionBreve;
  }

  getConsideracionesContexto(): string {
    return this.props.consideracionesContexto;
  }

  getConfiguracionPersonalizada(): Record<string, any> {
    return { ...this.props.configuracionPersonalizada };
  }

  // Alias for convenience
  getConfiguracion(): Record<string, any> {
    return this.getConfiguracionPersonalizada();
  }

  getOrden(): number {
    return this.props.orden;
  }

  getDuracionEstimadaMinutos(): number {
    return this.props.duracionEstimadaMinutos;
  }

  getEstadoContenido(): ContentStatus {
    return this.props.estadoContenido;
  }

  getContenidoActual(): RecordId | undefined {
    return this.props.contenidoActual;
  }

  isObligatorio(): boolean {
    return this.props.esObligatorio;
  }

  hasContenido(): boolean {
    return this.props.contenidoActual !== undefined;
  }

  // ========== Business Methods ==========

  /**
   * Updates basic exercise instance information
   */
  updateInfo(
    nombre?: string,
    descripcionBreve?: string,
    duracionMinutos?: number,
  ): void {
    if (nombre) {
      if (nombre.trim().length < 3) {
        throw new Error('Exercise instance name must be at least 3 characters');
      }
      this.props.nombre = nombre;
    }

    if (descripcionBreve !== undefined) {
      this.props.descripcionBreve = descripcionBreve;
    }

    if (duracionMinutos !== undefined) {
      if (duracionMinutos <= 0) {
        throw new Error('Duration must be positive');
      }
      this.props.duracionEstimadaMinutos = duracionMinutos;
    }

    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates instructor context considerations
   */
  updateConsideracionesContexto(consideraciones: string): void {
    this.props.consideracionesContexto = consideraciones;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates custom configuration
   */
  updateConfiguracion(configuracion: Record<string, any>): void {
    this.props.configuracionPersonalizada = { ...configuracion };
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Reorders the exercise within the proof point
   */
  reorder(newOrden: number): void {
    if (newOrden < 0) {
      throw new Error('Order cannot be negative');
    }

    this.props.orden = newOrden;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Sets whether the exercise is mandatory
   */
  setObligatorio(obligatorio: boolean): void {
    this.props.esObligatorio = obligatorio;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Starts content generation
   */
  startGeneration(): void {
    if (!this.props.estadoContenido.canGenerate()) {
      throw new Error(
        `Cannot start generation in state: ${this.props.estadoContenido.toString()}`,
      );
    }

    this.props.estadoContenido = ContentStatus.generando();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Sets generated content as draft
   */
  setContentDraft(contenidoId: RecordId): void {
    if (!this.props.estadoContenido.isGenerando()) {
      throw new Error('Content must be in generando state');
    }

    this.props.contenidoActual = contenidoId;
    this.props.estadoContenido = ContentStatus.draft();
    this.props.updatedAt = Timestamp.now();

    // Emit domain event
    this.addDomainEvent(
      new ExerciseContentGeneratedEvent(
        this.getId(),
        contenidoId,
        this.props.nombre,
      ),
    );
  }

  /**
   * Publishes the exercise content
   */
  publishContent(): void {
    if (!this.props.estadoContenido.canPublish()) {
      throw new Error(
        `Cannot publish in state: ${this.props.estadoContenido.toString()}`,
      );
    }

    if (!this.props.contenidoActual) {
      throw new Error('Cannot publish without content');
    }

    this.props.estadoContenido = ContentStatus.publicado();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Unpublishes the content (back to draft)
   */
  unpublishContent(): void {
    if (!this.props.estadoContenido.isPublicado()) {
      throw new Error('Content must be published to unpublish');
    }

    this.props.estadoContenido = ContentStatus.draft();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Regenerates content (resets to sin_generar)
   */
  regenerateContent(): void {
    this.props.estadoContenido = ContentStatus.sinGenerar();
    this.props.contenidoActual = undefined;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates the content status directly
   * Use with caution - prefer specific methods like startGeneration(), setContentDraft(), etc.
   */
  updateEstadoContenido(status: ContentStatus): void {
    this.props.estadoContenido = status;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Sets the current content ID directly
   * Use with caution - prefer setContentDraft() for proper state management
   */
  setContenidoActual(contenidoId: RecordId): void {
    this.props.contenidoActual = contenidoId;
    this.props.updatedAt = Timestamp.now();
  }

  // ========== Serialization ==========

  /**
   * Converts to a plain object for persistence
   * Note: created_at and updated_at are omitted - SurrealDB handles them automatically with DEFAULT time::now()
   */
  toPersistence(): any {
    return {
      id: this.getId().toString(),
      template: this.props.template.toString(),
      proof_point: this.props.proofPoint.toString(),
      nombre: this.props.nombre,
      descripcion_breve: this.props.descripcionBreve,
      consideraciones_contexto: this.props.consideracionesContexto,
      configuracion_personalizada: this.props.configuracionPersonalizada,
      orden: this.props.orden,
      duracion_estimada_minutos: this.props.duracionEstimadaMinutos,
      estado_contenido: this.props.estadoContenido.getValue(),
      contenido_actual: this.props.contenidoActual?.toString(),
      es_obligatorio: this.props.esObligatorio,
      // created_at and updated_at are handled by SurrealDB DEFAULT time::now()
    };
  }
}
