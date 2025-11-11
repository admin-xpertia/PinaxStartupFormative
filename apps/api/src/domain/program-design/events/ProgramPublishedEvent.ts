import { DomainEvent } from "../../shared/events/DomainEvent";
import { RecordId } from "../../shared/value-objects/RecordId";

/**
 * ProgramPublishedEvent
 * Emitted when a program is published
 */
export class ProgramPublishedEvent extends DomainEvent {
  constructor(
    public readonly programaId: RecordId,
    public readonly programaNombre: string,
  ) {
    super("ProgramPublished");
  }

  toJSON(): Record<string, any> {
    return {
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      programaId: this.programaId.toString(),
      programaNombre: this.programaNombre,
    };
  }
}
