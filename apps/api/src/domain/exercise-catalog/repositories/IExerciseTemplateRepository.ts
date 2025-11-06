import { IRepository } from '../../shared/repositories/IRepository';
import { ExerciseTemplate } from '../entities/ExerciseTemplate';
import { ExerciseCategory } from '../value-objects/ExerciseCategory';
import { RecordId } from '../../shared/value-objects/RecordId';

/**
 * IExerciseTemplateRepository
 * Repository interface for ExerciseTemplate aggregate
 */
export interface IExerciseTemplateRepository extends IRepository<ExerciseTemplate> {
  /**
   * Finds all active templates
   */
  findActive(): Promise<ExerciseTemplate[]>;

  /**
   * Finds all official templates (system templates)
   */
  findOfficial(): Promise<ExerciseTemplate[]>;

  /**
   * Finds templates by category
   */
  findByCategory(category: ExerciseCategory): Promise<ExerciseTemplate[]>;

  /**
   * Finds templates grouped by category
   */
  findGroupedByCategory(): Promise<Map<ExerciseCategory, ExerciseTemplate[]>>;

  /**
   * Finds templates with filters
   */
  findWithFilters(filters: {
    categoria?: ExerciseCategory;
    esOficial?: boolean;
    activo?: boolean;
  }): Promise<ExerciseTemplate[]>;
}
