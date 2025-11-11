import { RecordId } from "../value-objects/RecordId";

/**
 * Base interface for all Repositories
 * Repositories provide an abstraction layer over data access
 * They work with domain entities and hide persistence details
 */
export interface IRepository<T> {
  /**
   * Finds an entity by its ID
   * Returns null if not found
   */
  findById(id: RecordId): Promise<T | null>;

  /**
   * Finds all entities
   * Can be filtered by optional criteria
   */
  findAll(criteria?: any): Promise<T[]>;

  /**
   * Saves an entity (insert or update)
   * Returns the saved entity with generated ID if new
   */
  save(entity: T): Promise<T>;

  /**
   * Deletes an entity by ID
   * Returns true if deleted, false if not found
   */
  delete(id: RecordId): Promise<boolean>;

  /**
   * Checks if an entity exists by ID
   */
  exists(id: RecordId): Promise<boolean>;
}
