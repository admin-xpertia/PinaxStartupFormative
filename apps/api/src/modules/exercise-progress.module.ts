import { Module } from "@nestjs/common";
import { SurrealDbModule } from "../core/database/surrealdb.module";

// Controllers
import { ExerciseProgressController } from "../presentation/controllers/exercise-progress/exercise-progress.controller";

// Services
import { OpenAIService } from "../infrastructure/ai/OpenAIService";
import { ShadowMonitorService } from "../application/exercise-instance/services/ShadowMonitorService";
import { SubmitExerciseForGradingUseCase } from "../application/exercise-progress/use-cases/SubmitExerciseForGrading/SubmitExerciseForGradingUseCase";
import { ReviewAndGradeSubmissionUseCase } from "../application/exercise-progress/use-cases/ReviewAndGradeSubmission/ReviewAndGradeSubmissionUseCase";
import { RolesGuard } from "../core/guards/roles.guard";

/**
 * ExerciseProgressModule
 * Module for Exercise Progress Management (Student Progress Tracking)
 *
 * Provides:
 * - REST API endpoints for students to track exercise progress
 * - Start, save progress, and complete exercises
 * - AI-powered feedback generation
 * - Semantic validation through Shadow Monitor
 */
@Module({
  imports: [SurrealDbModule],
  controllers: [ExerciseProgressController],
  providers: [
    OpenAIService,
    ShadowMonitorService,
    SubmitExerciseForGradingUseCase,
    ReviewAndGradeSubmissionUseCase,
    RolesGuard,
  ],
  exports: [],
})
export class ExerciseProgressModule {}
