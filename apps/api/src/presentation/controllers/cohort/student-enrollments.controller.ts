import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetStudentEnrollmentsQuery } from "../../../application/cohort/queries/GetStudentEnrollments/GetStudentEnrollmentsQuery";
import { StudentEnrollmentResponseDto } from "../../dtos/cohort";
import type {
  StudentEnrollmentItem,
  GetStudentEnrollmentsParams,
} from "../../../application/cohort/queries/GetStudentEnrollments/GetStudentEnrollmentsQuery";
import type { ProgramStructure } from "@xpertia/types/enrollment";
import { Public } from "../../../core/decorators";
import { CohortStructureService } from "../../../application/cohort/services/CohortStructureService";
import { SurrealDbService } from "../../../core/database/surrealdb.service";
import { ProgramSnapshotService } from "../../../application/cohort/services/ProgramSnapshotService";
import { RecordId } from "../../../domain/shared/value-objects/RecordId";

interface ContinuePointDto {
  exerciseId: string;
  exerciseName: string;
  proofPointName: string;
  phaseName: string;
  progress: number;
  estimatedTimeRemaining: number;
  lastAccessedAt: string;
}

@ApiTags("student-enrollments")
@Controller("student/enrollments")
@ApiBearerAuth("JWT-auth")
@Public()
export class StudentEnrollmentsController {
  private readonly logger = new Logger(StudentEnrollmentsController.name);

  constructor(
    private readonly getStudentEnrollmentsQuery: GetStudentEnrollmentsQuery,
    private readonly cohortStructureService: CohortStructureService,
    private readonly db: SurrealDbService,
    private readonly programSnapshotService: ProgramSnapshotService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: "Listar inscripciones del estudiante actual",
  })
  @ApiQuery({
    name: "estudianteId",
    required: false,
    description:
      "ID del estudiante (si no se envía se usa DEFAULT_STUDENT_ID o estudiante:demo)",
  })
  @ApiResponse({
    status: 200,
    type: [StudentEnrollmentResponseDto],
  })
  async getEnrollments(
    @Query("estudianteId") estudianteId?: string,
  ): Promise<StudentEnrollmentResponseDto[]> {
    const resolvedId = this.resolveStudentId(estudianteId);
    const result = await this.getStudentEnrollmentsQuery.execute({
      estudianteId: resolvedId,
    });

    return result.match({
      ok: (items) => items.map((item) => this.mapEnrollment(item)),
      fail: (error) => {
        throw new BadRequestException(error.message);
      },
    });
  }

  @Public()
  @Get(":id")
  @ApiOperation({
    summary: "Detalle de una inscripción específica",
  })
  @ApiParam({
    name: "id",
    description: "ID de la inscripción",
    example: "inscripcion_cohorte:xyz123",
  })
  @ApiResponse({
    status: 200,
    type: StudentEnrollmentResponseDto,
  })
  async getEnrollment(
    @Param("id") id: string,
  ): Promise<StudentEnrollmentResponseDto> {
    const enrollment = await this.fetchEnrollmentById({ enrollmentId: id });
    return this.mapEnrollment(enrollment);
  }

  @Public()
  @Get(":id/structure")
  @ApiOperation({
    summary: "Estructura del programa para esta inscripción",
  })
  async getStructure(@Param("id") id: string): Promise<ProgramStructure> {
    const enrollment = await this.fetchEnrollmentById({ enrollmentId: id });
    if (!enrollment.snapshotStructure) {
      throw new NotFoundException(
        "La cohorte no tiene snapshot de programa configurado",
      );
    }
    return this.refreshProofPointExercises(enrollment.snapshotStructure);
  }

  @Public()
  @Get(":id/continue")
  @ApiOperation({
    summary: "Obtener punto de continuación del estudiante",
  })
  async getContinuePoint(
    @Param("id") id: string,
  ): Promise<ContinuePointDto | null> {
    const enrollment = await this.fetchEnrollmentById({ enrollmentId: id });
    const structure = enrollment.snapshotStructure
      ? await this.refreshProofPointExercises(enrollment.snapshotStructure)
      : null;

    if (!structure || structure.phases.length === 0) {
      return null;
    }

    for (const phase of structure.phases) {
      for (const proofPoint of phase.proofPoints) {
        if (proofPoint.exercises.length === 0) {
          continue;
        }

        const exercise = proofPoint.exercises.sort(
          (a, b) => a.orden - b.orden,
        )[0];

        if (!exercise) {
          continue;
        }

        const isPublished = await this.isExercisePublished(exercise.id);
        if (!isPublished) {
          continue;
        }

        return {
          exerciseId: exercise.id,
          exerciseName: exercise.nombre,
          proofPointName: proofPoint.nombre,
          phaseName: phase.nombre,
          progress: enrollment.overallProgress,
          estimatedTimeRemaining: exercise.duracionEstimada,
          lastAccessedAt: new Date().toISOString(),
        };
      }
    }

    return null;
  }

  private resolveStudentId(param?: string): string {
    return param || process.env.DEFAULT_STUDENT_ID || "estudiante:demo";
  }

  private async fetchEnrollmentById(
    params: GetStudentEnrollmentsParams,
  ): Promise<StudentEnrollmentItem> {
    const result = await this.getStudentEnrollmentsQuery.execute(params);

    const enrollment = result.match({
      ok: (items) => {
        if (!items.length) {
          throw new NotFoundException("Inscripción no encontrada");
        }
        return items[0];
      },
      fail: (error) => {
        throw new BadRequestException(error.message);
      },
    });

    const structure =
      await this.cohortStructureService.ensureStructureByCohortId(
        enrollment.cohortId,
        enrollment.snapshotStructure,
      );

    return {
      ...enrollment,
      snapshotStructure: structure,
    };
  }

  private async isExercisePublished(exerciseId: string): Promise<boolean> {
    try {
      const result = await this.db.query<any>(
        "SELECT estado_contenido FROM type::thing($id)",
        { id: exerciseId },
      );

      const record = Array.isArray(result)
        ? Array.isArray(result[0])
          ? result[0][0]
          : result[0]
        : null;

      return record?.estado_contenido === "publicado";
    } catch (error) {
      this.logger.warn(
        `No se pudo verificar el estado de publicación del ejercicio ${exerciseId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return false;
    }
  }

  private async refreshProofPointExercises(
    structure: ProgramStructure,
  ): Promise<ProgramStructure> {
    const phases = [];

    for (const phase of structure.phases) {
      const updatedProofPoints = [];

      for (const proofPoint of phase.proofPoints) {
        const publishedExercises =
          await this.programSnapshotService.getPublishedExercisesStructure(
            RecordId.fromString(proofPoint.id),
          );

        updatedProofPoints.push({
          ...proofPoint,
          exercises: publishedExercises,
        });
      }

      phases.push({
        ...phase,
        proofPoints: updatedProofPoints,
      });
    }

    return {
      ...structure,
      phases,
    };
  }

  private mapEnrollment(
    enrollment: StudentEnrollmentItem,
  ): StudentEnrollmentResponseDto {
    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      cohortId: enrollment.cohortId,
      programId: enrollment.programId,
      programName: enrollment.programName,
      programDescription: enrollment.programDescription,
      instructorName: enrollment.instructorName,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      status: enrollment.status,
      overallProgress: enrollment.overallProgress,
      completedProofPoints: enrollment.completedProofPoints,
      totalProofPoints: enrollment.totalProofPoints,
      estimatedCompletionDate: enrollment.estimatedCompletionDate
        ? enrollment.estimatedCompletionDate.toISOString()
        : undefined,
      currentPhaseId: enrollment.currentPhaseId,
      currentProofPointId: enrollment.currentProofPointId,
      currentExerciseId: enrollment.currentExerciseId,
      snapshotStructure: enrollment.snapshotStructure,
    };
  }
}
