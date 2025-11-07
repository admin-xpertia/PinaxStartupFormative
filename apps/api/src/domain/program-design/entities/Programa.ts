import { AggregateRoot } from '../../shared/types/AggregateRoot';
import { RecordId } from '../../shared/value-objects/RecordId';
import { Timestamp } from '../../shared/value-objects/Timestamp';
import { ProgramStatus } from '../value-objects/ProgramStatus';
import { Duration } from '../value-objects/Duration';
import { ProgramPublishedEvent } from '../events/ProgramPublishedEvent';

/**
 * Programa Entity (Aggregate Root)
 * Represents an educational program with its structure and metadata
 */

export interface ProgramaProps {
  nombre: string;
  descripcion?: string;
  duracion: Duration;
  estado: ProgramStatus;
  versionActual: number;
  categoria?: string;
  nivelDificultad?: 'principiante' | 'intermedio' | 'avanzado';
  imagenPortadaUrl?: string;
  objetivosAprendizaje?: string[];
  prerequisitos?: string[];
  audienciaObjetivo?: string;
  tags?: string[];
  visible: boolean;
  creador: RecordId; // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class Programa extends AggregateRoot<ProgramaProps> {
  private constructor(id: RecordId, props: ProgramaProps) {
    super(id, props);
  }

  /**
   * Creates a new Programa (Factory method)
   */
  static create(
    nombre: string,
    descripcion: string,
    duracionSemanas: number,
    creadorId: RecordId,
    id?: RecordId,
  ): Programa {
    const programaId =
      id || RecordId.create('programa', `${Date.now()}_${Math.random()}`);

    const programa = new Programa(programaId, {
      nombre,
      descripcion,
      duracion: Duration.weeks(duracionSemanas),
      estado: ProgramStatus.draft(),
      versionActual: 1,
      visible: true,
      creador: creadorId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return programa;
  }

  /**
   * Reconstitutes a Programa from persistence
   */
  static reconstitute(id: RecordId, props: ProgramaProps): Programa {
    return new Programa(id, props);
  }

  // ========== Getters ==========

  getNombre(): string {
    return this.props.nombre;
  }

  getDescripcion(): string | undefined {
    return this.props.descripcion;
  }

  getDuracion(): Duration {
    return this.props.duracion;
  }

  getEstado(): ProgramStatus {
    return this.props.estado;
  }

  getCreador(): RecordId {
    return this.props.creador;
  }

  getVersionActual(): number {
    return this.props.versionActual;
  }

  getCategoria(): string | undefined {
    return this.props.categoria;
  }

  getNivelDificultad(): 'principiante' | 'intermedio' | 'avanzado' | undefined {
    return this.props.nivelDificultad;
  }

  getImagenPortadaUrl(): string | undefined {
    return this.props.imagenPortadaUrl;
  }

  getObjetivosAprendizaje(): string[] | undefined {
    return this.props.objetivosAprendizaje;
  }

  getPrerequisitos(): string[] | undefined {
    return this.props.prerequisitos;
  }

  getAudienciaObjetivo(): string | undefined {
    return this.props.audienciaObjetivo;
  }

  getTags(): string[] | undefined {
    return this.props.tags;
  }

  isVisible(): boolean {
    return this.props.visible;
  }

  isDraft(): boolean {
    return this.props.estado.isDraft();
  }

  isPublished(): boolean {
    return this.props.estado.isPublished();
  }

  canEdit(): boolean {
    return this.props.estado.canEdit();
  }

  // ========== Business Methods ==========

  /**
   * Updates basic program information
   */
  updateInfo(
    nombre?: string,
    descripcion?: string,
    duracionSemanas?: number,
  ): void {
    if (!this.canEdit()) {
      throw new Error(
        `Cannot edit program in state: ${this.props.estado.toString()}`,
      );
    }

    if (nombre) {
      if (nombre.trim().length < 3) {
        throw new Error('Program name must be at least 3 characters');
      }
      this.props.nombre = nombre;
    }

    if (descripcion !== undefined) {
      this.props.descripcion = descripcion;
    }

    if (duracionSemanas !== undefined) {
      this.props.duracion = Duration.weeks(duracionSemanas);
    }

    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates program metadata
   */
  updateMetadata(metadata: {
    categoria?: string;
    nivelDificultad?: 'principiante' | 'intermedio' | 'avanzado';
    objetivosAprendizaje?: string[];
    prerequisitos?: string[];
    audienciaObjetivo?: string;
    tags?: string[];
  }): void {
    if (!this.canEdit()) {
      throw new Error('Cannot edit published program');
    }

    Object.assign(this.props, metadata);
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Publishes the program
   */
  publish(): void {
    if (!this.props.estado.canPublish()) {
      throw new Error(
        `Cannot publish program in state: ${this.props.estado.toString()}`,
      );
    }

    this.props.estado = ProgramStatus.published();
    this.props.updatedAt = Timestamp.now();

    // Emit domain event
    this.addDomainEvent(
      new ProgramPublishedEvent(this.getId(), this.props.nombre),
    );
  }

  /**
   * Archives the program
   */
  archive(): void {
    this.props.estado = ProgramStatus.archived();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Sets visibility
   */
  setVisible(visible: boolean): void {
    this.props.visible = visible;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates the version
   */
  updateVersion(newVersion: number): void {
    this.props.versionActual = newVersion;
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
      nombre: this.props.nombre,
      descripcion: this.props.descripcion,
      duracion_semanas: this.props.duracion.toWeeks(),
      estado: this.props.estado.getValue(),
      version_actual: this.props.versionActual,
      categoria: this.props.categoria,
      nivel_dificultad: this.props.nivelDificultad,
      imagen_portada_url: this.props.imagenPortadaUrl,
      objetivos_aprendizaje: this.props.objetivosAprendizaje,
      prerequisitos: this.props.prerequisitos,
      audiencia_objetivo: this.props.audienciaObjetivo,
      tags: this.props.tags,
      visible: this.props.visible,
      creador: this.props.creador.toString(),
      // created_at and updated_at are handled by SurrealDB DEFAULT time::now()
    };
  }
}
