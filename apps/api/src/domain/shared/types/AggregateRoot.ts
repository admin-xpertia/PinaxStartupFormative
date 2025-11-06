import { Entity } from './Entity';
import { DomainEvent } from '../events/DomainEvent';
import { RecordId } from '../value-objects/RecordId';

/**
 * Base class for Aggregate Roots
 * Aggregate Roots are entities that serve as the entry point to an aggregate
 * They maintain consistency boundaries and emit domain events
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private domainEvents: DomainEvent[] = [];

  constructor(id: RecordId, props: T) {
    super(id, props);
  }

  /**
   * Adds a domain event to be published
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Returns all domain events and clears the list
   */
  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  /**
   * Returns domain events without clearing them
   */
  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return this.domainEvents;
  }

  /**
   * Clears all domain events
   */
  public clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
