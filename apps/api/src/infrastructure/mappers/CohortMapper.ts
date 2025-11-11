import { Injectable } from "@nestjs/common";
import { Cohorte } from "../../domain/cohort/entities/Cohorte";
import { CohorteInscripcion } from "../../domain/cohort/entities/CohorteInscripcion";
import { CohortStatus } from "../../domain/cohort/value-objects/CohortStatus";
import { EnrollmentStatus } from "../../domain/cohort/value-objects/EnrollmentStatus";
import { RecordId } from "../../domain/shared/value-objects/RecordId";
import { Timestamp } from "../../domain/shared/value-objects/Timestamp";

@Injectable()
export class CohortMapper {
  cohorteToDomain(raw: any): Cohorte {
    const id = RecordId.fromString(raw.id);
    const programa = RecordId.fromString(raw.programa);

    return Cohorte.reconstitute(id, {
      programa,
      nombre: raw.nombre,
      descripcion: raw.descripcion,
      estado: CohortStatus.create(raw.estado),
      fechaInicio: Timestamp.fromISOString(raw.fecha_inicio),
      fechaFinEstimada: raw.fecha_fin
        ? Timestamp.fromISOString(raw.fecha_fin)
        : undefined,
      configuracion: raw.configuracion || {},
      snapshotPrograma: raw.snapshot_programa
        ? RecordId.fromString(raw.snapshot_programa)
        : undefined,
      instructor: raw.instructor
        ? RecordId.fromString(raw.instructor)
        : undefined,
      capacidadMaxima: raw.capacidad_maxima,
      activo: Boolean(raw.activo),
      createdAt: Timestamp.fromISOString(raw.created_at),
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  cohorteToPersistence(cohorte: Cohorte): any {
    return {
      nombre: cohorte.getNombre(),
      descripcion: cohorte.getDescripcion(),
      programa: cohorte.getPrograma().toString(),
      estado: cohorte.getEstado().getValue(),
      fecha_inicio: cohorte.getFechaInicio().toISOString(),
      fecha_fin: (cohorte.getFechaFinEstimada() ??
        cohorte.getFechaInicio().addDays(60)
      ).toISOString(),
      configuracion: cohorte.getConfiguracion(),
      snapshot_programa: cohorte.getSnapshotPrograma()
        ? cohorte.getSnapshotPrograma()!.toString()
        : undefined,
      instructor: cohorte.getInstructor()
        ? cohorte.getInstructor()!.toString()
        : undefined,
      capacidad_maxima: cohorte.getCapacidadMaxima(),
      activo: cohorte.isActiva(),
    };
  }

  enrollmentToDomain(raw: any): CohorteInscripcion {
    const id = RecordId.fromString(raw.id);
    const estudiante = RecordId.fromString(raw.estudiante);
    const cohorte = RecordId.fromString(raw.cohorte);

    return CohorteInscripcion.reconstitute(id, {
      estudiante,
      cohorte,
      estado: EnrollmentStatus.create(raw.estado),
      fechaInscripcion: Timestamp.fromISOString(raw.fecha_inscripcion),
      fechaFinalizacion: raw.fecha_completacion
        ? Timestamp.fromISOString(raw.fecha_completacion)
        : undefined,
      progresoGeneral: raw.progreso_general ?? 0,
      notasInstructor: raw.notas_instructor,
      ultimaActividad: raw.ultima_actividad
        ? Timestamp.fromISOString(raw.ultima_actividad)
        : undefined,
      createdAt: Timestamp.fromISOString(raw.created_at),
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  enrollmentToPersistence(enrollment: CohorteInscripcion): any {
    return {
      estudiante: enrollment.getEstudiante().toString(),
      cohorte: enrollment.getCohorte().toString(),
      estado: enrollment.getEstado().getValue(),
      fecha_inscripcion: enrollment.getFechaInscripcion().toISOString(),
      fecha_completacion: enrollment.getFechaFinalizacion()?.toISOString(),
      progreso_general: enrollment.getProgresoGeneral(),
      notas_instructor: enrollment.getNotasInstructor(),
      ultima_actividad: enrollment.getUltimaActividad()
        ? enrollment.getUltimaActividad()!.toISOString()
        : undefined,
    };
  }
}
