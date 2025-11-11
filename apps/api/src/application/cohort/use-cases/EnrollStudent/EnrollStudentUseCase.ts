import { Inject, Injectable, Logger } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import {
  ICohortRepository,
  IEnrollmentRepository,
} from "../../../../domain/cohort/repositories/ICohortRepository";
import { CohorteInscripcion } from "../../../../domain/cohort/entities/CohorteInscripcion";
import { EnrollmentStatus } from "../../../../domain/cohort/value-objects/EnrollmentStatus";
import { EnrollStudentDTO } from "./EnrollStudentDTO";

export interface EnrollStudentResponse {
  inscripcionId: string;
  estado: string;
}

@Injectable()
export class EnrollStudentUseCase
  implements ICommand<EnrollStudentDTO, EnrollStudentResponse>
{
  private readonly logger = new Logger(EnrollStudentUseCase.name);

  constructor(
    @Inject("ICohortRepository")
    private readonly cohortRepository: ICohortRepository,
    @Inject("IEnrollmentRepository")
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  async execute(
    request: EnrollStudentDTO,
  ): Promise<Result<EnrollStudentResponse, Error>> {
    try {
      if (!request.cohorteId || !request.estudianteId) {
        return Result.fail(
          new Error("cohorteId y estudianteId son obligatorios"),
        );
      }

      const cohorteId = RecordId.fromString(request.cohorteId);
      const estudianteId = RecordId.fromString(request.estudianteId);

      const cohort = await this.cohortRepository.findById(cohorteId);
      if (!cohort) {
        return Result.fail(new Error("La cohorte no existe"));
      }

      const existing = await this.enrollmentRepository.findByStudentAndCohort(
        estudianteId,
        cohorteId,
      );
      if (existing) {
        return Result.fail(
          new Error("El estudiante ya está inscrito en la cohorte"),
        );
      }

      const enrollment = CohorteInscripcion.create(estudianteId, cohorteId);
      if (request.estado && request.estado !== "activo") {
        enrollment.setEstado(EnrollmentStatus.create(request.estado));
      }

      const saved = await this.enrollmentRepository.save(enrollment);

      return Result.ok({
        inscripcionId: saved.getId().toString(),
        estado: saved.getEstado().getValue(),
      });
    } catch (error) {
      this.logger.error("Error enrolling student", error);
      return Result.fail(error as Error);
    }
  }
}
