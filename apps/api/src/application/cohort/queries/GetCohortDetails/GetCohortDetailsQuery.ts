import { Inject, Injectable, Logger } from "@nestjs/common";
import { IQuery } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import {
  ICohortRepository,
  IEnrollmentRepository,
} from "../../../../domain/cohort/repositories/ICohortRepository";
import { IProgramRepository } from "../../../../domain/program-design/repositories/IProgramRepository";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import { SurrealDbService } from "../../../../core/database/surrealdb.service";
import type { ProgramStructure } from "@xpertia/types/enrollment";
import { Cohorte } from "../../../../domain/cohort/entities/Cohorte";
import { Programa } from "../../../../domain/program-design/entities/Programa";

export interface CohortDetailsResult {
  cohorte: Cohorte;
  programa?: Programa | null;
  structure?: ProgramStructure | null;
  totalEstudiantes: number;
}

@Injectable()
export class GetCohortDetailsQuery
  implements IQuery<{ cohorteId: string }, CohortDetailsResult>
{
  private readonly logger = new Logger(GetCohortDetailsQuery.name);

  constructor(
    @Inject("ICohortRepository")
    private readonly cohortRepository: ICohortRepository,
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
    @Inject("IEnrollmentRepository")
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly db: SurrealDbService,
  ) {}

  async execute(request: {
    cohorteId: string;
  }): Promise<Result<CohortDetailsResult, Error>> {
    try {
      const cohorteId = RecordId.fromString(request.cohorteId);
      const cohorte = await this.cohortRepository.findById(cohorteId);

      if (!cohorte) {
        return Result.fail(new Error("Cohorte no encontrada"));
      }

      const programa = await this.programRepository.findById(
        cohorte.getPrograma(),
      );
      const totalEstudiantes = (
        await this.enrollmentRepository.findByCohort(cohorte.getId())
      ).length;
      const structure = await this.getSnapshotStructure(
        cohorte.getSnapshotPrograma(),
      );

      return Result.ok({
        cohorte,
        programa,
        structure,
        totalEstudiantes,
      });
    } catch (error) {
      this.logger.error("Error getting cohort details", error);
      return Result.fail(error as Error);
    }
  }

  private async getSnapshotStructure(
    snapshotId?: RecordId,
  ): Promise<ProgramStructure | null> {
    if (!snapshotId) {
      return null;
    }

    const result = await this.db.select<any>(snapshotId.toString());
    if (!result || result.length === 0) {
      return null;
    }

    const metadata = result[0]?.metadata;
    if (metadata?.structure) {
      return metadata.structure as ProgramStructure;
    }

    return null;
  }
}
