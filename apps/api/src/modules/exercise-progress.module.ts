import { Module } from '@nestjs/common';
import { SurrealDbModule } from '../core/database/surrealdb.module';

// Controllers
import { ExerciseProgressController } from '../presentation/controllers/exercise-progress/exercise-progress.controller';

/**
 * ExerciseProgressModule
 * Module for Exercise Progress Management (Student Progress Tracking)
 *
 * Provides:
 * - REST API endpoints for students to track exercise progress
 * - Start, save progress, and complete exercises
 */
@Module({
  imports: [SurrealDbModule],
  controllers: [ExerciseProgressController],
  providers: [],
  exports: [],
})
export class ExerciseProgressModule {}
