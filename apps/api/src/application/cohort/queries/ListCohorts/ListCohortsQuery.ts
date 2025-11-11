import { Inject, Injectable, Logger } from "@nestjs/common";
import { IQuery } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { ICohortRepository } from "../../../../domain/cohort/repositories/ICohortRepository";
import { IProgramRepository } from "../../../../domain/program-design/repositories/IProgramRepository";
import { SurrealDbService } from "../../../../core/database/surrealdb.service";
import { Cohorte } from "../../../../domain/cohort/entities/Cohorte";
import { Programa } from "../../../../domain/program-design/entities/Programa";

export interface CohortListItem {
  cohorte: Cohorte;
  programa?: Programa | null;
  totalEstudiantes: number;
}

@Injectable()
export class ListCohortsQuery
  implements IQuery<Record<string, never>, CohortListItem[]>
{
  private readonly logger = new Logger(ListCohortsQuery.name);

  constructor(
    @Inject("ICohortRepository")
    private readonly cohortRepository: ICohortRepository,
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
    private readonly db: SurrealDbService,
  ) {}

  async execute(): Promise<Result<CohortListItem[], Error>> {
    try {
      const cohorts = await this.cohortRepository.findAll();
      const programsCache = new Map<string, Programa | null>();
      const enrollmentCounts = await this.getEnrollmentCounts();

      const items: CohortListItem[] = [];

      for (const cohorte of cohorts) {
        const programId = cohorte.getPrograma().toString();
        if (!programsCache.has(programId)) {
          const program = await this.programRepository.findById(
            cohorte.getPrograma(),
          );
          programsCache.set(programId, program);
        }

        items.push({
          cohorte,
          programa: programsCache.get(programId) ?? null,
          totalEstudiantes:
            enrollmentCounts.get(cohorte.getId().toString()) ?? 0,
        });
      }

      return Result.ok(items);
    } catch (error) {
      this.logger.error("Error listing cohorts", error);
      return Result.fail(error as Error);
    }
  }

  private async getEnrollmentCounts(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    const enrollments = await this.db.select<any>("inscripcion_cohorte");

    for (const enrollment of enrollments) {
      const cohorteId =
        typeof enrollment.cohorte === "string"
          ? enrollment.cohorte
          : enrollment.cohorte?.id;
      if (!cohorteId) continue;

      counts.set(cohorteId, (counts.get(cohorteId) ?? 0) + 1);
    }

    return counts;
  }
}
