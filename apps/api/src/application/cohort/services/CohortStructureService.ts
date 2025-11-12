import { Inject, Injectable, Logger } from "@nestjs/common";
import type { ProgramStructure } from "@xpertia/types/enrollment";
import { ProgramSnapshotService } from "./ProgramSnapshotService";
import type { ICohortRepository } from "../../../domain/cohort/repositories/ICohortRepository";
import { RecordId } from "../../../domain/shared/value-objects/RecordId";
import { Cohorte } from "../../../domain/cohort/entities/Cohorte";

@Injectable()
export class CohortStructureService {
  private readonly logger = new Logger(CohortStructureService.name);

  constructor(
    @Inject("ICohortRepository")
    private readonly cohortRepository: ICohortRepository,
    private readonly programSnapshotService: ProgramSnapshotService,
  ) {}

  async ensureStructureForCohorte(
    cohorte: Cohorte,
    currentStructure?: ProgramStructure | null,
  ): Promise<ProgramStructure | null> {
    if (this.hasExercises(currentStructure)) {
      return currentStructure ?? null;
    }

    try {
      const { snapshotId, structure } =
        await this.programSnapshotService.createSnapshot(cohorte.getPrograma());
      cohorte.attachSnapshot(snapshotId);
      await this.cohortRepository.save(cohorte);
      return structure;
    } catch (error) {
      this.logger.warn(
        `No se pudo regenerar el snapshot para la cohorte ${cohorte
          .getId()
          .toString()}: ${error instanceof Error ? error.message : error}`,
      );
      return currentStructure ?? null;
    }
  }

  async ensureStructureByCohortId(
    cohortId: string,
    currentStructure?: ProgramStructure | null,
  ): Promise<ProgramStructure | null> {
    if (this.hasExercises(currentStructure)) {
      return currentStructure ?? null;
    }

    const recordId = RecordId.fromString(cohortId);
    const cohorte = await this.cohortRepository.findById(recordId);
    if (!cohorte) {
      this.logger.warn(
        `No se encontró la cohorte ${cohortId} para regenerar el snapshot`,
      );
      return currentStructure ?? null;
    }

    return this.ensureStructureForCohorte(cohorte, currentStructure);
  }

  private hasExercises(structure?: ProgramStructure | null): boolean {
    if (!structure) {
      return false;
    }

    return structure.phases.some((phase) =>
      phase.proofPoints.some((proofPoint) => proofPoint.exercises.length > 0),
    );
  }
}
