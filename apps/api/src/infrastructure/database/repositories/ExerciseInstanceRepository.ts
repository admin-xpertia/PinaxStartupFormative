import { Injectable, Logger } from '@nestjs/common';
import { IExerciseInstanceRepository } from '../../../domain/exercise-instance/repositories/IExerciseInstanceRepository';
import { ExerciseInstance } from '../../../domain/exercise-instance/entities/ExerciseInstance';
import { ExerciseContent } from '../../../domain/exercise-instance/entities/ExerciseContent';
import { ContentStatus } from '../../../domain/exercise-instance/value-objects/ContentStatus';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { SurrealDbService } from '../../../core/database/surrealdb.service';
import { ExerciseMapper } from '../../mappers/ExerciseMapper';

/**
 * ExerciseInstanceRepository
 * Concrete implementation of IExerciseInstanceRepository using SurrealDB
 */
@Injectable()
export class ExerciseInstanceRepository implements IExerciseInstanceRepository {
  private readonly logger = new Logger(ExerciseInstanceRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: ExerciseMapper,
  ) {}

  /**
   * Finds an instance by ID
   */
  async findById(id: RecordId): Promise<ExerciseInstance | null> {
    try {
      const result = await this.db.select<any>(id.toString());

      if (!result || result.length === 0) {
        return null;
      }

      return this.mapper.instanceToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding instance by id: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all instances
   */
  async findAll(criteria?: any): Promise<ExerciseInstance[]> {
    try {
      const result = await this.db.select<any>('exercise_instance');
      return result.map((raw) => this.mapper.instanceToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding all instances', error);
      throw error;
    }
  }

  /**
   * Saves an instance (insert or update)
   */
  async save(instance: ExerciseInstance): Promise<ExerciseInstance> {
    try {
      const data = this.mapper.instanceToPersistence(instance);
      const id = instance.getId().toString();

      // Check if exists
      const exists = await this.exists(instance.getId());

      if (exists) {
        // Update existing
        await this.db.update(id, data);
      } else {
        // Create new
        await this.db.create(id, data);
      }

      // Return the saved instance
      const saved = await this.findById(instance.getId());
      return saved!;
    } catch (error) {
      this.logger.error(`Error saving instance: ${instance.getId().toString()}`, error);
      throw error;
    }
  }

  /**
   * Deletes an instance by ID
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
      this.logger.error(`Error deleting instance: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Checks if an instance exists
   */
  async exists(id: RecordId): Promise<boolean> {
    try {
      const result = await this.findById(id);
      return result !== null;
    } catch (error) {
      this.logger.error(`Error checking if instance exists: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all exercise instances for a proof point
   */
  async findByProofPoint(proofPointId: RecordId): Promise<ExerciseInstance[]> {
    try {
      const query = `
        SELECT * FROM exercise_instance
        WHERE proof_point = $proofPointId
        ORDER BY orden ASC
      `;

      const result = await this.db.query<any[]>(query, {
        proofPointId: proofPointId.toString(),
      });

      return result.map((raw) => this.mapper.instanceToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding instances by proof point: ${proofPointId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds instances by template
   */
  async findByTemplate(templateId: RecordId): Promise<ExerciseInstance[]> {
    try {
      const query = `
        SELECT * FROM exercise_instance
        WHERE template = $templateId
        ORDER BY created_at DESC
      `;

      const result = await this.db.query<any[]>(query, {
        templateId: templateId.toString(),
      });

      return result.map((raw) => this.mapper.instanceToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding instances by template: ${templateId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds an instance with its content
   */
  async findWithContent(id: RecordId): Promise<{
    instance: ExerciseInstance;
    content?: ExerciseContent;
  } | null> {
    try {
      const instance = await this.findById(id);
      if (!instance) {
        return null;
      }

      // Get content if available
      let content: ExerciseContent | undefined;
      const contenidoActual = instance.getContenidoActual();
      if (contenidoActual) {
        const contentResult = await this.db.select<any>(contenidoActual.toString());
        if (contentResult && contentResult.length > 0) {
          content = this.mapper.contentToDomain(contentResult[0]);
        }
      }

      return {
        instance,
        content,
      };
    } catch (error) {
      this.logger.error(`Error finding instance with content: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds instances by content status
   */
  async findByStatus(proofPointId: RecordId, status: ContentStatus): Promise<ExerciseInstance[]> {
    try {
      const query = `
        SELECT * FROM exercise_instance
        WHERE proof_point = $proofPointId AND estado_contenido = $estado
        ORDER BY orden ASC
      `;

      const result = await this.db.query<any[]>(query, {
        proofPointId: proofPointId.toString(),
        estado: status.getValue(),
      });

      return result.map((raw) => this.mapper.instanceToDomain(raw));
    } catch (error) {
      this.logger.error(
        `Error finding instances by status: ${proofPointId.toString()}, ${status.getValue()}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Reorders instances within a proof point
   */
  async reorder(proofPointId: RecordId, instanceOrders: Map<RecordId, number>): Promise<void> {
    try {
      // Update each instance with its new order
      for (const [instanceId, newOrder] of instanceOrders.entries()) {
        const query = `
          UPDATE $instanceId SET orden = $orden, updated_at = time::now()
        `;

        await this.db.query(query, {
          instanceId: instanceId.toString(),
          orden: newOrder,
        });
      }
    } catch (error) {
      this.logger.error(`Error reordering instances for proof point: ${proofPointId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Counts instances by proof point
   */
  async countByProofPoint(proofPointId: RecordId): Promise<number> {
    try {
      const query = `
        SELECT count() AS total FROM exercise_instance
        WHERE proof_point = $proofPointId
        GROUP ALL
      `;

      const result = await this.db.query<any[]>(query, {
        proofPointId: proofPointId.toString(),
      });

      if (result.length === 0) {
        return 0;
      }

      return result[0].total || 0;
    } catch (error) {
      this.logger.error(`Error counting instances by proof point: ${proofPointId.toString()}`, error);
      throw error;
    }
  }
}
