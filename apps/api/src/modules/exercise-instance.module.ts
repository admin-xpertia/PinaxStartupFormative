import { Module } from "@nestjs/common";
import { SurrealDbModule } from "../core/database/surrealdb.module";

// Import other modules for cross-module dependencies
import { ExerciseCatalogModule } from "./exercise-catalog.module";
import { ProgramDesignModule } from "./program-design.module";

// Mappers (reuse from ExerciseCatalogModule)
import { ExerciseMapper } from "../infrastructure/mappers/ExerciseMapper";

// Repositories
import { ExerciseInstanceRepository } from "../infrastructure/database/repositories/ExerciseInstanceRepository";
import { ExerciseContentRepository } from "../infrastructure/database/repositories/ExerciseContentRepository";

// Use Cases
import { AddExerciseToProofPointUseCase } from "../application/exercise-instance/use-cases/AddExerciseToProofPoint/AddExerciseToProofPointUseCase";
import { GenerateExerciseContentUseCase } from "../application/exercise-instance/use-cases/GenerateExerciseContent/GenerateExerciseContentUseCase";
import { AnalyzeDraftUseCase } from "../application/exercise-instance/use-cases/AnalyzeDraft/AnalyzeDraftUseCase";

// Services
import { OpenAIService } from "../infrastructure/ai/OpenAIService";

// Controllers
import { ExerciseInstanceController } from "../presentation/controllers/exercise-instance/exercise-instance.controller";

/**
 * ExerciseInstanceModule
 * Module for Exercise Instance bounded context
 *
 * Provides:
 * - ExerciseInstance and ExerciseContent repositories
 * - Use cases for exercise management
 * - REST API controllers
 */
@Module({
  imports: [
    SurrealDbModule,
    ExerciseCatalogModule, // For IExerciseTemplateRepository
    ProgramDesignModule, // For IProofPointRepository
  ],
  providers: [
    // Mappers (shared with ExerciseCatalogModule)
    ExerciseMapper,

    // Repositories - provided as their interface token for DI
    {
      provide: "IExerciseInstanceRepository",
      useClass: ExerciseInstanceRepository,
    },
    {
      provide: "IExerciseContentRepository",
      useClass: ExerciseContentRepository,
    },

    // Services
    OpenAIService,

    // Use Cases
    AddExerciseToProofPointUseCase,
    GenerateExerciseContentUseCase,
    AnalyzeDraftUseCase,
  ],
  controllers: [
    // REST API Controllers
    ExerciseInstanceController,
  ],
  exports: [
    // Export repositories for use in other modules
    "IExerciseInstanceRepository",
    "IExerciseContentRepository",

    // Export services
    OpenAIService,

    // Export use cases for controllers
    AddExerciseToProofPointUseCase,
    GenerateExerciseContentUseCase,
    AnalyzeDraftUseCase,

    // Export mapper for potential reuse
    ExerciseMapper,
  ],
})
export class ExerciseInstanceModule {}
