import { IRepository } from '../../shared/repositories/IRepository';
import { ExerciseInstance } from '../entities/ExerciseInstance';
import { ExerciseContent } from '../entities/ExerciseContent';
import { RecordId } from '../../shared/value-objects/RecordId';
import { ContentStatus } from '../value-objects/ContentStatus';

/**
 * IExerciseInstanceRepository
 * Repository interface for ExerciseInstance aggregate
 */
export interface IExerciseInstanceRepository extends IRepository<ExerciseInstance> {
  /**
   * Finds all exercise instances for a proof point
   */
  findByProofPoint(proofPointId: RecordId): Promise<ExerciseInstance[]>;

  /**
   * Finds instances by template
   */
  findByTemplate(templateId: RecordId): Promise<ExerciseInstance[]>;

  /**
   * Finds an instance with its content
   */
  findWithContent(id: RecordId): Promise<{
    instance: ExerciseInstance;
    content?: ExerciseContent;
  } | null>;

  /**
   * Finds instances by content status
   */
  findByStatus(proofPointId: RecordId, status: ContentStatus): Promise<ExerciseInstance[]>;

  /**
   * Reorders instances within a proof point
   */
  reorder(proofPointId: RecordId, instanceOrders: Map<RecordId, number>): Promise<void>;

  /**
   * Counts instances by proof point
   */
  countByProofPoint(proofPointId: RecordId): Promise<number>;
}

/**
 * IExerciseContentRepository
 * Repository interface for ExerciseContent entity
 */
export interface IExerciseContentRepository extends IRepository<ExerciseContent> {
  /**
   * Finds content for a specific exercise instance
   */
  findByInstance(instanceId: RecordId): Promise<ExerciseContent | null>;

  /**
   * Finds all versions of content for an instance
   */
  findVersionsByInstance(instanceId: RecordId): Promise<ExerciseContent[]>;

  /**
   * Finds content by generation request
   */
  findByGenerationRequest(requestId: RecordId): Promise<ExerciseContent[]>;
}
