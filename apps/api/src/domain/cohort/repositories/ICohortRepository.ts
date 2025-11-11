import { IRepository } from "../../shared/repositories/IRepository";
import { Cohorte } from "../entities/Cohorte";
import { CohorteInscripcion } from "../entities/CohorteInscripcion";
import { RecordId } from "../../shared/value-objects/RecordId";

export interface ICohortRepository extends IRepository<Cohorte> {
  findByProgram(programaId: RecordId): Promise<Cohorte[]>;
}

export interface IEnrollmentRepository extends IRepository<CohorteInscripcion> {
  findByStudent(estudianteId: RecordId): Promise<CohorteInscripcion[]>;
  findByCohort(cohorteId: RecordId): Promise<CohorteInscripcion[]>;
  findByStudentAndCohort(
    estudianteId: RecordId,
    cohorteId: RecordId,
  ): Promise<CohorteInscripcion | null>;
}
