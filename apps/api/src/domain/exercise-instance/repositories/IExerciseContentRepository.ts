import { IRepository } from "../../shared/repositories/IRepository";
import { ExerciseContent } from "../entities/ExerciseContent";
import { RecordId } from "../../shared/value-objects/RecordId";

/**
 * Exercise Content Repository Interface
 *
 * Manages exercise content (AI-generated content for exercise instances)
 */
export interface IExerciseContentRepository
  extends IRepository<ExerciseContent> {
  /**
   * Finds content by exercise instance
   * Returns the current (latest) content for an instance
   */
  findByInstance(instanceId: RecordId): Promise<ExerciseContent | null>;

  /**
   * Finds all versions of content for an exercise instance
   * Useful for viewing content history
   */
  findVersionsByInstance(instanceId: RecordId): Promise<ExerciseContent[]>;

  /**
   * Finds content by generation request ID
   * Useful for tracing which generation request created which content
   */
  findByGenerationRequest(requestId: RecordId): Promise<ExerciseContent[]>;

  /**
   * Finds all published content
   */
  findPublished(): Promise<ExerciseContent[]>;

  /**
   * Finds all draft content
   */
  findDrafts(): Promise<ExerciseContent[]>;

  /**
   * Counts versions for an exercise instance
   */
  countVersionsByInstance(instanceId: RecordId): Promise<number>;
}
