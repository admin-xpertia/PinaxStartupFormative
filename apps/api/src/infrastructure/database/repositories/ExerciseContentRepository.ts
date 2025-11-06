import { Injectable, Logger } from '@nestjs/common';
import { IExerciseContentRepository } from '../../../domain/exercise-instance/repositories/IExerciseInstanceRepository';
import { ExerciseContent } from '../../../domain/exercise-instance/entities/ExerciseContent';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { SurrealDbService } from '../../../core/database/surrealdb.service';
import { ExerciseMapper } from '../../mappers/ExerciseMapper';

/**
 * ExerciseContentRepository
 * Concrete implementation of IExerciseContentRepository using SurrealDB
 */
@Injectable()
export class ExerciseContentRepository implements IExerciseContentRepository {
  private readonly logger = new Logger(ExerciseContentRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: ExerciseMapper,
  ) {}

  /**
   * Finds content by ID
   */
  async findById(id: RecordId): Promise<ExerciseContent | null> {
    try {
      const result = await this.db.select<any>(id.toString());

      if (!result || result.length === 0) {
        return null;
      }

      return this.mapper.contentToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding content by id: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all content
   */
  async findAll(criteria?: any): Promise<ExerciseContent[]> {
    try {
      const result = await this.db.select<any>('exercise_content');
      return result.map((raw) => this.mapper.contentToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding all content', error);
      throw error;
    }
  }

  /**
   * Saves content (insert or update)
   */
  async save(content: ExerciseContent): Promise<ExerciseContent> {
    try {
      const data = this.mapper.contentToPersistence(content);
      const id = content.getId().toString();

      // Check if exists
      const exists = await this.exists(content.getId());

      if (exists) {
        // Update existing
        await this.db.update(id, data);
      } else {
        // Create new
        await this.db.create(id, data);
      }

      // Return the saved content
      const saved = await this.findById(content.getId());
      return saved!;
    } catch (error) {
      this.logger.error(`Error saving content: ${content.getId().toString()}`, error);
      throw error;
    }
  }

  /**
   * Deletes content by ID
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
      this.logger.error(`Error deleting content: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Checks if content exists
   */
  async exists(id: RecordId): Promise<boolean> {
    try {
      const result = await this.findById(id);
      return result !== null;
    } catch (error) {
      this.logger.error(`Error checking if content exists: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds content for a specific exercise instance
   */
  async findByInstance(instanceId: RecordId): Promise<ExerciseContent | null> {
    try {
      const query = `
        SELECT * FROM exercise_content
        WHERE exercise_instance = $instanceId
        ORDER BY version DESC
        LIMIT 1
      `;

      const result = await this.db.query<any[]>(query, {
        instanceId: instanceId.toString(),
      });

      if (result.length === 0) {
        return null;
      }

      return this.mapper.contentToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding content by instance: ${instanceId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all versions of content for an instance
   */
  async findVersionsByInstance(instanceId: RecordId): Promise<ExerciseContent[]> {
    try {
      const query = `
        SELECT * FROM exercise_content
        WHERE exercise_instance = $instanceId
        ORDER BY version DESC
      `;

      const result = await this.db.query<any[]>(query, {
        instanceId: instanceId.toString(),
      });

      return result.map((raw) => this.mapper.contentToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding versions by instance: ${instanceId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds content by generation request
   */
  async findByGenerationRequest(requestId: RecordId): Promise<ExerciseContent[]> {
    try {
      const query = `
        SELECT * FROM exercise_content
        WHERE generacion_request = $requestId
        ORDER BY created_at DESC
      `;

      const result = await this.db.query<any[]>(query, {
        requestId: requestId.toString(),
      });

      return result.map((raw) => this.mapper.contentToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding content by generation request: ${requestId.toString()}`, error);
      throw error;
    }
  }
}
