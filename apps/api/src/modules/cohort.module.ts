import { Module } from "@nestjs/common";
import { SurrealDbModule } from "../core/database/surrealdb.module";
import { ProgramDesignModule } from "./program-design.module";
import { ExerciseInstanceModule } from "./exercise-instance.module";
import { CohortMapper } from "../infrastructure/mappers/CohortMapper";
import {
  CohortRepository,
  CohortEnrollmentRepository,
} from "../infrastructure/database/repositories";
import { ProgramSnapshotService } from "../application/cohort/services/ProgramSnapshotService";
import { CreateCohortUseCase } from "../application/cohort/use-cases/CreateCohort/CreateCohortUseCase";
import { EnrollStudentUseCase } from "../application/cohort/use-cases/EnrollStudent/EnrollStudentUseCase";
import { ListCohortsQuery } from "../application/cohort/queries/ListCohorts/ListCohortsQuery";
import { GetCohortDetailsQuery } from "../application/cohort/queries/GetCohortDetails/GetCohortDetailsQuery";
import { GetStudentEnrollmentsQuery } from "../application/cohort/queries/GetStudentEnrollments/GetStudentEnrollmentsQuery";
import { CohortController } from "../presentation/controllers/cohort/cohort.controller";
import { StudentEnrollmentsController } from "../presentation/controllers/cohort/student-enrollments.controller";

@Module({
  imports: [SurrealDbModule, ProgramDesignModule, ExerciseInstanceModule],
  providers: [
    CohortMapper,
    ProgramSnapshotService,
    {
      provide: "ICohortRepository",
      useClass: CohortRepository,
    },
    {
      provide: "IEnrollmentRepository",
      useClass: CohortEnrollmentRepository,
    },
    CreateCohortUseCase,
    EnrollStudentUseCase,
    ListCohortsQuery,
    GetCohortDetailsQuery,
    GetStudentEnrollmentsQuery,
  ],
  controllers: [CohortController, StudentEnrollmentsController],
  exports: [
    "ICohortRepository",
    "IEnrollmentRepository",
    ProgramSnapshotService,
    CreateCohortUseCase,
    EnrollStudentUseCase,
    ListCohortsQuery,
    GetCohortDetailsQuery,
    GetStudentEnrollmentsQuery,
  ],
})
export class CohortModule {}
