import { RecordId } from '../value-objects/RecordId';

/**
 * Base class for all Domain Entities
 * Entities have identity (ID) and can be distinguished from each other
 * even if they have the same attribute values
 */
export abstract class Entity<T> {
  protected readonly id: RecordId;
  protected props: T;

  constructor(id: RecordId, props: T) {
    this.id = id;
    this.props = props;
  }

  /**
   * Returns the entity's unique identifier
   */
  getId(): RecordId {
    return this.id;
  }

  /**
   * Returns the entity's properties (protected access for subclasses)
   */
  protected getProps(): T {
    return this.props;
  }

  /**
   * Checks if two entities are the same based on their ID
   */
  equals(entity?: Entity<T>): boolean {
    if (!entity) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this.id.equals(entity.id);
  }

  /**
   * Returns string representation of the entity
   */
  toString(): string {
    return `${this.constructor.name}(${this.id.toString()})`;
  }
}
