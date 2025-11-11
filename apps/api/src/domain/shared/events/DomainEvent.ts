import { Timestamp } from "../value-objects/Timestamp";

/**
 * Base interface for all Domain Events
 * Domain events represent things that have happened in the domain
 * They are immutable and named in past tense (e.g., ProgramPublished)
 */
export abstract class DomainEvent {
  public readonly occurredAt: Timestamp;
  public readonly eventName: string;

  constructor(eventName: string) {
    this.occurredAt = Timestamp.now();
    this.eventName = eventName;
  }

  /**
   * Returns the event as a plain object for serialization
   */
  abstract toJSON(): Record<string, any>;
}
