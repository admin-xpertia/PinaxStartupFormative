import { Entity } from '../../shared/types/Entity';
import { RecordId } from '../../shared/value-objects/RecordId';
import { Timestamp } from '../../shared/value-objects/Timestamp';
import { Duration } from '../value-objects/Duration';

/**
 * Fase Entity
 * Represents a phase within an educational program
 */

export interface FaseProps {
  programa: RecordId;
  numeroFase: number;
  nombre: string;
  descripcion?: string;
  objetivosAprendizaje: string[];
  duracion: Duration;
  orden: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class Fase extends Entity<FaseProps> {
  private constructor(id: RecordId, props: FaseProps) {
    super(id, props);
  }

  /**
   * Creates a new Fase (Factory method)
   */
  static create(
    programaId: RecordId,
    numeroFase: number,
    nombre: string,
    descripcion: string,
    duracionSemanas: number,
    orden: number,
    id?: RecordId,
  ): Fase {
    const faseId = id || RecordId.create('fase', `${Date.now()}_${Math.random()}`);

    if (nombre.trim().length < 3) {
      throw new Error('Fase name must be at least 3 characters');
    }

    if (numeroFase < 0) {
      throw new Error('Fase number cannot be negative');
    }

    if (orden < 0) {
      throw new Error('Fase order cannot be negative');
    }

    const fase = new Fase(faseId, {
      programa: programaId,
      numeroFase,
      nombre,
      descripcion,
      objetivosAprendizaje: [],
      duracion: Duration.weeks(duracionSemanas),
      orden,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return fase;
  }

  /**
   * Reconstitutes a Fase from persistence
   */
  static reconstitute(id: RecordId, props: FaseProps): Fase {
    return new Fase(id, props);
  }

  // ========== Getters ==========

  getPrograma(): RecordId {
    return this.props.programa;
  }

  getNumeroFase(): number {
    return this.props.numeroFase;
  }

  getNombre(): string {
    return this.props.nombre;
  }

  getDescripcion(): string | undefined {
    return this.props.descripcion;
  }

  getObjetivosAprendizaje(): string[] {
    return [...this.props.objetivosAprendizaje];
  }

  getDuracion(): Duration {
    return this.props.duracion;
  }

  getOrden(): number {
    return this.props.orden;
  }

  // ========== Business Methods ==========

  /**
   * Updates basic fase information
   */
  updateInfo(
    nombre?: string,
    descripcion?: string,
    duracionSemanas?: number,
  ): void {
    if (nombre) {
      if (nombre.trim().length < 3) {
        throw new Error('Fase name must be at least 3 characters');
      }
      this.props.nombre = nombre;
    }

    if (descripcion !== undefined) {
      this.props.descripcion = descripcion;
    }

    if (duracionSemanas !== undefined) {
      if (duracionSemanas <= 0) {
        throw new Error('Duration must be positive');
      }
      this.props.duracion = Duration.weeks(duracionSemanas);
    }

    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates learning objectives
   */
  updateObjetivosAprendizaje(objetivos: string[]): void {
    this.props.objetivosAprendizaje = [...objetivos];
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Adds a learning objective
   */
  addObjetivoAprendizaje(objetivo: string): void {
    if (!objetivo || objetivo.trim().length === 0) {
      throw new Error('Learning objective cannot be empty');
    }

    if (!this.props.objetivosAprendizaje.includes(objetivo)) {
      this.props.objetivosAprendizaje.push(objetivo);
      this.props.updatedAt = Timestamp.now();
    }
  }

  /**
   * Removes a learning objective
   */
  removeObjetivoAprendizaje(objetivo: string): void {
    const index = this.props.objetivosAprendizaje.indexOf(objetivo);
    if (index > -1) {
      this.props.objetivosAprendizaje.splice(index, 1);
      this.props.updatedAt = Timestamp.now();
    }
  }

  /**
   * Reorders the fase within the program
   */
  reorder(newOrden: number): void {
    if (newOrden < 0) {
      throw new Error('Order cannot be negative');
    }

    this.props.orden = newOrden;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates the fase number
   */
  updateNumeroFase(numeroFase: number): void {
    if (numeroFase < 0) {
      throw new Error('Fase number cannot be negative');
    }

    this.props.numeroFase = numeroFase;
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
      programa: this.props.programa.toString(),
      numero_fase: this.props.numeroFase,
      nombre: this.props.nombre,
      descripcion: this.props.descripcion,
      objetivos_aprendizaje: this.props.objetivosAprendizaje,
      duracion_semanas_estimada: this.props.duracion.toWeeks(),
      orden: this.props.orden,
      // created_at and updated_at are handled by SurrealDB DEFAULT time::now()
    };
  }
}
