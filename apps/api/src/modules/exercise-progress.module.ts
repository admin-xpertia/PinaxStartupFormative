import { Module } from '@nestjs/common';
import { SurrealDbModule } from '../core/database/surrealdb.module';

// Controllers
import { ExerciseProgressController } from '../presentation/controllers/exercise-progress/exercise-progress.controller';

// Services
import { OpenAIService } from '../infrastructure/ai/OpenAIService';

/**
 * ExerciseProgressModule
 * Module for Exercise Progress Management (Student Progress Tracking)
 *
 * Provides:
 * - REST API endpoints for students to track exercise progress
 * - Start, save progress, and complete exercises
 * - AI-powered feedback generation
 */
@Module({
  imports: [SurrealDbModule],
  controllers: [ExerciseProgressController],
  providers: [OpenAIService],
  exports: [],
})
export class ExerciseProgressModule {}
