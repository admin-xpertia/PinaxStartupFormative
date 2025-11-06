import { Module } from '@nestjs/common';
import { SurrealDbModule } from '../core/database/surrealdb.module';

// Mappers
import { ExerciseMapper } from '../infrastructure/mappers/ExerciseMapper';

// Repositories
import { ExerciseTemplateRepository } from '../infrastructure/database/repositories/ExerciseTemplateRepository';

/**
 * ExerciseCatalogModule
 * Module for Exercise Catalog bounded context
 *
 * Provides:
 * - ExerciseTemplate repository
 * - Exercise mapper
 */
@Module({
  imports: [SurrealDbModule],
  providers: [
    // Mappers
    ExerciseMapper,

    // Repositories - provided as their interface token for DI
    {
      provide: 'IExerciseTemplateRepository',
      useClass: ExerciseTemplateRepository,
    },
  ],
  exports: [
    // Export repository for use in other modules
    'IExerciseTemplateRepository',

    // Export mapper for potential reuse
    ExerciseMapper,
  ],
})
export class ExerciseCatalogModule {}
