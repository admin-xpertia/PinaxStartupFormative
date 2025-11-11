import { Inject, Injectable, Logger } from "@nestjs/common";
import { IQuery } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import {
  ICohortRepository,
  IEnrollmentRepository,
} from "../../../../domain/cohort/repositories/ICohortRepository";
import { CohorteInscripcion } from "../../../../domain/cohort/entities/CohorteInscripcion";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import { IProgramRepository } from "../../../../domain/program-design/repositories/IProgramRepository";
import type { Enrollment } from "../../../../types/enrollment";
import type { ProgramStructure } from "../../../../types/enrollment";
import { SurrealDbService } from "../../../../core/database/surrealdb.service";

export interface StudentEnrollmentItem extends Enrollment {
  id: string;
  snapshotStructure?: ProgramStructure | null;
}

export interface GetStudentEnrollmentsParams {
  estudianteId?: string;
  enrollmentId?: string;
}

@Injectable()
export class GetStudentEnrollmentsQuery
  implements IQuery<GetStudentEnrollmentsParams, StudentEnrollmentItem[]>
{
  private readonly logger = new Logger(GetStudentEnrollmentsQuery.name);

  constructor(
    @Inject("IEnrollmentRepository")
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject("ICohortRepository")
    private readonly cohortRepository: ICohortRepository,
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
    private readonly db: SurrealDbService,
  ) {}

  async execute(
    request: GetStudentEnrollmentsParams,
  ): Promise<Result<StudentEnrollmentItem[], Error>> {
    try {
      let enrollments: CohorteInscripcion[];

      if (request.enrollmentId) {
        const enrollment = await this.enrollmentRepository.findById(
          RecordId.fromString(request.enrollmentId),
        );
        if (!enrollment) {
          return Result.ok([]);
        }
        enrollments = [enrollment];
      } else if (request.estudianteId) {
        const estudianteId = RecordId.fromString(request.estudianteId);
        enrollments =
          await this.enrollmentRepository.findByStudent(estudianteId);
      } else {
        return Result.fail(
          new Error("Debe proporcionar estudianteId o enrollmentId"),
        );
      }

      const instructorCache = new Map<string, string>();
      const items: StudentEnrollmentItem[] = [];

      for (const enrollment of enrollments) {
        const cohorte = await this.cohortRepository.findById(
          enrollment.getCohorte(),
        );
        if (!cohorte) {
          continue;
        }

        const programa = await this.programRepository.findById(
          cohorte.getPrograma(),
        );
        if (!programa) {
          continue;
        }

        const structure = await this.getSnapshotStructure(
          cohorte.getSnapshotPrograma(),
        );
        const totalProofPoints =
          structure?.phases.reduce(
            (acc, phase) => acc + phase.proofPoints.length,
            0,
          ) ?? 0;

        const instructorId = programa.getCreador().toString();
        if (!instructorCache.has(instructorId)) {
          const instructorRecord = await this.db.select<any>(instructorId);
          instructorCache.set(
            instructorId,
            instructorRecord?.[0]?.nombre ?? "Instructor",
          );
        }

        items.push({
          id: enrollment.getId().toString(),
          studentId: enrollment.getEstudiante().toString(),
          cohortId: cohorte.getId().toString(),
          programId: programa.getId().toString(),
          programName: programa.getNombre(),
          programDescription: programa.getDescripcion() || "",
          instructorName: instructorCache.get(instructorId) ?? "Instructor",
          enrolledAt: new Date(enrollment.getFechaInscripcion().toISOString()),
          status: this.mapStatus(enrollment.getEstado().getValue()),
          overallProgress: enrollment.getProgresoGeneral(),
          completedProofPoints: Math.round(
            (enrollment.getProgresoGeneral() / 100) * totalProofPoints,
          ),
          totalProofPoints,
          estimatedCompletionDate: cohorte.getFechaFinEstimada()
            ? new Date(cohorte.getFechaFinEstimada()!.toISOString())
            : undefined,
          currentPhaseId: undefined,
          currentProofPointId: undefined,
          currentExerciseId: undefined,
          snapshotStructure: structure,
        });
      }

      return Result.ok(items);
    } catch (error) {
      this.logger.error("Error getting student enrollments", error);
      return Result.fail(error as Error);
    }
  }

  private mapStatus(status: string): Enrollment["status"] {
    switch (status) {
      case "completado":
        return "completed";
      case "abandonado":
      case "suspendido":
        return "dropped";
      default:
        return "active";
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

    return result[0]?.metadata?.structure ?? null;
  }
}
