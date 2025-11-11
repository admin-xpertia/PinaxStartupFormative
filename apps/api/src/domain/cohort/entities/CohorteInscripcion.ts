import { AggregateRoot } from "../../shared/types/AggregateRoot";
import { RecordId } from "../../shared/value-objects/RecordId";
import { Timestamp } from "../../shared/value-objects/Timestamp";
import { EnrollmentStatus } from "../value-objects/EnrollmentStatus";

export interface CohorteInscripcionProps {
  estudiante: RecordId;
  cohorte: RecordId;
  estado: EnrollmentStatus;
  fechaInscripcion: Timestamp;
  fechaFinalizacion?: Timestamp;
  progresoGeneral: number;
  notasInstructor?: string;
  ultimaActividad?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class CohorteInscripcion extends AggregateRoot<CohorteInscripcionProps> {
  private constructor(id: RecordId, props: CohorteInscripcionProps) {
    super(id, props);
  }

  static create(
    estudiante: RecordId,
    cohorte: RecordId,
    id?: RecordId,
  ): CohorteInscripcion {
    const inscripcionId =
      id ||
      RecordId.create("inscripcion_cohorte", `${Date.now()}_${Math.random()}`);

    return new CohorteInscripcion(inscripcionId, {
      estudiante,
      cohorte,
      estado: EnrollmentStatus.active(),
      fechaInscripcion: Timestamp.now(),
      progresoGeneral: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  static reconstitute(
    id: RecordId,
    props: CohorteInscripcionProps,
  ): CohorteInscripcion {
    return new CohorteInscripcion(id, props);
  }

  getEstudiante(): RecordId {
    return this.props.estudiante;
  }

  getCohorte(): RecordId {
    return this.props.cohorte;
  }

  getEstado(): EnrollmentStatus {
    return this.props.estado;
  }

  getProgresoGeneral(): number {
    return this.props.progresoGeneral;
  }

  getFechaInscripcion(): Timestamp {
    return this.props.fechaInscripcion;
  }

  getFechaFinalizacion(): Timestamp | undefined {
    return this.props.fechaFinalizacion;
  }

  getNotasInstructor(): string | undefined {
    return this.props.notasInstructor;
  }

  getUltimaActividad(): Timestamp | undefined {
    return this.props.ultimaActividad;
  }

  getCreatedAt(): Timestamp {
    return this.props.createdAt;
  }

  getUpdatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  updateProgreso(porcentaje: number): void {
    this.props.progresoGeneral = Math.max(0, Math.min(100, porcentaje));
    this.touch();
  }

  setEstado(estado: EnrollmentStatus): void {
    this.props.estado = estado;
    this.touch();
  }

  updateNotas(notas: string): void {
    this.props.notasInstructor = notas;
    this.touch();
  }

  marcarFinalizado(): void {
    this.props.estado = EnrollmentStatus.completed();
    this.props.fechaFinalizacion = Timestamp.now();
    this.touch();
  }

  marcarAbandonado(): void {
    this.props.estado = EnrollmentStatus.dropped();
    this.touch();
  }

  actualizarUltimaActividad(timestamp: Timestamp): void {
    this.props.ultimaActividad = timestamp;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = Timestamp.now();
  }
}
