import { Injectable, Logger } from '@nestjs/common';
import { IExerciseTemplateRepository } from '../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository';
import { ExerciseTemplate } from '../../../domain/exercise-catalog/entities/ExerciseTemplate';
import { ExerciseCategory } from '../../../domain/exercise-catalog/value-objects/ExerciseCategory';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { SurrealDbService } from '../../../core/database/surrealdb.service';
import { ExerciseMapper } from '../../mappers/ExerciseMapper';

/**
 * ExerciseTemplateRepository
 * Concrete implementation of IExerciseTemplateRepository using SurrealDB
 */
@Injectable()
export class ExerciseTemplateRepository implements IExerciseTemplateRepository {
  private readonly logger = new Logger(ExerciseTemplateRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: ExerciseMapper,
  ) {}

  /**
   * Finds a template by ID
   */
  async findById(id: RecordId): Promise<ExerciseTemplate | null> {
    try {
      const result = await this.db.select<any>(id.toString());

      if (!result || result.length === 0) {
        return null;
      }

      return this.mapper.templateToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding template by id: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all templates
   */
  async findAll(criteria?: any): Promise<ExerciseTemplate[]> {
    try {
      const result = await this.db.select<any>('exercise_template');
      return result.map((raw) => this.mapper.templateToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding all templates', error);
      throw error;
    }
  }

  /**
   * Saves a template (insert or update)
   */
  async save(template: ExerciseTemplate): Promise<ExerciseTemplate> {
    try {
      const data = this.mapper.templateToPersistence(template);
      const id = template.getId().toString();

      // Check if exists
      const exists = await this.exists(template.getId());

      if (exists) {
        // Update existing
        await this.db.update(id, data);
      } else {
        // Create new
        await this.db.create(id, data);
      }

      // Return the saved template
      const saved = await this.findById(template.getId());
      return saved!;
    } catch (error) {
      this.logger.error(`Error saving template: ${template.getId().toString()}`, error);
      throw error;
    }
  }

  /**
   * Deletes a template by ID
   */
  async delete(id: RecordId): Promise<boolean> {
    try {
      const exists = await this.exists(id);
      if (!exists) {
        return false;
      }

      await this.db.delete(id.toString());
      return true;
    } catch (error) {
      this.logger.error(`Error deleting template: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Checks if a template exists
   */
  async exists(id: RecordId): Promise<boolean> {
    try {
      const result = await this.findById(id);
      return result !== null;
    } catch (error) {
      this.logger.error(`Error checking if template exists: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all active templates
   */
  async findActive(): Promise<ExerciseTemplate[]> {
    try {
      const query = `
        SELECT * FROM exercise_template
        WHERE activo = true
        ORDER BY categoria, nombre
      `;

      const result = await this.db.query<any[]>(query);
      return result.map((raw) => this.mapper.templateToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding active templates', error);
      throw error;
    }
  }

  /**
   * Finds all official templates (system templates)
   */
  async findOfficial(): Promise<ExerciseTemplate[]> {
    try {
      const query = `
        SELECT * FROM exercise_template
        WHERE es_oficial = true
        ORDER BY categoria, nombre
      `;

      const result = await this.db.query<any[]>(query);
      return result.map((raw) => this.mapper.templateToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding official templates', error);
      throw error;
    }
  }

  /**
   * Finds templates by category
   */
  async findByCategory(category: ExerciseCategory): Promise<ExerciseTemplate[]> {
    try {
      const query = `
        SELECT * FROM exercise_template
        WHERE categoria = $categoria
        ORDER BY nombre
      `;

      const result = await this.db.query<any[]>(query, {
        categoria: category.getValue(),
      });

      return result.map((raw) => this.mapper.templateToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding templates by category: ${category.getValue()}`, error);
      throw error;
    }
  }

  /**
   * Finds templates grouped by category
   */
  async findGroupedByCategory(): Promise<Map<ExerciseCategory, ExerciseTemplate[]>> {
    try {
      const allTemplates = await this.findAll();
      const grouped = new Map<ExerciseCategory, ExerciseTemplate[]>();

      // Group by category
      for (const template of allTemplates) {
        const category = template.getCategoria();
        const categoryKey = category.getValue();

        // Find or create the category group
        let categoryGroup = Array.from(grouped.entries()).find(
          ([cat]) => cat.getValue() === categoryKey,
        );

        if (!categoryGroup) {
          grouped.set(category, []);
          categoryGroup = [category, []];
        }

        categoryGroup[1].push(template);
      }

      return grouped;
    } catch (error) {
      this.logger.error('Error grouping templates by category', error);
      throw error;
    }
  }

  /**
   * Finds templates with filters
   */
  async findWithFilters(filters: {
    categoria?: ExerciseCategory;
    esOficial?: boolean;
    activo?: boolean;
  }): Promise<ExerciseTemplate[]> {
    try {
      const conditions: string[] = [];
      const params: Record<string, any> = {};

      if (filters.categoria) {
        conditions.push('categoria = $categoria');
        params.categoria = filters.categoria.getValue();
      }

      if (filters.esOficial !== undefined) {
        conditions.push('es_oficial = $esOficial');
        params.esOficial = filters.esOficial;
      }

      if (filters.activo !== undefined) {
        conditions.push('activo = $activo');
        params.activo = filters.activo;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT * FROM exercise_template
        ${whereClause}
        ORDER BY categoria, nombre
      `;

      const result = await this.db.query<any[]>(query, params);
      return result.map((raw) => this.mapper.templateToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding templates with filters', error);
      throw error;
    }
  }
}
