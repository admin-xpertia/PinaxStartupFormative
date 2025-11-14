import { Module } from "@nestjs/common";
import { SurrealDbModule } from "../core/database/surrealdb.module";

// Mappers
import { ProgramMapper } from "../infrastructure/mappers/ProgramMapper";

// Repositories
import { ProgramRepository } from "../infrastructure/database/repositories/ProgramRepository";
import { FaseRepository } from "../infrastructure/database/repositories/FaseRepository";
import { ProofPointRepository } from "../infrastructure/database/repositories/ProofPointRepository";
import { FaseDocumentationRepository } from "../infrastructure/database/repositories/FaseDocumentationRepository";

// Use Cases
import { CreateProgramUseCase } from "../application/program-design/use-cases/CreateProgram/CreateProgramUseCase";
import { PublishProgramUseCase } from "../application/program-design/use-cases/PublishProgram/PublishProgramUseCase";
import { ArchiveProgramUseCase } from "../application/program-design/use-cases/ArchiveProgram/ArchiveProgramUseCase";
import { AddFaseToProgramUseCase } from "../application/program-design/use-cases/AddFaseToProgram/AddFaseToProgramUseCase";
import { AddProofPointToFaseUseCase } from "../application/program-design/use-cases/AddProofPointToFase/AddProofPointToFaseUseCase";
import { RecommendExercisePlanUseCase } from "../application/program-design/use-cases/RecommendExercisePlan/RecommendExercisePlanUseCase";

// Controllers
import { ProgramController } from "../presentation/controllers/program-design/program.controller";
import { FaseController } from "../presentation/controllers/program-design/fase.controller";
import { ProofPointController } from "../presentation/controllers/program-design/proof-point.controller";

// Import modules that provide dependencies for the new UseCase
import { ExerciseCatalogModule } from "./exercise-catalog.module";
import { ExerciseInstanceModule } from "./exercise-instance.module";

/**
 * ProgramDesignModule
 * Module for Program Design bounded context
 *
 * Provides:
 * - Domain repositories
 * - Use cases
 * - Infrastructure mappers
 * - REST API controllers
 */
@Module({
  imports: [SurrealDbModule, ExerciseCatalogModule, ExerciseInstanceModule],
  providers: [
    // Mappers
    ProgramMapper,

    // Repositories - provided as their interface token for DI
    {
      provide: "IProgramRepository",
      useClass: ProgramRepository,
    },
    {
      provide: "IFaseRepository",
      useClass: FaseRepository,
    },
    {
      provide: "IProofPointRepository",
      useClass: ProofPointRepository,
    },
    {
      provide: "IFaseDocumentationRepository",
      useClass: FaseDocumentationRepository,
    },

    // Use Cases
    CreateProgramUseCase,
    PublishProgramUseCase,
    ArchiveProgramUseCase,
    AddFaseToProgramUseCase,
    AddProofPointToFaseUseCase,
    RecommendExercisePlanUseCase,
  ],
  controllers: [
    // REST API Controllers
    ProgramController,
    FaseController,
    ProofPointController,
  ],
  exports: [
    // Export repositories for use in other modules
    "IProgramRepository",
    "IFaseRepository",
    "IProofPointRepository",
    "IFaseDocumentationRepository",

    // Export use cases for controllers
    CreateProgramUseCase,
    PublishProgramUseCase,
    ArchiveProgramUseCase,
    AddFaseToProgramUseCase,
    AddProofPointToFaseUseCase,
    RecommendExercisePlanUseCase,

    // Export mapper for potential reuse
    ProgramMapper,
  ],
})
export class ProgramDesignModule {}
