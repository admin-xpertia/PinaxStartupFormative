import { Entity } from '../../shared/types/Entity';
import { RecordId } from '../../shared/value-objects/RecordId';
import { Timestamp } from '../../shared/value-objects/Timestamp';
import { ProofPointSlug } from '../value-objects/ProofPointSlug';
import { Duration } from '../value-objects/Duration';

/**
 * ProofPoint Entity
 * Represents a proof point within a phase
 */

export interface ProofPointProps {
  fase: RecordId;
  nombre: string;
  slug: ProofPointSlug;
  descripcion?: string;
  preguntaCentral?: string;
  ordenEnFase: number;
  duracion: Duration;
  tipoEntregableFinal?: string;
  documentacionContexto: string;
  prerequisitos: RecordId[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ProofPoint extends Entity<ProofPointProps> {
  private constructor(id: RecordId, props: ProofPointProps) {
    super(id, props);
  }

  /**
   * Creates a new ProofPoint (Factory method)
   */
  static create(
    faseId: RecordId,
    nombre: string,
    descripcion: string,
    ordenEnFase: number,
    duracionHoras: number,
    preguntaCentral?: string,
    id?: RecordId,
  ): ProofPoint {
    const proofPointId = id || RecordId.create('proof_point', `${Date.now()}_${Math.random()}`);

    if (nombre.trim().length < 3) {
      throw new Error('ProofPoint name must be at least 3 characters');
    }

    if (ordenEnFase < 0) {
      throw new Error('ProofPoint order cannot be negative');
    }

    if (duracionHoras <= 0) {
      throw new Error('Duration must be positive');
    }

    const slug = ProofPointSlug.fromName(nombre);

    const proofPoint = new ProofPoint(proofPointId, {
      fase: faseId,
      nombre,
      slug,
      descripcion,
      preguntaCentral,
      ordenEnFase,
      duracion: Duration.hours(duracionHoras),
      documentacionContexto: '',
      prerequisitos: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return proofPoint;
  }

  /**
   * Reconstitutes a ProofPoint from persistence
   */
  static reconstitute(id: RecordId, props: ProofPointProps): ProofPoint {
    return new ProofPoint(id, props);
  }

  // ========== Getters ==========

  getFase(): RecordId {
    return this.props.fase;
  }

  getNombre(): string {
    return this.props.nombre;
  }

  getSlug(): ProofPointSlug {
    return this.props.slug;
  }

  getDescripcion(): string | undefined {
    return this.props.descripcion;
  }

  getPreguntaCentral(): string | undefined {
    return this.props.preguntaCentral;
  }

  getOrdenEnFase(): number {
    return this.props.ordenEnFase;
  }

  getDuracion(): Duration {
    return this.props.duracion;
  }

  getTipoEntregableFinal(): string | undefined {
    return this.props.tipoEntregableFinal;
  }

  getDocumentacionContexto(): string {
    return this.props.documentacionContexto;
  }

  getPrerequisitos(): RecordId[] {
    return [...this.props.prerequisitos];
  }

  // ========== Business Methods ==========

  /**
   * Updates basic proof point information
   */
  updateInfo(
    nombre?: string,
    descripcion?: string,
    preguntaCentral?: string,
    duracionHoras?: number,
  ): void {
    if (nombre) {
      if (nombre.trim().length < 3) {
        throw new Error('ProofPoint name must be at least 3 characters');
      }
      this.props.nombre = nombre;
      this.props.slug = ProofPointSlug.fromName(nombre);
    }

    if (descripcion !== undefined) {
      this.props.descripcion = descripcion;
    }

    if (preguntaCentral !== undefined) {
      this.props.preguntaCentral = preguntaCentral;
    }

    if (duracionHoras !== undefined) {
      if (duracionHoras <= 0) {
        throw new Error('Duration must be positive');
      }
      this.props.duracion = Duration.hours(duracionHoras);
    }

    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates the documentation context for AI generation
   */
  updateDocumentacionContexto(documentacion: string): void {
    this.props.documentacionContexto = documentacion;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Adds a prerequisite proof point
   */
  addPrerequisite(prerequisitoId: RecordId): void {
    // Prevent self-prerequisite
    if (prerequisitoId.equals(this.getId())) {
      throw new Error('ProofPoint cannot be a prerequisite of itself');
    }

    // Check if already exists
    const exists = this.props.prerequisitos.some(p => p.equals(prerequisitoId));
    if (!exists) {
      this.props.prerequisitos.push(prerequisitoId);
      this.props.updatedAt = Timestamp.now();
    }
  }

  /**
   * Removes a prerequisite proof point
   */
  removePrerequisite(prerequisitoId: RecordId): void {
    const index = this.props.prerequisitos.findIndex(p => p.equals(prerequisitoId));
    if (index > -1) {
      this.props.prerequisitos.splice(index, 1);
      this.props.updatedAt = Timestamp.now();
    }
  }

  /**
   * Checks if this proof point has prerequisites
   */
  hasPrerequisites(): boolean {
    return this.props.prerequisitos.length > 0;
  }

  /**
   * Checks if a specific proof point is a prerequisite
   */
  hasPrerequisite(prerequisitoId: RecordId): boolean {
    return this.props.prerequisitos.some(p => p.equals(prerequisitoId));
  }

  /**
   * Sets the final deliverable type
   */
  setTipoEntregableFinal(tipo: string): void {
    this.props.tipoEntregableFinal = tipo;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Reorders the proof point within the fase
   */
  reorder(newOrden: number): void {
    if (newOrden < 0) {
      throw new Error('Order cannot be negative');
    }

    this.props.ordenEnFase = newOrden;
    this.props.updatedAt = Timestamp.now();
  }

  // ========== Serialization ==========

  /**
   * Converts to a plain object for persistence
   */
  toPersistence(): any {
    return {
      id: this.getId().toString(),
      fase: this.props.fase.toString(),
      nombre: this.props.nombre,
      slug: this.props.slug.toString(),
      descripcion: this.props.descripcion,
      pregunta_central: this.props.preguntaCentral,
      orden_en_fase: this.props.ordenEnFase,
      duracion_estimada_horas: this.props.duracion.toHours(),
      tipo_entregable_final: this.props.tipoEntregableFinal,
      documentacion_contexto: this.props.documentacionContexto,
      prerequisitos: this.props.prerequisitos.map(p => p.toString()),
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString(),
    };
  }
}
