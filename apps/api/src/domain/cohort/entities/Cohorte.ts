import { AggregateRoot } from "../../shared/types/AggregateRoot";
import { RecordId } from "../../shared/value-objects/RecordId";
import { Timestamp } from "../../shared/value-objects/Timestamp";
import { CohortStatus } from "../value-objects/CohortStatus";

export interface CohorteProps {
  programa: RecordId;
  nombre: string;
  descripcion?: string;
  estado: CohortStatus;
  fechaInicio: Timestamp;
  fechaFinEstimada?: Timestamp;
  configuracion: Record<string, any>;
  snapshotPrograma?: RecordId;
  instructor?: RecordId;
  capacidadMaxima?: number;
  activo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class Cohorte extends AggregateRoot<CohorteProps> {
  private constructor(id: RecordId, props: CohorteProps) {
    super(id, props);
  }

  static create(
    programa: RecordId,
    nombre: string,
    fechaInicio: Timestamp,
    options?: {
      descripcion?: string;
      fechaFinEstimada?: Timestamp;
      configuracion?: Record<string, any>;
      instructor?: RecordId;
      capacidadMaxima?: number;
    },
    id?: RecordId,
  ): Cohorte {
    const cohorteId =
      id || RecordId.create("cohorte", `${Date.now()}_${Math.random()}`);

    const configuracion = options?.configuracion ?? {
      modoAcceso: "secuencial",
      permitirSaltarNiveles: false,
      reintentosIlimitados: false,
      notificaciones: {
        recordatorio_inactividad: {
          activo: true,
          dias: 3,
        },
        recordatorio_deadline: true,
        celebracion_completacion: true,
      },
    };

    return new Cohorte(cohorteId, {
      programa,
      nombre,
      descripcion: options?.descripcion,
      estado: CohortStatus.planned(),
      fechaInicio,
      fechaFinEstimada: options?.fechaFinEstimada,
      configuracion,
      snapshotPrograma: undefined,
      instructor: options?.instructor,
      capacidadMaxima: options?.capacidadMaxima,
      activo: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  static reconstitute(id: RecordId, props: CohorteProps): Cohorte {
    return new Cohorte(id, props);
  }

  getPrograma(): RecordId {
    return this.props.programa;
  }

  getNombre(): string {
    return this.props.nombre;
  }

  getDescripcion(): string | undefined {
    return this.props.descripcion;
  }

  getEstado(): CohortStatus {
    return this.props.estado;
  }

  getFechaInicio(): Timestamp {
    return this.props.fechaInicio;
  }

  getFechaFinEstimada(): Timestamp | undefined {
    return this.props.fechaFinEstimada;
  }

  getConfiguracion(): Record<string, any> {
    return this.props.configuracion;
  }

  getSnapshotPrograma(): RecordId | undefined {
    return this.props.snapshotPrograma;
  }

  getInstructor(): RecordId | undefined {
    return this.props.instructor;
  }

  getCapacidadMaxima(): number | undefined {
    return this.props.capacidadMaxima;
  }

  isActiva(): boolean {
    return this.props.activo;
  }

  getCreatedAt(): Timestamp {
    return this.props.createdAt;
  }

  getUpdatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  attachSnapshot(snapshotId: RecordId): void {
    this.props.snapshotPrograma = snapshotId;
    this.touch();
  }

  activate(): void {
    this.props.estado = CohortStatus.active();
    this.props.activo = true;
    this.touch();
  }

  finalize(): void {
    this.props.estado = CohortStatus.finished();
    this.props.activo = false;
    this.touch();
  }

  archive(): void {
    this.props.estado = CohortStatus.archived();
    this.props.activo = false;
    this.touch();
  }

  updateConfig(configuracion: Record<string, any>): void {
    this.props.configuracion = { ...configuracion };
    this.touch();
  }

  updateSchedule(fechaInicio: Timestamp, fechaFin?: Timestamp): void {
    this.props.fechaInicio = fechaInicio;
    this.props.fechaFinEstimada = fechaFin;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = Timestamp.now();
  }
}
