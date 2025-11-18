import { Module } from "@nestjs/common";
import { SurrealDbModule } from "../core/database/surrealdb.module";

// Controllers
import { ExerciseProgressController } from "../presentation/controllers/exercise-progress/exercise-progress.controller";

// Services
import { OpenAIService } from "../infrastructure/ai/OpenAIService";
import { ShadowMonitorService } from "../application/exercise-instance/services/ShadowMonitorService";

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
  providers: [OpenAIService, ShadowMonitorService],
  exports: [],
})
export class ExerciseProgressModule {}
