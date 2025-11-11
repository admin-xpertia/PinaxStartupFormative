import { Inject, Injectable, Logger } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import { Timestamp } from "../../../../domain/shared/value-objects/Timestamp";
import { Cohorte } from "../../../../domain/cohort/entities/Cohorte";
import { ICohortRepository } from "../../../../domain/cohort/repositories/ICohortRepository";
import { IProgramRepository } from "../../../../domain/program-design/repositories/IProgramRepository";
import type { ProgramStructure } from "../../../../types/enrollment";
import { ProgramSnapshotService } from "../../services/ProgramSnapshotService";
import { CreateCohortDTO } from "./CreateCohortDTO";

export interface CreateCohortResponse {
  cohorteId: string;
  snapshotId: string;
  estado: string;
  structure: ProgramStructure;
}

@Injectable()
export class CreateCohortUseCase
  implements ICommand<CreateCohortDTO, CreateCohortResponse>
{
  private readonly logger = new Logger(CreateCohortUseCase.name);

  constructor(
    @Inject("ICohortRepository")
    private readonly cohortRepository: ICohortRepository,
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
    private readonly programSnapshotService: ProgramSnapshotService,
  ) {}

  async execute(
    request: CreateCohortDTO,
  ): Promise<Result<CreateCohortResponse, Error>> {
    try {
      const validation = this.validate(request);
      if (!validation.valid) {
        return Result.fail(new Error(validation.errors.join(", ")));
      }

      const programId = RecordId.fromString(request.programaId);
      const program = await this.programRepository.findById(programId);
      if (!program) {
        return Result.fail(new Error("El programa no existe"));
      }

      if (!program.getEstado().isPublished()) {
        return Result.fail(
          new Error("El programa debe estar publicado para crear cohortes"),
        );
      }

      const fechaInicio = Timestamp.fromISOString(request.fechaInicio);
      const fechaFin = request.fechaFinEstimada
        ? Timestamp.fromISOString(request.fechaFinEstimada)
        : undefined;
      const instructor = request.instructorId
        ? RecordId.fromString(request.instructorId)
        : undefined;

      const cohorte = Cohorte.create(programId, request.nombre, fechaInicio, {
        descripcion: request.descripcion,
        fechaFinEstimada: fechaFin,
        configuracion: request.configuracion,
        instructor,
        capacidadMaxima: request.capacidadMaxima,
      });

      if (request.autoActivate ?? true) {
        cohorte.activate();
      }

      const { snapshotId, structure } =
        await this.programSnapshotService.createSnapshot(programId);
      cohorte.attachSnapshot(snapshotId);

      const savedCohorte = await this.cohortRepository.save(cohorte);

      return Result.ok({
        cohorteId: savedCohorte.getId().toString(),
        snapshotId: snapshotId.toString(),
        estado: savedCohorte.getEstado().getValue(),
        structure,
      });
    } catch (error) {
      this.logger.error("Error creating cohort", error);
      return Result.fail(error as Error);
    }
  }

  private validate(request: CreateCohortDTO): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.programaId) {
      errors.push("El programa es obligatorio");
    }

    if (!request.nombre || request.nombre.trim().length < 3) {
      errors.push("El nombre debe tener al menos 3 caracteres");
    }

    if (!request.fechaInicio) {
      errors.push("La fecha de inicio es obligatoria");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
