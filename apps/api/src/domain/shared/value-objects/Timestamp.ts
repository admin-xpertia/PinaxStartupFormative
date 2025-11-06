/**
 * Timestamp Value Object
 * Represents a point in time with validation and utility methods
 * Immutable and type-safe
 */

export class Timestamp {
  private constructor(private readonly value: Date) {
    this.validate();
  }

  /**
   * Creates a Timestamp from the current time
   */
  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  /**
   * Creates a Timestamp from a Date object
   */
  static fromDate(date: Date): Timestamp {
    return new Timestamp(new Date(date.getTime()));
  }

  /**
   * Creates a Timestamp from an ISO string
   */
  static fromISOString(isoString: string): Timestamp {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ISO string: "${isoString}"`);
    }

    return new Timestamp(date);
  }

  /**
   * Creates a Timestamp from milliseconds since epoch
   */
  static fromMillis(millis: number): Timestamp {
    return new Timestamp(new Date(millis));
  }

  /**
   * Returns the Date object (copy to maintain immutability)
   */
  toDate(): Date {
    return new Date(this.value.getTime());
  }

  /**
   * Returns ISO string representation
   */
  toISOString(): string {
    return this.value.toISOString();
  }

  /**
   * Returns milliseconds since epoch
   */
  toMillis(): number {
    return this.value.getTime();
  }

  /**
   * Checks if this timestamp is before another
   */
  isBefore(other: Timestamp): boolean {
    return this.value.getTime() < other.value.getTime();
  }

  /**
   * Checks if this timestamp is after another
   */
  isAfter(other: Timestamp): boolean {
    return this.value.getTime() > other.value.getTime();
  }

  /**
   * Checks if two timestamps are equal
   */
  equals(other: Timestamp): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  /**
   * Returns difference in milliseconds
   */
  diff(other: Timestamp): number {
    return this.value.getTime() - other.value.getTime();
  }

  /**
   * Adds milliseconds and returns new Timestamp
   */
  addMillis(millis: number): Timestamp {
    return new Timestamp(new Date(this.value.getTime() + millis));
  }

  /**
   * Adds days and returns new Timestamp
   */
  addDays(days: number): Timestamp {
    return this.addMillis(days * 24 * 60 * 60 * 1000);
  }

  /**
   * Adds hours and returns new Timestamp
   */
  addHours(hours: number): Timestamp {
    return this.addMillis(hours * 60 * 60 * 1000);
  }

  /**
   * Validates the timestamp
   */
  private validate(): void {
    if (!(this.value instanceof Date)) {
      throw new Error('Timestamp value must be a Date object');
    }

    if (isNaN(this.value.getTime())) {
      throw new Error('Invalid date');
    }
  }

  /**
   * Converts to JSON representation (ISO string)
   */
  toJSON(): string {
    return this.toISOString();
  }
}
