import { DomainEvent } from "../../shared/events/DomainEvent";
import { RecordId } from "../../shared/value-objects/RecordId";

/**
 * ExerciseContentGeneratedEvent
 * Emitted when exercise content has been generated
 */
export class ExerciseContentGeneratedEvent extends DomainEvent {
  constructor(
    public readonly exerciseInstanceId: RecordId,
    public readonly contentId: RecordId,
    public readonly exerciseName: string,
  ) {
    super("ExerciseContentGenerated");
  }

  toJSON(): Record<string, any> {
    return {
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      exerciseInstanceId: this.exerciseInstanceId.toString(),
      contentId: this.contentId.toString(),
      exerciseName: this.exerciseName,
    };
  }
}
